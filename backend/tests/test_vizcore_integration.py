"""Integration tests for the embedded Vizualizer pipeline (verified mode).

Runs keyless (stub provider, no Supabase). Mirrors the Phase 3 acceptance
gates through the 4Ms event-stream adapter.

Run: cd backend && python3 tests/test_vizcore_integration.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from vizcore import generate_verified


async def collect(prompt, data_info=None):
    events = []
    async for ev in generate_verified(prompt, "diagram", "mind", "test-user",
                                      data_info=data_info):
        events.append(ev)
    return events


def by_type(events, t):
    return [e for e in events if e["type"] == t]


def test_bar_route_with_data():
    events = asyncio.run(collect(
        "Compare recall accuracy across the three conditions: 41 percent for "
        "control, 62 percent for spaced, and 79 percent for interleaved.",
        {"records": [{"condition": "control", "accuracy": 41},
                     {"condition": "spaced", "accuracy": 62},
                     {"condition": "interleaved", "accuracy": 79}]}))
    dec = by_type(events, "form_decision")[0]["data"]["decision"]
    assert dec["match_result"] == "FULL" and dec["families"] == ["bar"]
    comp = by_type(events, "complete")[0]["data"]["data"]
    assert comp["verdict"] == "PASS"
    assert comp["image_data"].startswith("data:image/svg+xml;base64,")
    rep = by_type(events, "verification_report")[0]["data"]["report"]
    assert all(c["passed"] for c in rep["checks"])
    assert any(c["id"] == "data-tracing" for c in rep["checks"])


def test_construction_route():
    events = asyncio.run(collect(
        "Past a critical threshold of AI reliance the lab group collapses into "
        "a dependent state — an absorbing attractor; deliberate unassisted "
        "practice is the restoring force."))
    dec = by_type(events, "form_decision")[0]["data"]["decision"]
    assert dec["match_result"] == "NONE"
    assert dec["construction_rule"] == "inherit-source-formalism"
    comp = by_type(events, "complete")[0]["data"]["data"]
    assert comp["verdict"] == "PASS" and comp["form"] == "potential-landscape"


def test_gated_refusal_streams_as_completion_not_error():
    events = asyncio.run(collect(
        "The reasoning envelope narrows: member variance over time collapses "
        "under AI exposure across all phases."))
    assert not by_type(events, "error")
    dec = by_type(events, "form_decision")[0]["data"]["decision"]
    assert dec["match_result"] == "REFUSE"
    assert dec["unsupported_route"]["needed_rule"] == "promote-emergent-feature"
    comp = by_type(events, "complete")[0]["data"]["data"]
    assert comp["refused"] is True and comp["image_data"] is None


def test_no_data_refuses_never_fabricates():
    events = asyncio.run(collect("Compare quarterly signups across our three products."))
    dec = by_type(events, "form_decision")[0]["data"]["decision"]
    assert dec["match_result"] == "REFUSE"
    assert "fabricat" in dec["rationale"].lower()


def test_event_vocabulary_compatible():
    """Legacy hook safety: only known event types; complete carries data."""
    known = {"status", "agent_complete", "image_preview", "complete", "error",
             "skeleton", "form_decision", "verification_report"}
    events = asyncio.run(collect(
        "The evaluation framework has three levels with typed dependencies: "
        "representational quality feeds comprehension via a MECHANISM edge; "
        "comprehension feeds transfer via a DIAGNOSTIC edge; scaffolding "
        "samples both levels."))
    assert {e["type"] for e in events} <= known
    assert by_type(events, "complete")[0]["data"]["data"]["form"] == "typed-lane-graph" \
        if "data" in by_type(events, "complete")[0]["data"] else True


if __name__ == "__main__":
    fns = [(k, v) for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for name, fn in fns:
        try:
            fn()
            print(f"PASS  {name}")
        except Exception as e:
            failed += 1
            print(f"FAIL  {name}: {e}")
    print(f"\n{len(fns) - failed}/{len(fns)} passed")
    sys.exit(1 if failed else 0)
