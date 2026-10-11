#!/usr/bin/env node
// Isometric architecture diagram generator: JSON spec -> standalone SVG (+ HTML wrapper).
// Usage: node generate.mjs spec.json out.svg   (also writes out.html next to it)
// Plane coords: x runs down-right, y runs down-left, z is up. Units are "plane px".
import fs from 'node:fs';
import path from 'node:path';

const [, , specPath, outPath = specPath.replace(/\.json$/, '.svg')] = process.argv;
if (!specPath) { console.error('usage: generate.mjs spec.json [out.svg]'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

const W = spec.width ?? 1920, H = spec.height ?? 1080;
const S = spec.scale ?? 0.8, [OX, OY] = spec.origin ?? [W * 0.36, 150];
const A = spec.accent ?? '#FF9F45';                 // ONE accent, reserved for the live path
const T = {
  bg: '#000', ink: '#F5F5F7', muted: '#A1A1A6', line: '#86868B',
  hl: 'rgba(255,255,255,0.18)', hp: 'rgba(255,255,255,0.10)', grid: 'rgba(255,255,255,0.045)',
  top: '#050505', front: '#0B0B0C', side: '#070707', blockTop: '#111113',
  ...(spec.theme ?? {}),
};
const SANS = spec.font ?? "-apple-system, 'SF Pro Text', 'Inter Tight', Inter, 'Helvetica Neue', Arial, sans-serif";
const MONO = spec.monoFont ?? "'JetBrains Mono', 'SF Mono', 'DejaVu Sans Mono', monospace";
const C = Math.cos(Math.PI / 6); // true 30° isometric
const P = (x, y, z = 0) => [OX + (x - y) * C * S, OY + (x + y) * 0.5 * S - z * S];
const f = (v) => +v.toFixed(1);
const pts = (a) => a.map((p) => p.map(f).join(',')).join(' ');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let back = '', mid = '', front = '';
const poly = (a, attr) => `<polygon points="${pts(a)}" ${attr}/>`;
const SLAB_T = spec.slabThickness ?? 12;

// ── slabs: a plane on a thin extruded edge, label typeset ON the front face ──
for (const s of spec.slabs ?? []) {
  const x0 = s.x, y0 = s.y, x1 = s.x + s.w, y1 = s.y + s.d;
  back += poly([P(x0, y1), P(x1, y1), P(x1, y1, -SLAB_T), P(x0, y1, -SLAB_T)], `fill="${T.front}" stroke="${T.hp}"`);
  back += poly([P(x1, y0), P(x1, y1), P(x1, y1, -SLAB_T), P(x1, y0, -SLAB_T)], `fill="${T.side}" stroke="${T.hp}"`);
  back += poly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], `fill="${T.top}" stroke="${T.hl}"`);
  if (s.strata) { // g-ops "governance strata": thin lines inside the edge
    const k = SLAB_T / 3;
    back += `<polyline points="${pts([P(x0, y1, -k), P(x1, y1, -k), P(x1, y0, -k)])}" fill="none" stroke="${A}" stroke-opacity=".6"/>`;
  }
  if (s.grid) {
    const g = s.grid === true ? 40 : s.grid;
    for (let x = x0 + g; x < x1; x += g) back += `<line x1="${f(P(x, y0)[0])}" y1="${f(P(x, y0)[1])}" x2="${f(P(x, y1)[0])}" y2="${f(P(x, y1)[1])}" stroke="${T.grid}"/>`;
    for (let y = y0 + g; y < y1; y += g) back += `<line x1="${f(P(x0, y)[0])}" y1="${f(P(x0, y)[1])}" x2="${f(P(x1, y)[0])}" y2="${f(P(x1, y)[1])}" stroke="${T.grid}"/>`;
  }
  if (s.label) { // skew text to lie on the front face (parallel to x axis)
    const o = P(x0 + 10, y1, -SLAB_T + 2.5);
    back += `<text transform="matrix(${f(C)},0.5,0,1,${f(o[0])},${f(o[1])})" fill="${T.muted}" font-size="10" font-weight="500" letter-spacing="1.2" font-family="${MONO}">→ ${esc(s.label.toUpperCase())}</text>`;
  }
}
// boundaries: dashed sub-regions on a slab (sandbox, bucket, VPC)
for (const b of spec.boundaries ?? []) {
  back += poly([P(b.x, b.y), P(b.x + b.w, b.y), P(b.x + b.w, b.y + b.d), P(b.x, b.y + b.d)], `fill="none" stroke="${T.hl}" stroke-dasharray="2 3"`);
  if (b.label) { const r = P(b.x + b.w, b.y + b.d); back += `<text x="${f(r[0] + 10)}" y="${f(r[1] + 4)}" fill="${T.ink}" font-size="13" font-weight="600" font-family="${SANS}">${esc(b.label)}</text>`; }
}

// ── nodes ──
const nodes = Object.fromEntries((spec.nodes ?? []).map((n) => [n.id, { w: 110, d: 70, h: 16, ...n }]));
const NODE_SIDE = (n, side) => ({ r: [n.x + n.w / 2, n.y], l: [n.x - n.w / 2, n.y], b: [n.x, n.y + n.d / 2], t: [n.x, n.y - n.d / 2] })[side];

// ── edges: right-angle routes in plane space, dots at bends, accent only if on the live path ──
for (const e of spec.edges ?? []) {
  let route = e.points;
  if (!route) {
    const a = nodes[e.from], b = nodes[e.to];
    if (!a || !b) throw new Error(`edge ${e.from}->${e.to}: unknown node`);
    const s = NODE_SIDE(a, e.fromSide ?? (b.x >= a.x ? 'r' : 'l'));
    const t = NODE_SIDE(b, e.toSide ?? (b.x >= a.x ? 'l' : 'r'));
    if (Math.abs(s[1] - t[1]) < 1) route = [s, t];
    else { const mx = e.bendX ?? (s[0] + t[0]) / 2; route = [s, [mx, s[1]], [mx, t[1]], t]; }
  }
  const q = route.map((p) => P(p[0], p[1], e.z ?? 0));
  const col = e.accent ? A : T.line;
  const dash = e.dashed ? `stroke-dasharray="${e.accent ? '6 5' : '3 5'}"` : '';
  mid += `<polyline points="${pts(q)}" fill="none" stroke="${col}" stroke-width="${e.accent ? 2.2 : 1.2}" ${dash} stroke-linejoin="round" marker-end="url(#${e.accent ? 'ma' : 'mg'})"/>`;
  [q[0], ...q.slice(1, -1)].forEach((p) => (mid += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="2.6" fill="${col}"/>`));
  if (e.label) { // verb pill at the midpoint of the longest segment (g-ops style)
    let best = 0, bi = 0;
    for (let i = 0; i < q.length - 1; i++) { const L = Math.hypot(q[i + 1][0] - q[i][0], q[i + 1][1] - q[i][1]); if (L > best) { best = L; bi = i; } }
    const m = [(q[bi][0] + q[bi + 1][0]) / 2, (q[bi][1] + q[bi + 1][1]) / 2];
    const w = e.label.length * 6.4 + 16;
    front += `<rect x="${f(m[0] - w / 2)}" y="${f(m[1] - 9)}" width="${f(w)}" height="18" rx="9" fill="#101010" stroke="rgba(255,255,255,0.15)"/>`;
    front += `<text x="${f(m[0])}" y="${f(m[1] + 3.5)}" text-anchor="middle" fill="${T.muted}" font-size="10.5" font-family="${MONO}">${esc(e.label)}</text>`;
  }
}

// blocks back-to-front (painter's order by x+y), then screen-aligned name tags
const sorted = Object.values(nodes).sort((a, b) => a.x + a.y - (b.x + b.y));
for (const n of sorted) {
  const st = n.accent ? A : T.hl, sw = n.accent ? 1.5 : 1, da = n.dashed ? 'stroke-dasharray="5 4"' : '';
  const x0 = n.x - n.w / 2, x1 = n.x + n.w / 2, y0 = n.y - n.d / 2, y1 = n.y + n.d / 2, h = n.h;
  if (n.glow) mid += `<ellipse cx="${f(P(n.x, n.y)[0])}" cy="${f(P(n.x, n.y)[1])}" rx="${f(n.w * S)}" ry="${f(n.w * S / 2)}" fill="url(#glow)"/>`;
  mid += poly([P(x0, y1), P(x1, y1), P(x1, y1, h), P(x0, y1, h)], `fill="${T.front}" stroke="${st}" stroke-width="${sw}" ${da}`);
  mid += poly([P(x1, y0), P(x1, y1), P(x1, y1, h), P(x1, y0, h)], `fill="${T.side}" stroke="${st}" stroke-width="${sw}" ${da}`);
  mid += poly([P(x0, y0, h), P(x1, y0, h), P(x1, y1, h), P(x0, y1, h)], `fill="${T.blockTop}" stroke="${st}" stroke-width="${sw}" ${da}`);
}
const tags = [];
for (const n of sorted) {
  if (!n.title) continue;
  const c = P(n.x, n.y, n.h), subs = n.subs ?? [];
  const lines = [n.title, ...subs];
  const w = Math.max(...lines.map((s, i) => s.length * (i ? 6.6 : n.mono ? 8.4 : 7.9))) + 22;
  const h = 22 + subs.length * 16;
  const bx = c[0] - w / 2, by = c[1] - h - 14 - (n.tagLift ?? 0);
  tags.push({ x: bx, y: by, w, h, id: n.id });
  front += `<line x1="${f(c[0])}" y1="${f(c[1])}" x2="${f(c[0])}" y2="${f(by + h)}" stroke="${T.hl}"/>`;
  front += `<rect x="${f(bx)}" y="${f(by)}" width="${f(w)}" height="${h}" rx="8" fill="${T.bg}" stroke="${n.accent ? A + '88' : T.hl}"/>`;
  front += `<text x="${f(c[0])}" y="${f(by + 16)}" text-anchor="middle" fill="${T.ink}" font-weight="600" font-family="${n.mono ? MONO : SANS}" font-size="${n.mono ? 12.5 : 13.5}">${esc(n.title)}</text>`;
  subs.forEach((s, i) => (front += `<text x="${f(c[0])}" y="${f(by + 16 + 16 * (i + 1))}" text-anchor="middle" fill="${T.muted}" font-size="11.5" font-family="${SANS}">${esc(s)}</text>`));
}
for (const t of spec.notes ?? []) {
  const p = P(t.x, t.y);
  front += `<text x="${f(p[0])}" y="${f(p[1] - 6)}" text-anchor="${t.anchor ?? 'middle'}" fill="${T.muted}" font-size="12" font-family="${t.mono ? MONO : SANS}" stroke="${T.bg}" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${esc(t.text)}</text>`;
}

// tag-overlap QA: warn so the author can nudge tagLift / positions
for (let i = 0; i < tags.length; i++) for (let j = i + 1; j < tags.length; j++) {
  const a = tags[i], b = tags[j];
  if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) console.warn(`WARN tag overlap: ${a.id} ↔ ${b.id} (use tagLift or move a node)`);
}

let hdr = '';
if (spec.title) hdr += `<text x="60" y="84" fill="${T.ink}" font-size="40" font-weight="600" letter-spacing="-1" font-family="${SANS}">${esc(spec.title)}</text>`;
if (spec.subtitle) hdr += `<text x="62" y="114" fill="${T.muted}" font-size="15" font-family="${SANS}">${esc(spec.subtitle)}</text>`;
const lg = spec.legend ?? { accent: 'Live request path', neutral: 'Build / support' };
if (lg) {
  const lx = W - 420;
  hdr += `<line x1="${lx}" y1="74" x2="${lx + 40}" y2="74" stroke="${A}" stroke-width="2.2"/><text x="${lx + 50}" y="79" fill="${T.muted}" font-size="14" font-family="${SANS}">${esc(lg.accent)}</text>`;
  hdr += `<line x1="${lx + 200}" y1="74" x2="${lx + 240}" y2="74" stroke="${T.line}" stroke-width="1.2"/><text x="${lx + 250}" y="79" fill="${T.muted}" font-size="14" font-family="${SANS}">${esc(lg.neutral)}</text>`;
}

const defs = `<defs>
<marker id="mg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,1L9,5L0,9z" fill="${T.line}"/></marker>
<marker id="ma" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,1L9,5L0,9z" fill="${A}"/></marker>
<radialGradient id="glow"><stop offset="0%" stop-color="${A}" stop-opacity=".22"/><stop offset="100%" stop-color="${A}" stop-opacity="0"/></radialGradient>
</defs>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${SANS}"><rect width="100%" height="100%" fill="${T.bg}"/>${defs}${back}${mid}${front}${hdr}</svg>\n`;
fs.writeFileSync(outPath, svg);
const html = outPath.replace(/\.svg$/, '.html');
fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000}</style></head><body>${svg}</body></html>\n`);
console.log(`wrote ${outPath} and ${path.basename(html)}`);
