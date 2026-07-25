"""vizcore — The Vizualizer pipeline embedded in 4Ms.

Spec-mediated, verification-gated figure generation (ubqtos "The Vizualizer"
project, Phase 3). Model stages emit schema-validated JSON; deterministic
code renders (pure SVG, no plotting library) and verifies. No fabricated
data, no forced canonicalization: claims that don't fit a canonical family
are routed to demonstrated construction rules or honestly refused.

Provenance: Phase 2 battery (10 cases, 77 checks) + Phase 3 acceptance
gates (7/7). See the-vizualizer project docs `phase3/*`.
"""
from .adapter import generate_verified  # noqa: F401
