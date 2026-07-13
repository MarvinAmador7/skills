/**
 * Reference implementation: isometric layered "blueprint" illustration.
 *
 * This is a COMPLETE, WORKING example to adapt — not a fill-in template.
 * It renders a stack of extruded isometric slabs on an isometric floor grid,
 * with mono leader-labels and a single reserved accent color.
 *
 * STYLING: Tailwind CSS (v4). Structure and motion are Tailwind utilities —
 * there is NO companion stylesheet. The hover lift uses `group`/`group-hover:`:
 * the `group` goes on the CONTAINING PANEL (see usage note at the bottom), NOT
 * on the <svg> — hovering an SVG's empty areas does not reliably fire :hover,
 * so an SVG-as-group would only lift when you're over painted geometry. Each
 * slab then lifts via `group-hover:-translate-y-[Npx]`, and motion is gated
 * with the `motion-reduce:` variant. Colors come from your `@theme` design
 * tokens, referenced as `var(--token)` on SVG presentation attributes (per-face
 * fills carry accent opacity, which reads cleanest as an attribute; you could
 * equally use Tailwind `fill-primary/16` utilities).
 *
 * Portability: the geometry is plain SVG math — nothing here is React- or
 * Tailwind-specific except the className strings. Not on Tailwind? The same
 * rules map to a tiny companion stylesheet: `transition` on `.iso-slab`, a
 * `.wrapper:hover .iso-slab { translateY(...) }` per layer, and a
 * `@media (prefers-reduced-motion: reduce)` reset. Keep the STRUCTURE
 * (one accent + neutrals, iso grid, mono labels), not these exact values.
 */

// ---- design tokens -------------------------------------------------------
// These are Tailwind v4 `@theme` tokens (CSS custom properties). Rename to your
// project's token names. The accent (`--primary`) is reserved for the key layer.
//   @theme { --color-primary: #e56f46; --color-text: #eeeeea; --color-dim: #858582; }
const ACCENT = "var(--primary)";
const TEXT = "var(--text)";
const MUTED = "var(--color-dim)";

// Illustration-internal face shades (NOT brand tokens — they only fake the
// light direction: top face lightest, right mid, left darkest). Keep as local
// constants; do not promote these to design tokens.
const TOP_FILL = "#17171a";
const RIGHT_FILL = "#101013";
const LEFT_FILL = "#0b0b0d";
const EDGE = "rgba(238,238,234,0.16)"; // thin top-edge stroke
const SIDE_EDGE = "rgba(238,238,234,0.07)";

// ---- geometry knobs ------------------------------------------------------
const RX = 54; // top-face half-width (horizontal radius)
const RY = 27; // top-face half-height — MUST be RX/2 for a true 2:1 isometric
const DEPTH = 13; // slab thickness (extrusion downward)
const CX = 96; // stack centre x

// Layers are listed TOP-of-screen first. The LAST entry is the load-bearing
// base and is the ONLY one that gets the accent.
const LAYERS = [
  { name: "AUTONOMY", sub: "reason · propose · act", marker: "diamond", accent: false },
  { name: "GOVERNANCE", sub: "RBAC ∩ allowlist ∩ policy", marker: "hexagon", accent: false },
  { name: "DURABILITY", sub: "idempotent · recoverable", marker: "ring", accent: false },
  { name: "AUTHORITY", sub: "postgres truth · immutable audit", marker: "core", accent: true },
] as const;

const CY = [34, 80, 126, 172]; // screen-y of each top-face centre (evenly spaced)

// Hover lift per layer (upper slabs travel more; the accent base stays put) —
// a parallax depth cue. These MUST be LITERAL class strings, one per layer:
// Tailwind's scanner reads source as plain text and only generates utilities it
// sees verbatim, so a template like `-translate-y-[${n}px]` would emit nothing.
const LIFT_CLASS = [
  "group-hover:-translate-y-[10px]",
  "group-hover:-translate-y-[6px]",
  "group-hover:-translate-y-[3px]",
  "", // accent base: no lift
];

const LABEL_X = 184;
const MARKER_X = 172;
const LEADER_FROM = CX + RX;
const LEADER_TO = 164;

// ---- isometric primitives ------------------------------------------------
// A slab = top rhombus + two extruded side faces. The rhombus vertices are the
// four isometric directions from its centre; sides drop straight down by DEPTH.
const topFace = (cy: number) =>
  `M ${CX} ${cy - RY} L ${CX + RX} ${cy} L ${CX} ${cy + RY} L ${CX - RX} ${cy} Z`;
const rightFace = (cy: number) =>
  `M ${CX + RX} ${cy} L ${CX} ${cy + RY} L ${CX} ${cy + RY + DEPTH} L ${CX + RX} ${cy + DEPTH} Z`;
const leftFace = (cy: number) =>
  `M ${CX - RX} ${cy} L ${CX} ${cy + RY} L ${CX} ${cy + RY + DEPTH} L ${CX - RX} ${cy + DEPTH} Z`;
const insetRhombus = (cy: number, s = 0.6) =>
  `M ${CX} ${cy - RY * s} L ${CX + RX * s} ${cy} L ${CX} ${cy + RY * s} L ${CX - RX * s} ${cy} Z`;

// ---- isometric floor grid ------------------------------------------------
// Two families of parallel lines at slopes +0.5 and -0.5 (the SAME axes the
// slab faces use), covering the whole viewBox, analytically clipped to it.
// A gradient MASK fades it so it grounds the base and dissolves upward.
const FLOOR_W = 356;
const FLOOR_H = 250;
const FLOOR_STEP = 24; // grid density (smaller = denser)

function buildFloor(): Array<[number, number, number, number]> {
  const lines: Array<[number, number, number, number]> = [];
  // right-descending: y = 0.5x + b
  for (let b = -FLOOR_W / 2; b <= FLOOR_H; b += FLOOR_STEP) {
    const x1 = Math.max(0, -2 * b);
    const x2 = Math.min(FLOOR_W, 2 * (FLOOR_H - b));
    if (x2 - x1 > 0.5) lines.push([x1, 0.5 * x1 + b, x2, 0.5 * x2 + b]);
  }
  // left-descending: y = -0.5x + c
  for (let c = 0; c <= FLOOR_H + FLOOR_W / 2; c += FLOOR_STEP) {
    const x1 = Math.max(0, 2 * (c - FLOOR_H));
    const x2 = Math.min(FLOOR_W, 2 * c);
    if (x2 - x1 > 0.5) lines.push([x1, -0.5 * x1 + c, x2, -0.5 * x2 + c]);
  }
  return lines;
}
const FLOOR_LINES = buildFloor();

// ---- label markers (tiny geometric glyphs, NOT icon-library icons) -------
function Marker({ kind, x, y }: { kind: string; x: number; y: number }) {
  const d = `M ${x} ${y - 5.5} L ${x + 5.5} ${y} L ${x} ${y + 5.5} L ${x - 5.5} ${y} Z`;
  if (kind === "core") return <path d={d} fill={ACCENT} />;
  if (kind === "diamond") return <path d={d} fill="none" stroke={MUTED} strokeWidth={1.1} />;
  if (kind === "hexagon") {
    const pts = [0, 1, 2, 3, 4, 5]
      .map((i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${(x + Math.cos(a) * 6).toFixed(2)} ${(y + Math.sin(a) * 6).toFixed(2)}`;
      })
      .join(" L ");
    return <path d={`M ${pts} Z`} fill="none" stroke={MUTED} strokeWidth={1.1} />;
  }
  // ring (a recover/loop hint)
  return (
    <g fill="none" stroke={MUTED} strokeWidth={1.1}>
      <path d={`M ${x + 5} ${y - 1.6} A 5.2 5.2 0 1 1 ${x - 3.6} ${y - 3.6}`} strokeLinecap="round" />
      <path d={`M ${x - 3.6} ${y - 5.8} L ${x - 3.6} ${y - 3.2} L ${x - 1} ${y - 3.4}`} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function IsometricStack() {
  return (
    // Layout utilities only. The hover-root `group` lives on the CONTAINING
    // PANEL (see usage note at the bottom of this file), not here.
    // `overflow-visible` lets the longest mono caption bleed past the viewBox.
    <svg
      className="block h-auto w-full overflow-visible"
      viewBox="0 0 356 250"
      role="img"
      aria-label="Layered system: a durable base carrying higher layers."
    >
      <defs>
        <filter id="isoGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <clipPath id="isoClip">
          <rect x="0" y="0" width="356" height="250" />
        </clipPath>
        {/* bottom→top fade: grid is grounded at the base, gone by the top */}
        <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.95" />
        </linearGradient>
        <mask id="floorMask">
          <rect x="0" y="0" width="356" height="250" fill="url(#floorFade)" />
        </mask>
      </defs>

      {/* 1. isometric floor grid (drawn first, behind everything) */}
      <g clipPath="url(#isoClip)" mask="url(#floorMask)">
        {FLOOR_LINES.map((l, i) => (
          <line key={i} x1={l[0].toFixed(2)} y1={l[1].toFixed(2)} x2={l[2].toFixed(2)} y2={l[3].toFixed(2)} stroke="rgba(238,238,234,0.28)" strokeWidth={0.75} />
        ))}
      </g>

      {/* 2. dashed spine tying the stack together */}
      <line x1={CX} y1={CY[0]} x2={CX} y2={CY[CY.length - 1]} stroke="rgba(238,238,234,0.14)" strokeWidth={1} strokeDasharray="2 4" />

      {/* 3. one soft accent glow behind the base only — brightens on hover */}
      <path
        className="opacity-40 [transition:opacity_0.55s_ease] group-hover:opacity-75 motion-reduce:[transition:none]"
        d={topFace(CY[CY.length - 1])}
        fill={ACCENT}
        filter="url(#isoGlow)"
      />

      {/* 4. slabs — render top-of-screen first so nearer (lower) slabs paint over.
             Each lifts on hover via `group-hover:-translate-y-*`; the accent base
             (LIFT 0) stays put. Motion is disabled under prefers-reduced-motion. */}
      {LAYERS.map((layer, i) => {
        const cy = CY[i];
        const a = layer.accent;
        return (
          <g
            key={layer.name}
            className={[
              "[transition:transform_0.55s_cubic-bezier(0.2,0.7,0.15,1)]",
              LIFT_CLASS[i],
              "motion-reduce:[transition:none] motion-reduce:group-hover:translate-y-0",
            ].join(" ")}
          >
            <path d={leftFace(cy)} fill={a ? "rgba(229,111,70,0.11)" : LEFT_FILL} stroke={a ? "rgba(229,111,70,0.4)" : SIDE_EDGE} strokeWidth={1} />
            <path d={rightFace(cy)} fill={a ? "rgba(229,111,70,0.24)" : RIGHT_FILL} stroke={a ? "rgba(229,111,70,0.4)" : SIDE_EDGE} strokeWidth={1} />
            <path d={topFace(cy)} fill={a ? "rgba(229,111,70,0.16)" : TOP_FILL} stroke={a ? ACCENT : EDGE} strokeWidth={1} />
            <path d={insetRhombus(cy)} fill="none" stroke={a ? "rgba(229,111,70,0.45)" : "rgba(238,238,234,0.08)"} strokeWidth={1} />

            <line x1={LEADER_FROM} y1={cy} x2={LEADER_TO} y2={cy} stroke="rgba(238,238,234,0.18)" strokeWidth={1} />
            <Marker kind={layer.marker} x={MARKER_X} y={cy} />
            <text x={LABEL_X} y={cy - 2.5} fill={a ? ACCENT : TEXT} style={{ fontFamily: "var(--font-ui, monospace)", fontSize: "11px", letterSpacing: "1.5px" }}>
              {layer.name}
            </text>
            <text x={LABEL_X} y={cy + 10} fill={MUTED} style={{ fontFamily: "var(--font-ui, monospace)", fontSize: "8px", letterSpacing: "0.3px" }}>
              {layer.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---- Usage: the PANEL is the hover-root ----------------------------------
 * Put `group` on the framing panel that contains the illustration (rule #3:
 * a flat framed panel). Hovering anywhere in the panel then lifts the slabs —
 * reliable, unlike hovering an SVG's transparent interior.
 *
 *   <figure className="group relative border border-[var(--line)] bg-[var(--surface)] p-6">
 *     <IsometricStack />
 *   </figure>
 *
 * ---- Tailwind gotchas (both verified against a real build) ----------------
 * 1. LITERAL classes only. Tailwind's JIT scans source as plain TEXT and only
 *    generates a utility whose full name appears verbatim. A computed class
 *    like `group-hover:-translate-y-[${n}px]` is invisible — the lift silently
 *    renders nothing. Hence LIFT_CLASS is hardcoded literal strings by index.
 *    (Must compute them? Safelist the exact strings in your Tailwind config.)
 * 2. In Tailwind v4, `translate-y-*` sets the CSS `translate` property, NOT
 *    `transform`. If you debug in DevTools, read `translate` (you'll see
 *    `0px -10px`); `getComputedStyle(el).transform` stays `none`.
 * ------------------------------------------------------------------------- */
