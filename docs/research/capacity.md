# Spark serving capacity for tens of users — research summary

Resolves [vLLM capacity and multi-tenancy for tens of users](https://github.com/realubqtos/4Ms/issues/6)
on the [4Ms public beta wayfinder map](https://github.com/realubqtos/4Ms/issues/4). Research date: 2026-07-28.

## Current serving configuration (inspected live)

The spark's only running model server is llama.cpp in Docker (host `:8003` → container `:30000`):

```
llama-server -hf unsloth/Qwen3.6-35B-A3B-MTP-GGUF:UD-IQ4_XS --offline \
  -ngl 999 -c 16384 --parallel 1 --temp 0 --jinja --reasoning off
```

The load-bearing flag is **`--parallel 1`: a single slot — every concurrent request is strictly
serialized.** Also observed: the host's `nvidia-smi` is broken (NVML driver/library mismatch,
NVML 580.173) — GPU memory headroom is currently unmeasurable, and this likely explains why the
vLLM units are down. Inference inside the llama.cpp container is unaffected.

## Measurements (schema-constrained skeleton extraction, vizcore's real schema)

| Concurrency | Requests | Wall | Per-request latency | Aggregate tok/s |
|---|---|---|---|---|
| 1 | 3 sequential | 19.5s | 5.8 / 6.3 / 7.4s | 62.7 |
| 2 | 2 | 14.0s | 6.9 / **14.0s** | 64.9 |
| 4 | 4 | 27.6s | 6.1 / 13.7 / 20.7 / **27.6s** | 64.9 |

Aggregate throughput is **flat at ~63–65 tok/s** regardless of offered concurrency, and tail
latency grows linearly with queue depth — strict serialization confirmed. (Probe script:
`probe_concurrency.py` alongside; 13 light requests total.)

## Workload model

One verified generation = 2 model calls (S1 skeleton + S3 spec), ~400–600 completion tokens each
→ **~13–20s of model time per generation** single-stream. For "tens of users" (20–50 registered,
realistic peak of 3–5 concurrent generations): under `--parallel 1`, the 5th queued user waits
**60–100s**. SSE status events make the wait visible, but that is poor interactive UX.

## Decision

1. **Stay on llama.cpp; raise `--parallel` to 4 (and `-c` to 32768 → 8K per slot).** Skeleton/spec
   requests are small (≈200-token prompt, ≤900-token completion) and fit comfortably. llama.cpp
   continuous-batches across slots; MoE-A3B decode is memory-bandwidth-bound, so batching should
   raise aggregate tok/s meaningfully above 65 — worst-case interactive wait at peak drops from
   ~4× to ~1.5–2× single-stream. This is a **one-flag config change** in the container's launch
   args, owned by ubqtos-infra.
2. **Do not re-stand vLLM for this beta.** vLLM wins at high concurrency, but tens of users don't
   reach that regime, it costs VRAM we currently can't even measure (broken NVML), and the
   provider abstraction from the model-architecture decision makes a later switch a config change.
   Revisit if adoption approaches hundreds of users or specs grow much longer.
3. **Ops prerequisite flagged:** fix the NVIDIA driver/NVML mismatch on the spark (likely needs a
   host reboot after the driver update) before any serving reconfiguration, so VRAM headroom can
   be verified. Execution-side; recorded here, not a map ticket.
4. **Re-measure after the config change** (same probe at c=4/8) as part of the admission-protocol
   run — gate: peak-concurrency p95 per generation under ~30s.
5. Per-user generation quotas remain the abuse backstop — owned by the multi-user hardening ticket.

## Capacity verdict

With `--parallel 4`, the spark comfortably serves tens of users: sustained ~8–15 generations/minute
aggregate against a realistic peak demand of 3–5 concurrent generations. Headroom before
architecture changes: roughly 5–10× current beta sizing.
