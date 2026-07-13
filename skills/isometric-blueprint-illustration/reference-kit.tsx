// Reference kit: shared primitives for isometric blueprint SYSTEM DIAGRAMS
// (flows, boundaries, events), extracted from a real multi-diagram build.
// Adapt alongside reference-implementation.tsx (the stacked-slab hero).
//
// Shape vocabulary: square slab = step / record / component,
// upright diamond = action / event, upright triangle = trigger / function.
// Diamonds and triangles are TILE-SCALE nodes (same visual mass as slabs),
// sitting on flow lines; their fill masks the line behind them. One accent
// element per diagram; everything else stays neutral with thin strokes.
//
// Colors reference Tailwind @theme tokens (var(--color-dim), fill-primary,
// var(--diagram-red)); the dark face fills are local constants by design.
// Accent rgba values assume --primary ≈ #e56f46; swap for your token.
//
// Usage sketch (one diagram):
//   <svg className="block h-auto w-full overflow-visible" viewBox="0 0 640 322">
//     <IsoStage id="xy" />                            // unique id per diagram!
//     <path className="opgraph-glow fill-primary opacity-30 ..." d={isoTop(430,70,70)} filter="url(#xyGlow)" />
//     <FlowLine from={[115,227]} to={[400,85]} />      // runs on a ±0.5 iso axis
//     <IsoSlab x={100} y={235} />                      // a record
//     <EventDiamond x={210} y={180} />                 // an event on the line
//     <FnTriangle x={320} y={125} r={24} />            // the function/gate
//     <IsoSlab x={430} y={70} rx={36} accent />        // THE accent element
//     <IsoLabel x={100} y={272} title="AGENT EDIT" sub="jq patch + sync" />
//     <ShapeLegend x={60} y={50} />
//   </svg>

// ---- isometric faces (rx horizontal, ry = rx/2 for true 2:1) ----
export const isoTop = (x: number, y: number, rx: number) =>
  `M ${x} ${y - rx / 2} L ${x + rx} ${y} L ${x} ${y + rx / 2} L ${x - rx} ${y} Z`;
export const isoRight = (x: number, y: number, rx: number, d: number) =>
  `M ${x + rx} ${y} L ${x} ${y + rx / 2} L ${x} ${y + rx / 2 + d} L ${x + rx} ${y + d} Z`;
export const isoLeft = (x: number, y: number, rx: number, d: number) =>
  `M ${x - rx} ${y} L ${x} ${y + rx / 2} L ${x} ${y + rx / 2 + d} L ${x - rx} ${y + d} Z`;

// ---- isometric floor grid (slopes +/-0.5), clipped analytically ----
export function buildIsoFloor(w: number, h: number, step: number): Array<[number, number, number, number]> {
  const lines: Array<[number, number, number, number]> = [];
  for (let b = -w / 2; b <= h; b += step) {
    const x1 = Math.max(0, -2 * b);
    const x2 = Math.min(w, 2 * (h - b));
    if (x2 - x1 > 0.5) lines.push([x1, 0.5 * x1 + b, x2, 0.5 * x2 + b]);
  }
  for (let c = 0; c <= h + w / 2; c += step) {
    const x1 = Math.max(0, 2 * (c - h));
    const x2 = Math.min(w, 2 * c);
    if (x2 - x1 > 0.5) lines.push([x1, -0.5 * x1 + c, x2, -0.5 * x2 + c]);
  }
  return lines;
}

// Defs + faded grid. `id` must be unique per diagram so filters/masks never collide.
export function IsoStage({ id, w = 640, h = 322 }: { id: string; w?: number; h?: number }) {
  const lines = buildIsoFloor(w, h, 26);
  return (
    <>
      <defs>
        <filter id={`${id}Glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <clipPath id={`${id}Clip`}>
          <rect x="0" y="0" width={w} height={h} />
        </clipPath>
        <radialGradient id={`${id}Fade`} cx="0.45" cy="0.5" r="0.62">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}Mask`}>
          <rect x="0" y="0" width={w} height={h} fill={`url(#${id}Fade)`} />
        </mask>
      </defs>
      <g clipPath={`url(#${id}Clip)`} mask={`url(#${id}Mask)`}>
        {lines.map((l, i) => (
          <line key={i} x1={l[0].toFixed(2)} y1={l[1].toFixed(2)} x2={l[2].toFixed(2)} y2={l[3].toFixed(2)} stroke="rgba(238,238,234,0.22)" strokeWidth={0.75} />
        ))}
      </g>
    </>
  );
}

// ---- square slab: step / record / component ----
export function IsoSlab({
  x,
  y,
  rx = 30,
  depth = 8,
  accent = false,
  dashed = false,
}: {
  x: number;
  y: number;
  rx?: number;
  depth?: number;
  accent?: boolean;
  dashed?: boolean;
}) {
  const dash = dashed ? "3 3" : undefined;
  const edge = accent ? undefined : "rgba(238,238,234,0.16)";
  const side = accent ? "rgba(229,111,70,0.4)" : "rgba(238,238,234,0.07)";
  return (
    <g>
      <path d={isoLeft(x, y, rx, depth)} fill={accent ? "rgba(229,111,70,0.11)" : "#0b0b0d"} stroke={side} strokeWidth={1} strokeDasharray={dash} />
      <path d={isoRight(x, y, rx, depth)} fill={accent ? "rgba(229,111,70,0.24)" : "#101013"} stroke={side} strokeWidth={1} strokeDasharray={dash} />
      <path d={isoTop(x, y, rx)} className={accent ? "stroke-primary" : undefined} fill={accent ? "rgba(229,111,70,0.16)" : "#17171a"} stroke={edge} strokeWidth={1} strokeDasharray={dash} />
      <path d={isoTop(x, y, rx * 0.5)} fill="none" stroke={accent ? "rgba(229,111,70,0.5)" : "rgba(238,238,234,0.08)"} strokeWidth={1} strokeDasharray={dash} />
    </g>
  );
}

export const diamondPath = (x: number, y: number, r: number) =>
  `M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;
export const trianglePath = (x: number, y: number, r: number) =>
  `M ${x} ${y - r} L ${(x + 0.9 * r).toFixed(2)} ${(y + 0.55 * r).toFixed(2)} L ${(x - 0.9 * r).toFixed(2)} ${(y + 0.55 * r).toFixed(2)} Z`;

// ---- upright diamond node: action / event (tile-scale; its fill masks the flow line) ----
export function EventDiamond({ x, y, r = 16 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <path d={diamondPath(x, y, r)} fill="#141417" stroke="rgba(238,238,234,0.35)" strokeWidth={1} />
      <path d={diamondPath(x, y, r * 0.55)} fill="none" stroke="rgba(238,238,234,0.1)" strokeWidth={1} />
    </g>
  );
}

// ---- upright triangle node: trigger / function (tile-scale) ----
export function FnTriangle({ x, y, r = 17 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <path d={trianglePath(x, y, r)} fill="#141417" stroke="rgba(238,238,234,0.35)" strokeWidth={1} strokeLinejoin="round" />
      <path d={trianglePath(x, y + 2, r * 0.5)} fill="none" stroke="rgba(238,238,234,0.1)" strokeWidth={1} strokeLinejoin="round" />
    </g>
  );
}

// ---- flow line with a chevron head ----
export function FlowLine({
  from,
  to,
  dashed = false,
  head = true,
}: {
  from: [number, number];
  to: [number, number];
  dashed?: boolean;
  head?: boolean;
}) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const a1 = angle - 0.5;
  const a2 = angle + 0.5;
  return (
    <g stroke="rgba(238,238,234,0.3)" strokeWidth={1} fill="none">
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} strokeDasharray={dashed ? "3 3" : undefined} />
      {head && (
        <path
          d={`M ${(to[0] - 6 * Math.cos(a1)).toFixed(2)} ${(to[1] - 6 * Math.sin(a1)).toFixed(2)} L ${to[0]} ${to[1]} L ${(to[0] - 6 * Math.cos(a2)).toFixed(2)} ${(to[1] - 6 * Math.sin(a2)).toFixed(2)}`}
        />
      )}
    </g>
  );
}

// ---- mono label block ----
export function IsoLabel({
  x,
  y,
  title,
  sub,
  sub2,
  anchor = "middle",
  accent = false,
}: {
  x: number;
  y: number;
  title: string;
  sub?: string;
  sub2?: string;
  anchor?: "start" | "middle" | "end";
  accent?: boolean;
}) {
  return (
    <g textAnchor={anchor}>
      <text x={x} y={y} className={`${accent ? "fill-primary" : "fill-text"} font-ui text-[10px] tracking-[1.2px]`}>
        {title}
      </text>
      {sub && (
        <text x={x} y={y + 11} className="fill-quiet font-ui text-[7px] tracking-[0.3px]">
          {sub}
        </text>
      )}
      {sub2 && (
        <text x={x} y={y + 21} className="fill-quiet font-ui text-[7px] tracking-[0.3px]">
          {sub2}
        </text>
      )}
    </g>
  );
}

// ---- shape legend (small glyph versions of the vocabulary) ----
export function ShapeLegend({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M ${x} ${y - 4} L ${x + 4} ${y} L ${x} ${y + 4} L ${x - 4} ${y} Z`} fill="none" stroke="var(--color-dim)" strokeWidth={1.1} />
      <text x={x + 10} y={y + 3} className="fill-quiet font-ui text-[7px] tracking-[0.3px]">
        action · event
      </text>
      <path d={`M ${x} ${y + 10} L ${x + 3.46} ${y + 16} L ${x - 3.46} ${y + 16} Z`} fill="none" stroke="var(--color-dim)" strokeWidth={1.1} strokeLinejoin="round" />
      <text x={x + 10} y={y + 17} className="fill-quiet font-ui text-[7px] tracking-[0.3px]">
        trigger · function
      </text>
    </g>
  );
}

// ---- red ✕: the forbidden marker ----
export function ForbiddenX({ x, y, r = 4.5 }: { x: number; y: number; r?: number }) {
  return (
    <path
      d={`M ${x - r} ${y - r} L ${x + r} ${y + r} M ${x + r} ${y - r} L ${x - r} ${y + r}`}
      stroke="var(--diagram-red)"
      strokeWidth={1.2}
      strokeLinecap="round"
    />
  );
}
