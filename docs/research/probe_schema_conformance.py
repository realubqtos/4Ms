"""Schema-conformance probe (admission protocol gate 1, mini) against the
spark's running llama.cpp server. Sends vizcore's real Skeleton JSON schema
as response_format json_schema and validates replies with the real pydantic
model. Research evidence for 4Ms ticket #5 — not production code."""
import json
import sys
import time
import urllib.request

sys.path.insert(0, "/Users/realcanty/src/4Ms/backend")
from vizcore.schemas import Skeleton  # noqa: E402

URL = "http://dgx-spark.tail7e7ed4.ts.net:8003/v1/chat/completions"
MODEL = "unsloth/Qwen3.6-35B-A3B-MTP-GGUF:UD-IQ4_XS"

CLAIMS = [
    ("bar-with-data",
     "Compare recall accuracy across the three conditions: 41 percent for "
     "control, 62 percent for spaced, and 79 percent for interleaved.",
     [{"condition": "control", "accuracy": 41},
      {"condition": "spaced", "accuracy": 62},
      {"condition": "interleaved", "accuracy": 79}]),
    ("dynamical-system",
     "Past a critical threshold of AI reliance the lab group collapses into "
     "a dependent state - an absorbing attractor; deliberate unassisted "
     "practice acts as a restoring force toward the capable state.", None),
    ("no-data-refusal-path",
     "Compare quarterly signups across our three products.", None),
]

SYSTEM = (
    "You extract the structural skeleton of a scientific claim for a "
    "verified visualization pipeline. Identify the claim_type (one of: "
    "quantity-comparison, trend-over-time, correlation, dynamical-system, "
    "architecture, variance-envelope, dissimilarity-space, unclassified), "
    "the entities, dimensions (kind: nominal|ordinal|quantitative|temporal), "
    "relations between entity ids, and claim_values (numeric values quoted "
    "verbatim from the claim with their source_span). Use only what the "
    "claim and data state - never invent values. Echo the claim verbatim in "
    "the claim field. If data rows are provided, copy them into data."
)

schema = Skeleton.model_json_schema()

results = []
for name, claim, data in CLAIMS:
    user = f"Claim: {claim}"
    if data:
        user += f"\nData rows: {json.dumps(data)}"
    body = {
        "model": MODEL,
        "messages": [{"role": "system", "content": SYSTEM},
                     {"role": "user", "content": user}],
        "response_format": {"type": "json_schema",
                            "json_schema": {"name": "skeleton", "schema": schema}},
        "temperature": 0.1,
        "max_tokens": 2000,
    }
    t0 = time.time()
    try:
        req = urllib.request.Request(
            URL, data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=180) as r:
            resp = json.loads(r.read())
        elapsed = time.time() - t0
        content = resp["choices"][0]["message"]["content"]
        sk = Skeleton.model_validate_json(content)
        fabricated = [cv.value for cv in sk.claim_values
                      if cv.value.rstrip("%x×") not in claim]
        results.append({
            "case": name, "ok": True, "seconds": round(elapsed, 1),
            "claim_type": sk.claim_type,
            "entities": len(sk.entities), "dims": len(sk.dimensions),
            "relations": len(sk.relations),
            "claim_values": [cv.value for cv in sk.claim_values],
            "fabricated_values": fabricated,
            "claim_echoed_verbatim": sk.claim == claim,
            "usage": resp.get("usage", {}),
        })
    except Exception as e:  # noqa: BLE001
        results.append({"case": name, "ok": False,
                        "seconds": round(time.time() - t0, 1),
                        "error": f"{type(e).__name__}: {e}"})

print(json.dumps(results, indent=1))
