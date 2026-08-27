"""Form dispatch — S2 (architecture.md §2).

Deterministic catalog match over the skeleton's relational signature.
This is the forced-canonicalization firewall: the decision is computed
from the skeleton's structure, never from surface keywords in the claim.

MVP catalog: the canonical families demonstrated in B1–B3, plus the two
demonstrated construction rules and the honest unsupported-route gate
for skeletons that need rules not yet demonstrated (PRD §6).
"""
from __future__ import annotations

from .schemas import (Decision, DimensionKind, MatchResult, Skeleton,
                      UnsupportedRoute)

DEMONSTRATED_RULES = {"inherit-source-formalism", "product-structure-composition"}
UNDEMONSTRATED_RULES = {"promote-emergent-feature", "compositional-embedding"}


def _kinds(skeleton: Skeleton) -> list[DimensionKind]:
    return [d.kind for d in skeleton.dimensions]


def dispatch(skeleton: Skeleton) -> Decision:
    kinds = _kinds(skeleton)
    n_quant = kinds.count(DimensionKind.quantitative)
    n_nominal = kinds.count(DimensionKind.nominal)
    n_temporal = kinds.count(DimensionKind.temporal)
    n_ordinal = kinds.count(DimensionKind.ordinal)
    typed_edges = {r.type for r in skeleton.relations if r.type}
    has_data = bool(skeleton.data)

    # ── Gate: skeletons needing undemonstrated construction rules ──
    # variance-envelope → promote-emergent-feature (CSCW Fig. 2 class)
    # dissimilarity-space → compositional-embedding (CSCW Fig. 3 class)
    if skeleton.claim_type == "variance-envelope":
        return Decision(
            match_result=MatchResult.REFUSE,
            rationale="The claim's construct is an emergent feature of member "
                      "series (spread-as-construct). Carrying it faithfully "
                      "requires the promote-emergent-feature construction rule, "
                      "which is not yet demonstrated (Phase 2 Scoped GO gate).",
            unsupported_route=UnsupportedRoute(
                needed_rule="promote-emergent-feature",
                explanation="Supported alternative: member series as plain "
                            "multi-line chart WITHOUT claiming the envelope "
                            "construct, or a table. The envelope form itself "
                            "is gated until B4-level testing (see PRD §6)."),
        )
    if skeleton.claim_type == "dissimilarity-space":
        return Decision(
            match_result=MatchResult.REFUSE,
            rationale="The claim maps abstract dissimilarity structure to "
                      "spatial position across conditions. That requires the "
                      "compositional-embedding construction rule, not yet "
                      "demonstrated (Phase 2 Scoped GO gate).",
            unsupported_route=UnsupportedRoute(
                needed_rule="compositional-embedding",
                explanation="Supported alternative: pairwise-dissimilarity "
                            "table. The idea-space small-multiples form is "
                            "gated until B4-level testing (see PRD §6)."),
        )

    # ── Construction branch: source formalism with crystallized form ──
    if skeleton.claim_type == "dynamical-system" and skeleton.source_formalism:
        return Decision(
            match_result=MatchResult.NONE,
            construction_rule="inherit-source-formalism",
            families=[],
            license=f"The claim's source formalism ({skeleton.source_formalism}) "
                    "has a crystallized representational scheme; inherit it and "
                    "populate with the domain's entities.",
            rationale="No canonical family carries a bistable potential with "
                      "forces and an absorbing attractor. Matched signature: "
                      "states-as-attractors + threshold boundary + force relations.",
        )

    # ── Composition branch: typed edges × ordinal partition ──
    ordinal_partition = any(d.kind == DimensionKind.ordinal and len(d.levels) >= 2
                            for d in skeleton.dimensions)
    if skeleton.claim_type == "architecture" and len(typed_edges) >= 2 and ordinal_partition:
        return Decision(
            match_result=MatchResult.PARTIAL,
            construction_rule="product-structure-composition",
            families=["typed-edge-directed-graph", "positional-lane-partition"],
            license="Neither parent family alone carries the full skeleton: a "
                    "pure network loses the level partition; a pure hierarchy "
                    "loses the typed dependency distinctions. Composition "
                    "preserves both.",
            rationale=f"Typed edges {sorted(typed_edges)} × ordinal partition "
                      f"{[d.levels for d in skeleton.dimensions if d.kind == DimensionKind.ordinal]}.",
        )

    # ── Canonical branch (requires data; no data → refuse, never invent) ──
    if skeleton.claim_type in {"quantity-comparison", "trend-over-time", "correlation"}:
        if not has_data:
            return Decision(
                match_result=MatchResult.REFUSE,
                rationale="The claim asks for a data-bearing canonical form but "
                          "no data records were supplied. Rendering would "
                          "require fabricating values — hard-constraint "
                          "violation (charter §6). Provide the data, or accept "
                          "a non-metric structural summary.",
            )
        if skeleton.claim_type == "trend-over-time" and n_temporal >= 1 and n_quant >= 1:
            return Decision(match_result=MatchResult.FULL, families=["line"],
                            rationale="Temporal dimension × quantitative measure → line family.")
        if skeleton.claim_type == "correlation" and n_quant >= 2:
            return Decision(match_result=MatchResult.FULL, families=["scatter"],
                            rationale="Two quantitative dimensions, relation-between-measures → scatter family.")
        if skeleton.claim_type == "quantity-comparison" and n_nominal >= 1 and n_quant >= 1:
            return Decision(match_result=MatchResult.FULL, families=["bar"],
                            rationale="Nominal categories × quantitative measure → bar family.")

    # ── Nothing fits and no demonstrated construction route ──
    return Decision(
        match_result=MatchResult.REFUSE,
        rationale=f"No catalog family matches the skeleton signature "
                  f"(claim_type={skeleton.claim_type!r}, dims={[k.value for k in kinds]}, "
                  f"edge_types={sorted(typed_edges)}), and no demonstrated "
                  "construction rule applies. Refusing rather than coercing "
                  "the claim into a non-fitting canonical form.",
    )
