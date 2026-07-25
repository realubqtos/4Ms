"""Verification gate (S4) — deterministic suite over the annotated SVG/HTML.

Direct descendants of the Phase 2 battery instruments, including the seven
logged calibration refinements (notably: skip-stack exclusion of invisible
elements for the fabrication scan; ID-consistency enforced by construction
since renderer and suite read the same spec).

A visualization leaves the pipeline only with a passing report. A failing
report is a product outcome, surfaced to the user — never silently retried
into a canonical fallback.
"""
from __future__ import annotations

import re
import unicodedata
from html.parser import HTMLParser

from .schemas import CheckResult, Skeleton, VerificationReport, VizSpec

_SKIP_TAGS = {"style", "script", "desc", "defs"}
_NUM_RE = re.compile(r"\d+(?:\.\d+)?")


class ArtifactParser(HTMLParser):
    """Structural feature extraction; visible-text collection excludes
    invisible elements (Phase 2 calibration refinement, B4)."""

    def __init__(self):
        super().__init__()
        self._skip = 0
        self.entities: set[str] = set()
        self.entity_lanes: dict[str, str] = {}
        self.edges: list[dict] = []
        self.lane_ordinals: dict[str, int] = {}
        self.value_marks: list[dict] = []
        self.visible_text: list[str] = []
        self.has_title = False
        self.has_scope = False
        self.has_desc = False
        self.desc_len = 0
        self._in_desc = False
        self.svg_attrs: dict = {}

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in _SKIP_TAGS:
            self._skip += 1
        if tag == "desc":
            self._in_desc = True
        if tag == "svg":
            self.svg_attrs = a
        eid = a.get("data-entity-id")
        if eid:
            self.entities.add(eid)
            if a.get("data-lane"):
                self.entity_lanes[eid] = a["data-lane"]
        if a.get("data-lane") and a.get("data-level-ordinal"):
            self.lane_ordinals[a["data-lane"]] = int(a["data-level-ordinal"])
        if a.get("data-edge-type"):
            self.edges.append({"source": a.get("data-source", ""),
                               "target": a.get("data-target", ""),
                               "type": a["data-edge-type"]})
        if a.get("data-value-id"):
            self.value_marks.append(a)
        role = a.get("data-role", "")
        if role == "claim-title":
            self.has_title = True
        if role == "scope-of-validity":
            self.has_scope = True

    def handle_data(self, data):
        if self._in_desc:
            self.desc_len += len(data.strip())
        s = data.strip()
        if s and self._skip == 0:
            self.visible_text.append(unicodedata.normalize("NFKC", s))

    def handle_endtag(self, tag):
        if tag in _SKIP_TAGS and self._skip > 0:
            self._skip -= 1
        if tag == "desc":
            self._in_desc = False
            self.has_desc = True


def run_suite(html: str, spec: VizSpec, skeleton: Skeleton) -> VerificationReport:
    p = ArtifactParser()
    p.feed(html)
    checks: list[CheckResult] = []

    # C1 — entity coverage
    expected = {e.id for e in skeleton.entities}
    missing = expected - p.entities
    checks.append(CheckResult(
        id="entity-coverage", name="Entity coverage",
        passed=not missing,
        detail=f"{len(expected - missing)}/{len(expected)} skeleton entities present; "
               f"missing: {sorted(missing) or 'none'}"))

    # C2 — data tracing (canonical forms with data)
    if spec.form in {"bar", "line", "scatter"} and skeleton.data:
        yk = spec.encodings.get("y")
        xk = spec.encodings.get("x")
        supplied_y = [str(r[yk]) for r in skeleton.data]
        traced, mismatches = 0, []
        if spec.form == "scatter":
            supplied = {(str(r[xk]), str(r[yk])) for r in skeleton.data}
            found = {(m.get("data-value-x"), m.get("data-value-y")) for m in p.value_marks}
            traced = len(supplied & found)
            mismatches = sorted(supplied - found)
            total = len(supplied)
        else:
            found_vals = [m.get("data-value") for m in p.value_marks]
            total = len(supplied_y)
            for v in supplied_y:
                if v in found_vals:
                    traced += 1
                    found_vals.remove(v)
                else:
                    mismatches.append(v)
        extra = len(p.value_marks) - len(skeleton.data)
        checks.append(CheckResult(
            id="data-tracing", name="Data tracing (zero fabrication, zero loss)",
            passed=(traced == total and extra == 0),
            detail=f"{traced}/{total} supplied data traced to marks; "
                   f"unmatched: {mismatches or 'none'}; extra marks: {extra}",
            calibration_notes="ID consistency by construction: renderer and suite read the same spec"))

    # C3 — fabrication scan: visible numbers ⊆ claim values ∪ supplied data
    licensed = set()
    for v in spec.numerical_values_in_claim:
        licensed.update(_NUM_RE.findall(v))
    for r in (skeleton.data or []):
        for val in r.values():
            licensed.update(_NUM_RE.findall(str(val)))
    if spec.form in {"bar", "line", "scatter"} and skeleton.data:
        yk = spec.encodings.get("y")
        ys = [float(r[yk]) for r in skeleton.data]
        lo, hi = (0.0 if spec.form == "bar" else min(ys)), max(ys)
        if lo == hi:
            lo, hi = lo - 1, hi + 1
        for i in range(5):  # renderer's axis ticks are licensed derived text
            licensed.update(_NUM_RE.findall(f"{lo + (hi - lo) * i / 4:g}"))
        xk = spec.encodings.get("x")
        for r in skeleton.data:
            licensed.update(_NUM_RE.findall(str(r[xk])))
        if spec.form == "scatter":
            xs = [float(r[xk]) for r in skeleton.data]
            xlo, xhi = min(xs), max(xs)
            if xlo == xhi:
                xlo, xhi = xlo - 1, xhi + 1
            for i in range(5):
                licensed.update(_NUM_RE.findall(f"{xlo + (xhi - xlo) * i / 4:g}"))
    visible_nums = set()
    for t in p.visible_text:
        visible_nums.update(_NUM_RE.findall(t))
    unlicensed = visible_nums - licensed
    checks.append(CheckResult(
        id="fabrication-scan", name="No fabricated/interpolated values",
        passed=not unlicensed,
        detail=f"{len(visible_nums)} visible numerals, all licensed"
               if not unlicensed else f"UNLICENSED numerals: {sorted(unlicensed)}",
        calibration_notes="invisible-element skip-stack (Phase 2 refinement #7); "
                          "NFKC normalization (#6)"))

    # C4 — mark-function audit
    arbitrary = sum(1 for m in spec.mark_function_table if m.type == "arbitrary")
    checks.append(CheckResult(
        id="mark-function-audit", name="Mark-function audit",
        passed=bool(spec.mark_function_table) and p.has_desc and p.desc_len > 50,
        detail=f"{len(spec.mark_function_table)} marks declared "
               f"({arbitrary} explicitly arbitrary); SVG desc "
               f"{'present' if p.has_desc else 'MISSING'}"))

    # C5 — static completeness + scope of validity
    checks.append(CheckResult(
        id="static-completeness", name="Static completeness & scope-of-validity",
        passed=p.has_title and p.has_scope and bool(spec.scope_of_validity),
        detail=f"claim title: {p.has_title}; scope statement: {p.has_scope}"))

    # C6 — inherited warnings compliance
    checks.append(CheckResult(
        id="inherited-warnings", name="Inherited warnings compliance",
        passed=bool(spec.inherited_warnings) and
               all(w.compliance for w in spec.inherited_warnings),
        detail=f"{len(spec.inherited_warnings)} warnings, all with compliance notes"))

    # form-specific checks
    if spec.form == "typed-lane-graph":
        expected_edges = {(r.source, r.target, r.type) for r in skeleton.relations}
        found_edges = {(e["source"], e["target"], e["type"]) for e in p.edges}
        missing_e = expected_edges - found_edges
        extra_e = found_edges - expected_edges
        checks.append(CheckResult(
            id="edge-coverage", name="Edge coverage & type correctness",
            passed=not missing_e and not extra_e,
            detail=f"{len(expected_edges & found_edges)}/{len(expected_edges)} edges; "
                   f"missing: {sorted(missing_e) or 'none'}; extra: {sorted(extra_e) or 'none'}"))
        levels = spec.encodings.get("levels", [])
        ordinal_ok = all(p.lane_ordinals.get(lv) == i + 1 for i, lv in enumerate(levels))
        lane_ok = all(p.entity_lanes.get(eid) == e.get("lane")
                      for eid, e in spec.entities.items())
        checks.append(CheckResult(
            id="lane-ordering", name="Lane ordering & assignment",
            passed=ordinal_ok and lane_ok,
            detail=f"ordinals: {p.lane_ordinals}; assignments correct: {lane_ok}"))

    if spec.form == "potential-landscape":
        m = re.search(r'<path\s+d="([^"]+)"[^>]*data-mark="potential-curve"', html)
        curve_d = m.group(1) if m else ""
        ys = [float(v) for v in re.findall(r"[\d.]+ ([\d.]+)(?:,|\s|$)", curve_d)]
        passed_asym, detail = False, "curve path not found"
        if ys:
            ridge = min(ys)
            left = [y for y in ys[: len(ys) // 2]]
            right = [y for y in ys[len(ys) // 2:]]
            d_cap, d_dep = max(left) - ridge, max(right) - ridge
            passed_asym = d_dep > d_cap * 1.3
            detail = (f"capable depth {d_cap:.0f}px, dependent depth {d_dep:.0f}px, "
                      f"ratio {d_dep / max(d_cap, 1):.2f} (need >1.3)")
        checks.append(CheckResult(
            id="basin-asymmetry", name="Basin asymmetry (schematic-ordinal depth)",
            passed=passed_asym, detail=detail))
        checks.append(CheckResult(
            id="no-metric-invitation", name="No metric reading invited",
            passed="axis-tick-y" not in html and "gridline" not in html,
            detail="no y-axis scale or gridlines on schematic curve"))

    return VerificationReport(checks=checks).finalize()
