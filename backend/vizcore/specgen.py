"""Deterministic spec templates per decision route (S3, stub path).

With a live model provider, S3 is a structured-output model call whose
result must validate against VizSpec. The stub path builds the spec from
templates parameterized by the skeleton — same contract, same downstream
renderer and verification.
"""
from __future__ import annotations

from .schemas import (Decision, InheritedWarning, MarkFunction, Skeleton,
                      VizSpec)


def build_spec(skeleton: Skeleton, decision: Decision) -> VizSpec:
    values = [v.value for v in skeleton.claim_values]

    if decision.match_result.value == "FULL":
        family = decision.families[0]
        return _canonical_spec(family, skeleton, values)
    if decision.construction_rule == "inherit-source-formalism":
        return _landscape_spec(skeleton, values)
    if decision.construction_rule == "product-structure-composition":
        return _lane_graph_spec(skeleton, values)
    raise ValueError(f"No spec route for decision {decision.match_result}")


def _canonical_spec(family: str, skeleton: Skeleton, values: list[str]) -> VizSpec:
    dims = skeleton.dimensions
    x_dim, y_dim = dims[0], dims[1] if len(dims) > 1 else dims[0]
    marks = {
        "bar": [
            MarkFunction(mark="bar-height", meaning=f"{y_dim.label} (linear from zero)",
                         type="position-y", metric=True),
            MarkFunction(mark="bar-x-position", meaning=f"{x_dim.label} category",
                         type="position-x-nominal", metric=False),
            MarkFunction(mark="bar-width", meaning="arbitrary (uniform)", type="arbitrary"),
            MarkFunction(mark="bar-color", meaning="arbitrary (single hue)", type="arbitrary"),
        ],
        "line": [
            MarkFunction(mark="point-y", meaning=f"{y_dim.label} (linear)",
                         type="position-y", metric=True),
            MarkFunction(mark="point-x", meaning=f"{x_dim.label} (temporal order)",
                         type="position-x-temporal", metric=True),
            MarkFunction(mark="line-connection", meaning="temporal continuity",
                         type="connection", metric=False),
            MarkFunction(mark="line-color", meaning="arbitrary (single series)", type="arbitrary"),
        ],
        "scatter": [
            MarkFunction(mark="point-x", meaning=f"{x_dim.label} (linear)",
                         type="position-x", metric=True),
            MarkFunction(mark="point-y", meaning=f"{y_dim.label} (linear)",
                         type="position-y", metric=True),
            MarkFunction(mark="point-size", meaning="arbitrary (uniform)", type="arbitrary"),
            MarkFunction(mark="point-color", meaning="arbitrary (single hue)", type="arbitrary"),
        ],
    }[family]
    return VizSpec(
        form=family,
        title=skeleton.claim,
        mark_function_table=marks,
        encodings={"x": x_dim.id, "y": y_dim.id},
        entities={e.id: {"label": e.label} for e in skeleton.entities},
        scope_of_validity=f"This {family} chart carries the {skeleton.claim_type} "
                          f"structure of the supplied records only. It does NOT carry "
                          "causal direction, uncertainty, or values outside the data.",
        inherited_warnings=[
            InheritedWarning(warning="quantitative axis must start at zero for bar family "
                                     "(length-proportion reading)",
                            compliance="renderer anchors bars at zero" if family == "bar"
                                       else "n/a for this family"),
            InheritedWarning(warning="every rendered datum must trace to a supplied record",
                            compliance="tracer check runs over data-value-id annotations"),
        ],
        numerical_values_in_claim=values,
    )


def _landscape_spec(skeleton: Skeleton, values: list[str]) -> VizSpec:
    ent = {e.id: e for e in skeleton.entities}
    return VizSpec(
        form="potential-landscape",
        title=skeleton.claim,
        mark_function_table=[
            MarkFunction(mark="curve-height", meaning="potential (schematic, not metric)",
                         type="schematic"),
            MarkFunction(mark="basin-depth", meaning="recovery difficulty (schematic-ordinal)",
                         type="schematic-ordinal"),
            MarkFunction(mark="ball-position", meaning="current system state",
                         type="entity-location"),
            MarkFunction(mark="ridge-position", meaning="critical threshold boundary",
                         type="boundary"),
            MarkFunction(mark="arrow-direction", meaning="force vector direction",
                         type="force-direction"),
            MarkFunction(mark="basin-width", meaning="arbitrary", type="arbitrary"),
            MarkFunction(mark="curve-smoothness", meaning="arbitrary", type="arbitrary"),
            MarkFunction(mark="specific-y-values", meaning="arbitrary", type="arbitrary"),
        ],
        encodings={"construction_rule": "inherit-source-formalism",
                   "source_formalism": skeleton.source_formalism},
        entities={eid: {"label": e.label, "type": e.type} for eid, e in ent.items()},
        edges=[r.model_dump() for r in skeleton.relations],
        scope_of_validity="Schematic potential landscape inherited from the claim's "
                          "source formalism. It does NOT carry a specific potential "
                          "function, metric depth ratios, or basin widths. Strongest "
                          "for readers with dynamical-systems literacy; the caption "
                          "carries the mapping for others.",
        inherited_warnings=[
            InheritedWarning(warning="no metric readings may be invited from schematic curves",
                            compliance="no y-axis scale or gridlines; specific-y-values declared arbitrary"),
            InheritedWarning(warning="basin width reads as a variable unless declared",
                            compliance="width declared arbitrary; depth declared schematic-ordinal"),
            InheritedWarning(warning="no interpolated fabrication on schematic forms",
                            compliance="only claim values appear as text"),
        ],
        numerical_values_in_claim=values,
    )


def _lane_graph_spec(skeleton: Skeleton, values: list[str]) -> VizSpec:
    ordinal = next(d for d in skeleton.dimensions if d.kind.value == "ordinal")
    line_styles = {"MECHANISM": "solid", "DIAGNOSTIC": "dashed", "COMPOSITION": "dash-dot",
                   "PREDICTOR": "dotted", "SAMPLING": "light"}
    return VizSpec(
        form="typed-lane-graph",
        title=skeleton.claim,
        mark_function_table=[
            MarkFunction(mark="lane-y-position", meaning=f"{ordinal.label} "
                         f"(ordinal: {' < '.join(ordinal.levels)})", type="positional-partition"),
            MarkFunction(mark="arrow-direction", meaning="dependency direction",
                         type="asymmetric-relation"),
            MarkFunction(mark="arrow-type-label", meaning="dependency type",
                         type="edge-type"),
            MarkFunction(mark="arrow-line-style", meaning="redundant encoding of edge type",
                         type="edge-type-redundant"),
            MarkFunction(mark="lane-color", meaning="categorical hue for level (redundant)",
                         type="categorical-hue"),
            MarkFunction(mark="node-x-position", meaning="arbitrary (layout)", type="arbitrary"),
            MarkFunction(mark="node-size", meaning="arbitrary (fits text)", type="arbitrary"),
            MarkFunction(mark="lane-width", meaning="arbitrary (full width)", type="arbitrary"),
        ],
        encodings={"construction_rule": "product-structure-composition",
                   "parent_families": ["typed-edge-directed-graph", "positional-lane-partition"],
                   "levels": ordinal.levels},
        entities={e.id: {"label": e.label, "lane": e.level} for e in skeleton.entities},
        edges=[{**r.model_dump(), "line_style": line_styles.get(r.type, "solid")}
               for r in skeleton.relations],
        scope_of_validity="This form carries the architectural structure — entities "
                          "partitioned into ordered levels, connected by typed "
                          "dependencies. It does NOT carry temporal dynamics, "
                          "dependency magnitudes, or measurement instruments. "
                          "Edge-type semantics require the caption's definitions.",
        inherited_warnings=[
            InheritedWarning(warning="lane order will be read as hierarchy",
                            compliance="licensed: the level partition IS ordered by the claim"),
            InheritedWarning(warning="typed edges need a legend and a small discriminable style set",
                            compliance=f"{len({e['type'] for e in [r.model_dump() for r in skeleton.relations]})} "
                                       "types with distinct line styles + text labels"),
            InheritedWarning(warning="edge-set correctness must be verified deterministically",
                            compliance="verification suite checks edges against the skeleton"),
            InheritedWarning(warning="low-crossing layout required for machine verifiability",
                            compliance="lane layout with left-to-right in-lane flow"),
        ],
        numerical_values_in_claim=values,
    )
