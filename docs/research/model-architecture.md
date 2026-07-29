# Model architecture for vizcore verified mode — research summary

Resolves [Model architecture for verified mode](https://github.com/realubqtos/4Ms/issues/5) on the
[4Ms public beta wayfinder map](https://github.com/realubqtos/4Ms/issues/4). Research date: 2026-07-28.

## Question recap

Which model(s) power vizcore's verified generation in production — and does the task need a
VLM (vision) at all, or is structured-output reasoning the actual requirement?

## Finding 1 — No VLM. The requirement is schema-constrained structured output. (from code)

The provider contract in `backend/vizcore/providers.py` has exactly two model stages:

| Stage | Signature | Input | Output |
|---|---|---|---|
| S1 | `extract_skeleton(claim, data, context) -> Skeleton` | text + optional tabular rows | pydantic `Skeleton` (entities, dimensions, relations, claim_values) |
| S3 | `generate_spec(skeleton, decision) -> VizSpec` | structured JSON | pydantic `VizSpec` |

- **No pipeline step consumes images.** The only image anywhere is the *output* SVG, rendered
  deterministically by `renderer.py`, whose docstring is explicit: the verification suite
  "can parse structure, not pixels". The base64 in `adapter.py` is preview encoding of that SVG.
- S2 (the form `Decision`) and S4 (render + verify) are deterministic — no model involved.
- Therefore the model-quality surface is exactly: classify `claim_type`, extract
  entities/dimensions/relations faithfully, quote numeric `claim_values` verbatim with
  provenance spans, and never fabricate. That is a structured-output reasoning task, full stop.

## Finding 2 — Live spark inventory differs from the map's notes. (from probing)

Checked 2026-07-28 against `dgx-spark.tail7e7ed4.ts.net`:

- `:8000` and `:8002` (vLLM, Gemma-4-26B): **connection refused — not running** (`ss` on the
  spark confirms nothing listens).
- `:8003` (llama.cpp): **up**, serving `unsloth/Qwen3.6-35B-A3B-MTP-GGUF:UD-IQ4_XS`
  (MoE, ~3B active params, IQ4_XS quant), OpenAI-compatible, reports `completion` +
  `multimodal` capabilities.

So "point at the existing vLLM endpoint" is not currently actionable; the running spark
model is Qwen3.6-35B-A3B. Re-standing vLLM is an ops decision that belongs with the
capacity ticket.

## Finding 3 — Qwen3.6-35B-A3B passes a mini schema-conformance gate. (empirical)

Ran vizcore's **real** `Skeleton.model_json_schema()` as `response_format: json_schema`
against `:8003` with three claims taken from `backend/tests/test_vizcore_integration.py`
(probe script and raw results attached in this gist):

| Case | Valid Skeleton | claim_type | Fabricated values | Verbatim claim echo | Latency |
|---|---|---|---|---|---|
| bar-with-data | ✅ | `quantity-comparison` ✓ | none | ✓ | 9.6s |
| dynamical-system | ✅ | `dynamical-system` ✓ | none | ✓ | 8.4s |
| no-data (refusal path) | ✅ | `quantity-comparison` ✓ | none — left `claim_values`/data empty | ✓ | 3.9s |

Notes:
- Grammar-constrained decoding (llama.cpp's json_schema support; vLLM has the same via
  xgrammar/outlines) makes schema conformance a **server guarantee**, not a model skill —
  the admission question reduces to semantic quality, which these cases suggest is solid.
- The no-data case is the important honesty check: the model produced an empty-values
  skeleton rather than inventing numbers, which routes into vizcore's deterministic
  REFUSE decision downstream. Fabrication guard: every extracted value substring-matched
  the claim text.
- 250–600 completion tokens per skeleton; single-stream latency 4–10s on current spark load.

## Decision

1. **No VLM.** Model choice is optimized for schema-constrained structured-output reasoning.
2. **Primary: spark-hosted open model behind a new `OpenAICompatProvider`** in
   `backend/vizcore/providers.py` — one provider class (`base_url` + `model` + optional key),
   registry-selected via env (`VIZCORE_PROVIDER`, `VIZCORE_BASE_URL`), covering llama.cpp,
   vLLM, and any future OpenAI-compatible server. Prompts use `response_format: json_schema`
   with the pydantic-derived schemas.
3. **Candidate model: Qwen3.6-35B-A3B (:8003)** — the model actually running, mini-gate
   passed, MoE-fast. It proceeds to the full admission protocol (schema conformance →
   battery regression → calibration → pinning) before `admitted=True`. Whether to also
   re-stand vLLM (Gemma-4-26B or a newer weight) is deferred to the capacity ticket —
   the provider abstraction makes it a config change either way.
4. **API fallback (per the map's spark-first budget posture): Gemini first**
   (`GeminiProvider` scaffold already exists and the platform holds a key), Anthropic
   scaffold retained. A fallback is used only where the admitted spark model fails
   quality or capacity in practice — and any fallback must pass the same admission
   protocol; nothing is trusted unadmitted.
5. **Tests/demos stay on `stub-0.1`** (deterministic, keyless) — unchanged.

## Consequences for the map

- Unblocks capacity ticket (#6); its body should be updated to measure Qwen3.6-35B-A3B
  on llama.cpp (and optionally a re-stood vLLM) rather than assuming Gemma is up.
- The "Gemini admission protocol" fog item sharpens into a concrete ticket: run the full
  admission protocol for the chosen provider(s), starting with Qwen3.6-35B-A3B.
- Map Notes' infrastructure facts need the vLLM-down correction.
