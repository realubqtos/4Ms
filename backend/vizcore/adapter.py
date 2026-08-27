"""Adapter: The Vizualizer pipeline → 4Ms SSE event stream.

Speaks the same event vocabulary the 4Ms frontend already consumes
(status / agent_complete / image_preview / complete / error) plus three
additive event types the extended hook understands:

  skeleton            — the extracted claim skeleton (user-inspectable)
  form_decision       — FULL/PARTIAL/NONE/REFUSE + rule + rationale
  verification_report — the deterministic check results + verdict

Design notes:
- Works keyless: the deterministic StubProvider drives the model stages, so
  verified mode runs even when GEMINI_API_KEY / Supabase are unconfigured.
- A REFUSE decision is NOT an error: it streams as a form_decision followed
  by a `complete` event with `refused: true` — the honest-refusal product
  surface (no coercion, no fabricated data).
- The canvas <img> receives the SVG as a data: URL; the full standalone
  HTML artifact (title + scope-of-validity attached) rides in `complete`
  and is what verification actually ran against.
- Skeleton confirmation is auto-accepted in chat flow for now; an
  interactive confirm step in AIChatPanel is the designed next increment.
"""
from __future__ import annotations

import base64
import re
import uuid
from typing import Any, AsyncGenerator, Optional

from . import catalog, renderer, verify_suite
from .providers import get_provider
from .schemas import MatchResult

MAX_REVISIONS = 2
PIPELINE_VERSION = "0.1.0-4ms"


def _ev(event_type: str, data: dict) -> dict:
    return {"type": event_type, "data": data}


def _svg_data_url(artifact_html: str) -> Optional[str]:
    m = re.search(r"<svg[\s\S]*?</svg>", artifact_html)
    if not m:
        return None
    svg = '<?xml version="1.0" encoding="UTF-8"?>' + m.group(0)
    b64 = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{b64}"


def _coerce_records(data_info: Optional[dict]) -> Optional[list[dict]]:
    """4Ms passes data_info as an arbitrary dict from uploads; accept either
    {'records': [...]} or a bare list. Anything else → no data (and the
    pipeline will refuse quantitative forms rather than invent values)."""
    if not data_info:
        return None
    if isinstance(data_info, list):
        return data_info or None
    if isinstance(data_info.get("records"), list) and data_info["records"]:
        return data_info["records"]
    return None


async def generate_verified(
    prompt: str,
    diagram_type: str,
    domain: str,
    user_id: str,
    project_id: Optional[str] = None,
    data_info: Optional[dict] = None,
    supabase_client: Any = None,
    provider_id: str = "stub-0.1",
) -> AsyncGenerator[dict, None]:
    try:
        provider = get_provider(provider_id)
        records = _coerce_records(data_info)

        # S1 — skeleton extraction
        yield _ev("status", {"message": "Verified mode: extracting claim skeleton…",
                             "stage": "skeleton"})
        skeleton = provider.extract_skeleton(prompt, records, context=domain)
        yield _ev("skeleton", {"skeleton": skeleton.model_dump()})
        yield _ev("agent_complete", {"agent": "SkeletonExtractor",
                                     "data": {"claim_type": skeleton.claim_type,
                                              "entities": len(skeleton.entities),
                                              "provider": provider.id}})

        # S2 — form dispatch (deterministic; the anti-canonicalization firewall)
        yield _ev("status", {"message": "Matching form to claim structure…",
                             "stage": "dispatch"})
        decision = catalog.dispatch(skeleton)
        yield _ev("form_decision", {"decision": decision.model_dump()})
        yield _ev("agent_complete", {"agent": "FormDispatcher",
                                     "data": {"match_result": decision.match_result.value,
                                              "construction_rule": decision.construction_rule,
                                              "families": decision.families}})

        if decision.match_result == MatchResult.REFUSE:
            yield _ev("status", {"message": "This claim cannot be faithfully visualized "
                                            "with the supported forms — refusing rather "
                                            "than coercing or fabricating.",
                                 "stage": "complete"})
            yield _ev("complete", {"figure_id": None,
                                   "data": {"refused": True,
                                            "decision": decision.model_dump(),
                                            "image_data": None}})
            return

        # S3 → S4 — spec, render, verification gate (bounded loop)
        report = None
        artifact_html = ""
        spec = None
        for iteration in range(MAX_REVISIONS + 1):
            yield _ev("status", {"message": f"Generating spec-mediated rendering "
                                            f"(iteration {iteration + 1})…",
                                 "stage": "visualization", "iteration": iteration + 1})
            spec = provider.generate_spec(skeleton, decision)
            artifact_html = renderer.render(spec, skeleton)

            yield _ev("status", {"message": "Running deterministic verification gate…",
                                 "stage": "verification", "iteration": iteration + 1})
            report = verify_suite.run_suite(artifact_html, spec, skeleton)
            report.iteration_count = iteration
            if report.verdict == "PASS":
                break
            # revise objectives are plan-conformance deltas only; the stub is
            # deterministic, so persistent failure surfaces after the loop —
            # by design: a failing report is a product outcome, never a
            # silent canonical fallback.

        image_data = _svg_data_url(artifact_html)
        if image_data and report and report.verdict == "PASS":
            yield _ev("image_preview", {"image_data": image_data,
                                        "iteration": report.iteration_count + 1})

        yield _ev("verification_report", {
            "report": report.model_dump() if report else None,
            "scope_of_validity": spec.scope_of_validity if spec else "",
            "form": spec.form if spec else None,
        })

        figure_id = None
        if supabase_client is not None and report is not None:
            figure_id = _save_to_supabase(
                supabase_client, user_id, project_id, prompt, diagram_type,
                domain, spec, artifact_html, report)

        yield _ev("status", {"message": "Verified generation complete."
                             if report and report.verdict == "PASS"
                             else "Verification FAILED — failing report attached.",
                             "stage": "complete"})
        yield _ev("complete", {
            "figure_id": figure_id,
            "data": {
                "image_data": image_data if report and report.verdict == "PASS" else None,
                "artifact_html": artifact_html,
                "specification": spec.model_dump() if spec else None,
                "verification_report": report.model_dump() if report else None,
                "verdict": report.verdict if report else "ERROR",
                "form": spec.form if spec else None,
                "pipeline_version": PIPELINE_VERSION,
                "provider_id": provider.id,
            }})

    except Exception as e:  # stream errors in-band like the incumbent orchestrator
        yield _ev("error", {"message": f"Verified pipeline error: {e}"})


def _save_to_supabase(sb, user_id, project_id, prompt, diagram_type, domain,
                      spec, artifact_html, report) -> Optional[str]:
    """Persist into the existing 4Ms figures/generations tables. The full
    provenance (spec + report + artifact) goes into diagram_data JSONB."""
    try:
        figure_data = {
            "user_id": user_id,
            "project_id": project_id,
            "type": diagram_type,
            "prompt": prompt,
            "domain": domain,
            "diagram_data": {
                "engine": "vizualizer",
                "pipeline_version": PIPELINE_VERSION,
                "form": spec.form,
                "artifact_html": artifact_html,
                "specification": spec.model_dump(),
                "verification_report": report.model_dump(),
            },
            "parameters": {"verdict": report.verdict,
                           "checks_passed": sum(c.passed for c in report.checks),
                           "checks_total": len(report.checks)},
            "iteration_count": report.iteration_count + 1,
            "status": "completed" if report.verdict == "PASS" else "verification_failed",
        }
        result = sb.table("figures").insert(figure_data).execute()
        if result.data:
            return result.data[0]["id"]
    except Exception:
        return None
    return None
