"""Concurrency probe against the spark llama.cpp server for 4Ms ticket #6.
Sends realistic skeleton-extraction requests (vizcore's real Skeleton schema,
schema-constrained) at concurrency 1, 2, and 4. Light load: 3+2+4+4 = 13
requests total, capped output. Research evidence, not production code."""
import concurrent.futures as cf
import json
import statistics
import sys
import time
import urllib.request

sys.path.insert(0, "/Users/realcanty/src/4Ms/backend")
from vizcore.schemas import Skeleton  # noqa: E402

URL = "http://dgx-spark.tail7e7ed4.ts.net:8003/v1/chat/completions"
MODEL = "unsloth/Qwen3.6-35B-A3B-MTP-GGUF:UD-IQ4_XS"
SCHEMA = Skeleton.model_json_schema()

SYSTEM = ("You extract the structural skeleton of a scientific claim. "
          "Identify claim_type, entities, dimensions, relations, and "
          "claim_values quoted verbatim. Never invent values.")

CLAIMS = [
    "Compare recall accuracy across the three conditions: 41 percent for control, 62 percent for spaced, and 79 percent for interleaved.",
    "Reaction time decreases from 480 ms to 310 ms across ten practice sessions.",
    "Higher sleep quality correlates with improved memory consolidation scores across 40 participants.",
    "Past a critical threshold the system collapses into a dependent state, an absorbing attractor.",
]


def one_request(i: int) -> dict:
    body = {
        "model": MODEL,
        "messages": [{"role": "system", "content": SYSTEM},
                     {"role": "user", "content": f"Claim: {CLAIMS[i % len(CLAIMS)]}"}],
        "response_format": {"type": "json_schema",
                            "json_schema": {"name": "skeleton", "schema": SCHEMA}},
        "temperature": 0.1, "max_tokens": 900,
    }
    t0 = time.time()
    req = urllib.request.Request(URL, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        resp = json.loads(r.read())
    dt = time.time() - t0
    content = resp["choices"][0]["message"]["content"]
    Skeleton.model_validate_json(content)  # raises on schema violation
    return {"seconds": round(dt, 1),
            "completion_tokens": resp["usage"]["completion_tokens"]}


out = {}
for conc, n in [(1, 3), (2, 2), (4, 4)]:
    t0 = time.time()
    with cf.ThreadPoolExecutor(max_workers=conc) as ex:
        rs = list(ex.map(one_request, range(n)))
    wall = time.time() - t0
    lat = [r["seconds"] for r in rs]
    toks = sum(r["completion_tokens"] for r in rs)
    out[f"concurrency={conc} (n={n})"] = {
        "wall_seconds": round(wall, 1),
        "per_request_seconds": lat,
        "mean_latency": round(statistics.mean(lat), 1),
        "max_latency": round(max(lat), 1),
        "total_completion_tokens": toks,
        "agg_tokens_per_sec": round(toks / wall, 1),
    }
    time.sleep(2)

print(json.dumps(out, indent=1))
