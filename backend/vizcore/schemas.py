"""Data contracts — the system's spine (architecture.md §4).

Every stage boundary is one of these schema-validated artifacts.
The model never draws; the renderer never invents.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── skeleton.schema ─────────────────────────────────────────────────
class DimensionKind(str, Enum):
    nominal = "nominal"
    ordinal = "ordinal"
    quantitative = "quantitative"
    temporal = "temporal"


class Entity(BaseModel):
    id: str
    type: str
    role: str = ""
    label: str = ""
    level: Optional[str] = None  # ordinal partition membership, if any


class Dimension(BaseModel):
    id: str
    kind: DimensionKind
    label: str = ""
    levels: list[str] = Field(default_factory=list)  # for ordinal partitions


class Relation(BaseModel):
    source: str
    target: str
    type: str
    directed: bool = True
    label: str = ""


class ClaimValue(BaseModel):
    id: str
    value: str          # kept as string: "0.85", "92%", "2.7×"
    unit: str = ""
    source_span: str = ""  # where in the claim it came from — provenance


class Skeleton(BaseModel):
    claim: str
    claim_type: str                      # e.g. "quantity-comparison", "trend-over-time",
                                         # "correlation", "dynamical-system", "architecture",
                                         # "variance-envelope", ...
    entities: list[Entity] = Field(default_factory=list)
    dimensions: list[Dimension] = Field(default_factory=list)
    relations: list[Relation] = Field(default_factory=list)
    claim_values: list[ClaimValue] = Field(default_factory=list)
    source_formalism: Optional[str] = None   # e.g. "potential-function"
    data: Optional[list[dict[str, Any]]] = None  # user-supplied records, if any


# ── decision.schema ─────────────────────────────────────────────────
class MatchResult(str, Enum):
    FULL = "FULL"
    PARTIAL = "PARTIAL"
    NONE = "NONE"
    REFUSE = "REFUSE"


class UnsupportedRoute(BaseModel):
    needed_rule: str
    explanation: str


class Decision(BaseModel):
    match_result: MatchResult
    families: list[str] = Field(default_factory=list)
    construction_rule: Optional[str] = None   # inherit-source-formalism | product-structure-composition
    license: str = ""
    rationale: str = ""
    unsupported_route: Optional[UnsupportedRoute] = None


# ── vizspec.schema ──────────────────────────────────────────────────
class MarkFunction(BaseModel):
    mark: str
    meaning: str
    type: str          # e.g. position-x, position-y, schematic, arbitrary, edge-type, ...
    metric: bool = False


class InheritedWarning(BaseModel):
    warning: str
    compliance: str


class VizSpec(BaseModel):
    form: str                                  # bar | line | scatter | potential-landscape | typed-lane-graph
    title: str
    mark_function_table: list[MarkFunction] = Field(default_factory=list)
    encodings: dict[str, Any] = Field(default_factory=dict)
    entities: dict[str, dict[str, Any]] = Field(default_factory=dict)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    interactions: list[dict[str, Any]] = Field(default_factory=list)  # I1–I2 only
    static_complete: bool = True
    scope_of_validity: str = ""
    inherited_warnings: list[InheritedWarning] = Field(default_factory=list)
    numerical_values_in_claim: list[str] = Field(default_factory=list)


# ── report.schema ───────────────────────────────────────────────────
class CheckResult(BaseModel):
    id: str
    name: str
    passed: bool
    detail: str = ""
    calibration_notes: str = ""


class VerificationReport(BaseModel):
    checks: list[CheckResult] = Field(default_factory=list)
    verdict: str = "PENDING"     # PASS | FAIL
    iteration_count: int = 0

    def finalize(self) -> "VerificationReport":
        self.verdict = "PASS" if all(c.passed for c in self.checks) else "FAIL"
        return self


# ── run state ───────────────────────────────────────────────────────
class RunStatus(str, Enum):
    skeleton_extracted = "skeleton_extracted"
    skeleton_confirmed = "skeleton_confirmed"
    decided = "decided"
    generated = "generated"
    refused = "refused"
    verification_failed = "verification_failed"


class Run(BaseModel):
    id: str
    created_at: str
    status: RunStatus
    pipeline_version: str = "0.1.0"
    provider_id: str = ""
    skeleton: Optional[Skeleton] = None
    decision: Optional[Decision] = None
    spec: Optional[VizSpec] = None
    svg: Optional[str] = None
    report: Optional[VerificationReport] = None
