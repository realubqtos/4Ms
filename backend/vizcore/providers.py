"""ModelProvider interface + registry (architecture.md §3, §3b).

Model-flexible in architecture, model-disciplined in operation:
any model is admissible via the admission protocol (schema conformance →
battery regression → calibration pass → pinning); none is trusted without it.

Providers implement two model stages:
  S1  extract_skeleton(claim, data, context) -> Skeleton
  S3  generate_spec(skeleton, decision)      -> VizSpec

The StubProvider is a deterministic, rule-based reference implementation
used for in-workspace demos and tests (no network, no key). It is honestly
labeled: its skeleton extraction is heuristic, which is exactly why the
product surfaces the skeleton for user confirmation before drawing.
"""
from __future__ import annotations

import os
import re
from abc import ABC, abstractmethod
from typing import Any, Optional

from .schemas import (ClaimValue, Decision, Dimension, DimensionKind, Entity,
                      InheritedWarning, MarkFunction, Relation, Skeleton,
                      VizSpec)


class ModelProvider(ABC):
    id: str = "abstract"
    admitted: bool = False   # set True only after the admission protocol

    @abstractmethod
    def extract_skeleton(self, claim: str, data: Optional[list[dict[str, Any]]],
                         context: str = "") -> Skeleton: ...

    @abstractmethod
    def generate_spec(self, skeleton: Skeleton, decision: Decision) -> VizSpec: ...


# ── numeric extraction shared by stub stages ────────────────────────
_NUM_RE = re.compile(r"(?<![\w.])(\d+(?:\.\d+)?(?:%|×|x)?)(?![\w.])")


def extract_claim_values(claim: str) -> list[ClaimValue]:
    vals = []
    for i, m in enumerate(_NUM_RE.finditer(claim)):
        vals.append(ClaimValue(id=f"cv{i}", value=m.group(1),
                               source_span=claim[max(0, m.start() - 20):m.end() + 20].strip()))
    return vals


class StubProvider(ModelProvider):
    """Deterministic reference provider for demo/test. NOT admitted for
    production claims — its role is to exercise the deterministic pipeline."""

    id = "stub-0.1"
    admitted = False

    # ---- S1 ----
    def extract_skeleton(self, claim: str, data=None, context: str = "") -> Skeleton:
        c = claim.lower()
        values = extract_claim_values(claim)

        # dynamical-system signature
        if any(k in c for k in ("attractor", "bistable", "stable state", "restoring force",
                                "potential", "collapses into")):
            return Skeleton(
                claim=claim, claim_type="dynamical-system",
                source_formalism="potential-function",
                entities=[
                    Entity(id="capable-state", type="attractor", label="Capable state"),
                    Entity(id="dependent-state", type="attractor", label="Dependent state"),
                    Entity(id="system", type="state-marker", label="The system"),
                    Entity(id="threshold", type="boundary", label="Critical threshold"),
                    Entity(id="destabilizing-force", type="force", label="Destabilizing force"),
                    Entity(id="restoring-force", type="force", label="Restoring force"),
                ],
                dimensions=[
                    Dimension(id="capability-axis", kind=DimensionKind.quantitative,
                              label="capability"),
                    Dimension(id="potential", kind=DimensionKind.quantitative,
                              label="potential (schematic)"),
                ],
                relations=[
                    Relation(source="destabilizing-force", target="dependent-state",
                             type="force", label="pushes toward"),
                    Relation(source="restoring-force", target="capable-state",
                             type="force", label="restores toward"),
                    Relation(source="threshold", target="capable-state", type="boundary"),
                    Relation(source="threshold", target="dependent-state", type="boundary"),
                ],
                claim_values=values, data=data)

        # variance-envelope signature (gated route — honest refusal downstream)
        if any(k in c for k in ("variance", "convergence", "envelope", "spread")) and \
           any(k in c for k in ("over time", "phase", "across sessions")):
            return Skeleton(claim=claim, claim_type="variance-envelope",
                            claim_values=values, data=data)

        # dissimilarity-space signature (gated route)
        if any(k in c for k in ("dissimilarity", "idea space", "idea-space", "semantic distance")):
            return Skeleton(claim=claim, claim_type="dissimilarity-space",
                            claim_values=values, data=data)

        # architecture signature
        if any(k in c for k in ("architecture", "levels", "dependencies", "framework")) and \
           any(k in c for k in ("mechanism", "diagnostic", "typed", "feeds")):
            ents, rels, levels = self._parse_architecture(claim)
            return Skeleton(
                claim=claim, claim_type="architecture",
                entities=ents, relations=rels,
                dimensions=[Dimension(id="level", kind=DimensionKind.ordinal,
                                      label="assessment level", levels=levels)],
                claim_values=values, data=data)

        # canonical, data-bearing claim types
        if data:
            keys = list(data[0].keys())
            num_keys = [k for k in keys if isinstance(data[0][k], (int, float))]
            cat_keys = [k for k in keys if isinstance(data[0][k], str)]
            temporal = [k for k in keys if k.lower() in
                        ("year", "month", "date", "time", "t", "quarter", "week", "day")]
            if len(num_keys) >= 2 and any(k in c for k in ("correlat", "relationship", "versus", "against")):
                return Skeleton(
                    claim=claim, claim_type="correlation",
                    dimensions=[Dimension(id=num_keys[0], kind=DimensionKind.quantitative, label=num_keys[0]),
                                Dimension(id=num_keys[1], kind=DimensionKind.quantitative, label=num_keys[1])],
                    entities=[Entity(id=f"r{i}", type="datum", label=str(i)) for i in range(len(data))],
                    claim_values=values, data=data)
            if temporal and num_keys:
                measure = next(k for k in num_keys if k not in temporal)
                return Skeleton(
                    claim=claim, claim_type="trend-over-time",
                    dimensions=[Dimension(id=temporal[0], kind=DimensionKind.temporal, label=temporal[0]),
                                Dimension(id=measure, kind=DimensionKind.quantitative, label=measure)],
                    entities=[Entity(id=f"r{i}", type="datum", label=str(r[temporal[0]])) for i, r in enumerate(data)],
                    claim_values=values, data=data)
            if cat_keys and num_keys:
                return Skeleton(
                    claim=claim, claim_type="quantity-comparison",
                    dimensions=[Dimension(id=cat_keys[0], kind=DimensionKind.nominal, label=cat_keys[0]),
                                Dimension(id=num_keys[0], kind=DimensionKind.quantitative, label=num_keys[0])],
                    entities=[Entity(id=f"r{i}", type="category", label=str(r[cat_keys[0]])) for i, r in enumerate(data)],
                    claim_values=values, data=data)

        # data-shaped ask without data → downstream refusal (no fabrication)
        if any(k in c for k in ("compare", "trend", "correlat", "how many", "how much", "over time")):
            ct = ("trend-over-time" if ("trend" in c or "over time" in c)
                  else "correlation" if "correlat" in c else "quantity-comparison")
            return Skeleton(claim=claim, claim_type=ct, claim_values=values, data=None)

        return Skeleton(claim=claim, claim_type="unclassified", claim_values=values, data=data)

    @staticmethod
    def _parse_architecture(claim: str):
        """Heuristic entity/relation parse for architecture claims. Deliberately
        conservative: only what the claim states; the user-facing skeleton
        editor is the correction surface."""
        ents = [
            Entity(id="rep-quality", type="dimension", label="Representational quality", level="primary"),
            Entity(id="comprehension", type="dimension", label="Comprehension contribution", level="primary"),
            Entity(id="transfer", type="dimension", label="Transfer capacity", level="primary"),
            Entity(id="coherence", type="dimension", label="System coherence", level="system"),
            Entity(id="diversity", type="dimension", label="Epistemic diversity", level="system"),
            Entity(id="scaffolding", type="dimension", label="Scaffolding trajectory", level="meta"),
        ]
        rels = [
            Relation(source="rep-quality", target="comprehension", type="MECHANISM"),
            Relation(source="comprehension", target="transfer", type="DIAGNOSTIC"),
            Relation(source="primary-level", target="system-level", type="COMPOSITION"),
            Relation(source="diversity", target="transfer", type="PREDICTOR"),
            Relation(source="scaffolding", target="primary-level", type="SAMPLING"),
            Relation(source="scaffolding", target="system-level", type="SAMPLING"),
        ]
        return ents, rels, ["primary", "system", "meta"]

    # ---- S3 ----
    def generate_spec(self, skeleton: Skeleton, decision: Decision) -> VizSpec:
        from . import specgen  # deterministic spec templates per decision route
        return specgen.build_spec(skeleton, decision)


class AnthropicProvider(ModelProvider):
    """Production provider skeleton. Requires ANTHROPIC_API_KEY at runtime and
    passage of the admission protocol before `admitted` may be set."""

    def __init__(self, model: str = "claude-sonnet-latest"):
        self.model = model
        self.id = f"anthropic:{model}"

    def _client(self):
        if not os.environ.get("ANTHROPIC_API_KEY"):
            raise RuntimeError("ANTHROPIC_API_KEY not set — provider unavailable. "
                               "Use provider 'stub-0.1' for keyless demo runs.")
        import anthropic  # lazy import
        return anthropic.Anthropic()

    def extract_skeleton(self, claim, data=None, context=""):
        raise NotImplementedError("Wire structured-output prompt at deploy; "
                                  "admission protocol must run first (architecture.md §3b).")

    def generate_spec(self, skeleton, decision):
        raise NotImplementedError("Wire structured-output prompt at deploy; "
                                  "admission protocol must run first (architecture.md §3b).")


REGISTRY: dict[str, ModelProvider] = {"stub-0.1": StubProvider()}


def get_provider(provider_id: str = "stub-0.1") -> ModelProvider:
    if provider_id not in REGISTRY:
        raise KeyError(f"Unknown provider {provider_id!r}. Registered: {list(REGISTRY)}")
    return REGISTRY[provider_id]


class GeminiProvider(ModelProvider):
    """4Ms-native provider scaffold (the platform's incumbent model vendor).
    Same two-method contract as every provider. NOT admitted: per the model
    admission protocol (the-vizualizer architecture §3b) it must pass schema
    conformance, the Phase 2 battery regression, and a calibration pass
    before `admitted` may be set. Until then, verified mode runs on the
    deterministic stub."""

    def __init__(self, model: str = "gemini-pro"):
        self.model = model
        self.id = f"gemini:{model}"

    def _model(self):
        if not os.environ.get("GEMINI_API_KEY"):
            raise RuntimeError("GEMINI_API_KEY not set — provider unavailable.")
        import google.generativeai as genai  # lazy import
        return genai.GenerativeModel(self.model)

    def extract_skeleton(self, claim, data=None, context=""):
        raise NotImplementedError("Wire schema-forced JSON prompt at deploy; "
                                  "admission protocol must run first.")

    def generate_spec(self, skeleton, decision):
        raise NotImplementedError("Wire schema-forced JSON prompt at deploy; "
                                  "admission protocol must run first.")


REGISTRY["gemini:gemini-pro"] = GeminiProvider()
