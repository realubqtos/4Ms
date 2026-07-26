# 4Ms — Agent Notes

4Ms is a scientific-figure-generation platform: React/Vite + TypeScript frontend (developed partly via bolt.new), Supabase (auth, Postgres, storage), and a Python FastAPI backend (`backend/`) with an agents pipeline and the vizcore verified-generation package.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (`realubqtos/4Ms`), managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles map 1:1 to label strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` and `docs/adr/` at the repo root (created lazily as terms and decisions get resolved). See `docs/agents/domain.md`.
