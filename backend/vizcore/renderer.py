"""Deterministic renderer (S3b): vizspec.json + skeleton -> annotated SVG.

Pure Python SVG synthesis — no plotting library. Plotting libraries are
canonical-form engines; using one as the renderer would reintroduce
canonicalization pressure structurally (architecture.md §3).

Every rendered element carries semantic annotations (data-entity-id,
data-value-id, data-value, data-channel, data-edge-type, data-mark, ...)
so the verification suite can parse structure, not pixels.
"""
from __future__ import annotations

import html as html_mod

from .schemas import Skeleton, VizSpec

W, H = 720, 420
PAD = {"l": 70, "r": 30, "t": 40, "b": 60}
PLOT_W, PLOT_H = W - PAD["l"] - PAD["r"], H - PAD["t"] - PAD["b"]

LANE_COLORS = {0: ("#eff6ff", "#dbeafe", "#2563eb"),
               1: ("#f0fdf4", "#dcfce7", "#16a34a"),
               2: ("#f5f3ff", "#e9e5f5", "#7c3aed")}
EDGE_DASH = {"solid": "", "dashed": "6,3", "dash-dot": "8,3,2,3",
             "dotted": "2,3", "light": "4,4"}


def esc(s) -> str:
    return html_mod.escape(str(s), quote=True)


def render(spec: VizSpec, skeleton: Skeleton) -> str:
    body = {"bar": _bar, "line": _line, "scatter": _scatter,
            "potential-landscape": _landscape,
            "typed-lane-graph": _lane_graph}[spec.form](spec, skeleton)
    desc = "Mark-function audit:\n" + "\n".join(
        f"{m.mark} = {m.meaning} ({m.type})" for m in spec.mark_function_table)
    root_attrs = (f'viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" '
                  f'data-form="{esc(spec.form)}"')
    enc = spec.encodings
    if enc.get("construction_rule"):
        root_attrs += f' data-construction-rule="{esc(enc["construction_rule"])}"'
    if enc.get("source_formalism"):
        root_attrs += f' data-source-formalism="{esc(enc["source_formalism"])}"'
    if enc.get("parent_families"):
        root_attrs += f' data-parent-families="{esc(",".join(enc["parent_families"]))}"'

    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>{esc(spec.title)}</title>
<style>
 body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937;
      padding:24px;max-width:{W + 40}px;background:#fff}}
 .title{{font-size:15px;font-weight:600;margin-bottom:4px}}
 .scope{{font-size:10px;color:#9ca3af;margin-top:10px;line-height:1.4;
        border-top:1px solid #e5e7eb;padding-top:8px}}
 svg{{display:block}} .tip{{pointer-events:none}}
 g[data-interactive] rect:hover{{opacity:.85}}
</style></head><body>
<div class="title" data-role="claim-title">{esc(spec.title)}</div>
<svg {root_attrs}>
<desc>{esc(desc)}</desc>
{body}
</svg>
<div class="scope" data-role="scope-of-validity">Scope of validity: {esc(spec.scope_of_validity)}</div>
</body></html>"""


# ── canonical families ──────────────────────────────────────────────
def _extent(vals):
    lo, hi = min(vals), max(vals)
    if lo == hi:
        lo, hi = lo - 1, hi + 1
    return lo, hi


def _fmt(v):
    return f"{v:g}"


def _axes_y(lo, hi, zero_anchored=False):
    if zero_anchored:
        lo = 0.0
    out = [f'<line x1="{PAD["l"]}" y1="{PAD["t"]}" x2="{PAD["l"]}" '
           f'y2="{PAD["t"] + PLOT_H}" stroke="#9ca3af" data-mark="axis-y"/>']
    for i in range(5):
        v = lo + (hi - lo) * i / 4
        y = PAD["t"] + PLOT_H - (v - lo) / (hi - lo) * PLOT_H
        out.append(f'<text x="{PAD["l"] - 8}" y="{y + 3}" text-anchor="end" '
                   f'font-size="9" fill="#6b7280" data-mark="axis-tick-y">{_fmt(v)}</text>')
    return "\n".join(out), lo, hi


def _bar(spec: VizSpec, sk: Skeleton) -> str:
    xk, yk = spec.encodings["x"], spec.encodings["y"]
    rows = sk.data or []
    vals = [float(r[yk]) for r in rows]
    _, hi = _extent(vals)
    axis, lo, hi = _axes_y(0, hi, zero_anchored=True)  # inherited warning: zero anchor
    n = len(rows)
    slot = PLOT_W / max(n, 1)
    bw = slot * 0.6
    parts = [axis,
             f'<line x1="{PAD["l"]}" y1="{PAD["t"] + PLOT_H}" x2="{PAD["l"] + PLOT_W}" '
             f'y2="{PAD["t"] + PLOT_H}" stroke="#9ca3af" data-mark="axis-x"/>']
    for i, r in enumerate(rows):
        v = float(r[yk])
        bh = (v - lo) / (hi - lo) * PLOT_H
        x = PAD["l"] + i * slot + (slot - bw) / 2
        y = PAD["t"] + PLOT_H - bh
        parts.append(
            f'<g data-entity-id="r{i}" data-entity-type="category">'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw:.1f}" height="{bh:.1f}" fill="#2563eb" '
            f'data-value-id="d{i}" data-value="{esc(r[yk])}" data-channel="bar-height" '
            f'data-mark="bar"/>'
            f'<text x="{x + bw / 2:.1f}" y="{PAD["t"] + PLOT_H + 16}" text-anchor="middle" '
            f'font-size="10" fill="#374151" data-mark="category-label">{esc(r[xk])}</text>'
            f'<text x="{x + bw / 2:.1f}" y="{y - 5:.1f}" text-anchor="middle" font-size="9" '
            f'fill="#6b7280" data-mark="value-label" data-source-datum="d{i}">{esc(r[yk])}</text>'
            f"</g>")
    return "\n".join(parts)


def _line(spec: VizSpec, sk: Skeleton) -> str:
    xk, yk = spec.encodings["x"], spec.encodings["y"]
    rows = sk.data or []
    ys = [float(r[yk]) for r in rows]
    axis, lo, hi = _axes_y(*_extent(ys))
    n = len(rows)
    pts = []
    parts = [axis,
             f'<line x1="{PAD["l"]}" y1="{PAD["t"] + PLOT_H}" x2="{PAD["l"] + PLOT_W}" '
             f'y2="{PAD["t"] + PLOT_H}" stroke="#9ca3af" data-mark="axis-x"/>']
    for i, r in enumerate(rows):
        x = PAD["l"] + (i / max(n - 1, 1)) * PLOT_W
        y = PAD["t"] + PLOT_H - (float(r[yk]) - lo) / (hi - lo) * PLOT_H
        pts.append(f"{x:.1f},{y:.1f}")
        parts.append(
            f'<g data-entity-id="r{i}" data-entity-type="datum">'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.5" fill="#2563eb" '
            f'data-value-id="d{i}" data-value="{esc(r[yk])}" data-channel="point-y" '
            f'data-mark="point"/>'
            f'<text x="{x:.1f}" y="{PAD["t"] + PLOT_H + 16}" text-anchor="middle" font-size="9" '
            f'fill="#374151" data-mark="temporal-label">{esc(r[xk])}</text></g>')
    parts.insert(1, f'<polyline points="{" ".join(pts)}" fill="none" stroke="#2563eb" '
                    f'stroke-width="2" data-mark="line-connection"/>')
    return "\n".join(parts)


def _scatter(spec: VizSpec, sk: Skeleton) -> str:
    xk, yk = spec.encodings["x"], spec.encodings["y"]
    rows = sk.data or []
    xs = [float(r[xk]) for r in rows]
    ys = [float(r[yk]) for r in rows]
    xlo, xhi = _extent(xs)
    axis, ylo, yhi = _axes_y(*_extent(ys))
    parts = [axis,
             f'<line x1="{PAD["l"]}" y1="{PAD["t"] + PLOT_H}" x2="{PAD["l"] + PLOT_W}" '
             f'y2="{PAD["t"] + PLOT_H}" stroke="#9ca3af" data-mark="axis-x"/>']
    for i in range(5):
        v = xlo + (xhi - xlo) * i / 4
        x = PAD["l"] + (v - xlo) / (xhi - xlo) * PLOT_W
        parts.append(f'<text x="{x:.1f}" y="{PAD["t"] + PLOT_H + 16}" text-anchor="middle" '
                     f'font-size="9" fill="#6b7280" data-mark="axis-tick-x">{_fmt(v)}</text>')
    for i, r in enumerate(rows):
        x = PAD["l"] + (float(r[xk]) - xlo) / (xhi - xlo) * PLOT_W
        y = PAD["t"] + PLOT_H - (float(r[yk]) - ylo) / (yhi - ylo) * PLOT_H
        parts.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4" fill="#2563eb" fill-opacity="0.75" '
            f'data-entity-id="r{i}" data-value-id="d{i}" '
            f'data-value-x="{esc(r[xk])}" data-value-y="{esc(r[yk])}" '
            f'data-channel="position-xy" data-mark="point"/>')
    return "\n".join(parts)


# ── constructed forms ───────────────────────────────────────────────
def _landscape(spec: VizSpec, sk: Skeleton) -> str:
    """inherit-source-formalism: potential well diagram, schematic.
    Asymmetric basins (dependent deeper), ridge boundary, ball, force arrows.
    No axis scale, no gridlines — nothing invites a metric reading."""
    curve = ("M 70 175 C 95 175, 135 248, 185 252 C 215 255, 240 250, 275 212 "
             "C 310 170, 340 122, 365 112 C 380 106, 390 110, 400 118 "
             "C 430 165, 468 330, 515 362 C 540 374, 560 374, 575 365 "
             "C 605 340, 640 242, 660 200")
    ent = spec.entities
    lab = lambda k, d: esc(ent.get(k, {}).get("label", d))
    return f"""
<defs>
 <marker id="aR" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
  <polygon points="0,0 8,3 0,6" fill="#dc2626"/></marker>
 <marker id="aG" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
  <polygon points="0,0 8,3 0,6" fill="#16a34a"/></marker>
</defs>
<path d="{curve}" fill="none" stroke="#1f2937" stroke-width="2.5"
  data-mark="potential-curve" data-channel="curve-height"/>
<g data-entity-id="capable-state" data-entity-type="attractor" data-mark="basin-label">
 <text x="185" y="285" text-anchor="middle" font-size="11" font-weight="600" fill="#2563eb">{lab("capable-state", "Capable state")}</text>
 <text x="185" y="298" text-anchor="middle" font-size="8.5" fill="#6b7280">shallower basin — recoverable</text>
</g>
<g data-entity-id="dependent-state" data-entity-type="attractor" data-mark="basin-label">
 <text x="545" y="398" text-anchor="middle" font-size="11" font-weight="600" fill="#991b1b">{lab("dependent-state", "Dependent state")}</text>
 <text x="545" y="410" text-anchor="middle" font-size="8.5" fill="#6b7280">deeper basin — absorbing, slow recovery</text>
</g>
<g data-entity-id="system" data-entity-type="state-marker" data-mark="ball">
 <circle cx="185" cy="240" r="10" fill="#1e3a5f"/>
 <text x="185" y="222" text-anchor="middle" font-size="9" fill="#1e3a5f" font-weight="600">{lab("system", "The system")}</text>
</g>
<g data-entity-id="threshold" data-entity-type="boundary" data-mark="ridge">
 <line x1="365" y1="112" x2="365" y2="60" stroke="#9ca3af" stroke-dasharray="3,3"/>
 <text x="365" y="50" text-anchor="middle" font-size="9" fill="#6b7280">{lab("threshold", "Critical threshold")}</text>
</g>
<g data-entity-id="destabilizing-force" data-entity-type="force" data-mark="force-arrow"
   data-source="destabilizing-force" data-target="dependent-state">
 <line x1="240" y1="150" x2="330" y2="150" stroke="#dc2626" stroke-width="2" marker-end="url(#aR)"/>
 <text x="285" y="140" text-anchor="middle" font-size="9" fill="#dc2626" font-weight="600">{lab("destabilizing-force", "Destabilizing force")}</text>
</g>
<g data-entity-id="restoring-force" data-entity-type="force" data-mark="force-arrow"
   data-source="restoring-force" data-target="capable-state">
 <line x1="490" y1="190" x2="400" y2="190" stroke="#16a34a" stroke-width="2" marker-end="url(#aG)"/>
 <text x="445" y="180" text-anchor="middle" font-size="9" fill="#16a34a" font-weight="600">{lab("restoring-force", "Restoring force")}</text>
</g>
<text x="70" y="30" font-size="9" fill="#9ca3af" data-mark="schematic-note">Schematic — curve heights are not metric readings</text>
"""


def _lane_graph(spec: VizSpec, sk: Skeleton) -> str:
    levels = spec.encodings["levels"]           # bottom-first ordinal order
    n = len(levels)
    lane_h = (H - 40) / n
    parts = ['<defs><marker id="ar" markerWidth="8" markerHeight="6" refX="8" refY="3" '
             'orient="auto"><polygon points="0,0 8,3 0,6" fill="#374151"/></marker></defs>']
    lane_geo = {}
    for i, level in enumerate(levels):          # ordinal 1..n, top lane = highest
        ordinal = i + 1
        y = 20 + (n - 1 - i) * lane_h
        fill, stroke, accent = LANE_COLORS[i % 3]
        lane_geo[level] = (y, lane_h, accent)
        parts.append(
            f'<g data-entity-type="lane" data-lane="{esc(level)}" data-level-ordinal="{ordinal}">'
            f'<rect x="10" y="{y:.0f}" width="{W - 20}" height="{lane_h - 12:.0f}" rx="6" '
            f'fill="{fill}" stroke="{stroke}"/>'
            f'<text x="20" y="{y + 16:.0f}" font-size="8" fill="{accent}" font-weight="600" '
            f'letter-spacing="1.5" data-role="lane-label">{esc(level.upper())}</text></g>')

    by_lane: dict[str, list[str]] = {}
    for eid, e in spec.entities.items():
        by_lane.setdefault(e.get("lane") or "?", []).append(eid)
    node_geo = {}
    for level, eids in by_lane.items():
        y, lh, accent = lane_geo.get(level, (20, lane_h, "#6b7280"))
        slot = (W - 40) / len(eids)
        for j, eid in enumerate(eids):
            nw = min(slot - 24, 200)
            nx = 20 + j * slot + (slot - nw) / 2
            ny = y + lh / 2 - 32
            node_geo[eid] = (nx + nw / 2, ny, nw, 48)
            parts.append(
                f'<g data-entity-id="{esc(eid)}" data-entity-type="dimension" data-lane="{esc(level)}">'
                f'<rect x="{nx:.0f}" y="{ny:.0f}" width="{nw:.0f}" height="48" rx="5" '
                f'fill="#fff" stroke="{accent}" stroke-width="1.5"/>'
                f'<text x="{nx + nw / 2:.0f}" y="{ny + 28:.0f}" text-anchor="middle" '
                f'font-size="11" font-weight="600" fill="#1f2937">{esc(spec.entities[eid]["label"])}</text></g>')

    # lane-level pseudo-nodes for cross-level edges (composition/sampling)
    for level, (y, lh, _) in lane_geo.items():
        node_geo.setdefault(f"{level}-level", (100, y + lh / 2 - 6, 0, 12))

    for e in spec.edges:
        s, t = e["source"], e["target"]
        if s not in node_geo or t not in node_geo:
            continue
        sx, sy, sw, sh = node_geo[s]
        tx, ty, tw, th = node_geo[t]
        x1, y1 = (sx + sw / 2, sy + sh / 2) if abs(sy - ty) < 20 else (sx, sy if ty > sy else sy)
        x2, y2 = (tx - tw / 2, ty + th / 2) if abs(sy - ty) < 20 else (tx, ty + th if ty < sy else ty)
        dash = EDGE_DASH.get(e.get("line_style", "solid"), "")
        dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        parts.append(
            f'<g data-edge-type="{esc(e["type"])}" data-source="{esc(s)}" data-target="{esc(t)}">'
            f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" '
            f'stroke="#374151" stroke-width="1.5"{dash_attr} marker-end="url(#ar)"/>'
            f'<text x="{mx:.0f}" y="{my - 6:.0f}" text-anchor="middle" font-size="8" '
            f'font-weight="700" fill="#374151" letter-spacing="0.5">{esc(e["type"])}</text></g>')
    return "\n".join(parts)
