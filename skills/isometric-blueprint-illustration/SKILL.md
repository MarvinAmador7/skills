---
name: isometric-blueprint-illustration
description: Use when creating a distinctive isometric illustration of a software system in a dark, restrained "blueprint"/terminal aesthetic — layered/stacked-slab heroes, or flow/system diagrams with records, events, actions, triggers, functions, pipelines, sandboxes, and forbidden paths — and want to avoid the generic saturated "AI dashboard" illustration look.
---

# Isometric Blueprint Illustration

## Overview

A method for building **isometric layered system illustrations** in a restrained, technical "blueprint" aesthetic: extruded slabs stacked on an isometric floor grid, one reserved accent color, thin lines, and monospace micro-labels. Inline SVG geometry (portable), styled with **Tailwind utilities** — no companion stylesheet. (Not on Tailwind? The same rules map to a tiny CSS file; see the reference implementation's header note.)

**Core principle: hierarchy through restraint, not decoration.** One accent color on the single most-important element; everything else is neutral geometry and thin lines. This is what separates it from the generic look.

## When to Use

- A hero illustration or diagram of a system's **layers/architecture** (surfaces → logic → data, or trust/authority stacks)
- **System/flow diagrams**: pipelines, boundaries, event flows, validation gates — anywhere you'd otherwise draw HTML boxes-and-arrows but want one visual language with the hero
- Replacing a generic centered icon with something distinctive
- A dark, technical, engineering-credible aesthetic (portfolios, docs, landing pages)
- You want isometric depth without a heavy 3D library

**Not for:** photorealistic 3D, playful/colorful brand illustration, or flat 2D flowcharts (use boxes-and-arrows for those).

## The Aesthetic Rules (this is the whole point)

Follow these or it collapses into the generic look:

1. **ONE accent color, reserved.** Pick a single warm/branded accent and apply it to ONLY the most important element (usually the load-bearing base). Every other layer is monochrome dark with thin light strokes. **No rainbow — never one saturated color per layer.**
2. **Thin 1px strokes everywhere.** Line-drawn, not filled-and-glossy.
3. **Flat framed panel, not a glossy card.** Dark canvas, a 1px border. No rounded sheen, no big drop shadows, at most ONE soft accent glow behind the key element.
4. **Monospace micro-labels.** Uppercase, generous letter-spacing, small, muted colors. No colorful numeric badges. Titles may be sans; captions are mono.
5. **Isometric floor grid**, not an orthogonal grid. A flat/dot grid behind isometric shapes is the #1 tell of the generic look — the grid must share the slabs' perspective.
6. **Pull colors from your Tailwind `@theme` tokens**, not hardcoded hues — as `var(--primary)`/`var(--text)` on SVG `fill`/`stroke` attributes (cleanest when a face carries accent opacity), or as `fill-primary`/`text-dim` utilities. The only exception is the illustration-internal face shades (the fake-light top/right/left fills), which are local constants, not brand tokens.

## Technique

**REQUIRED:** read `reference-implementation.tsx` in this skill directory — it is a complete, working, commented example of the stacked-slab hero. For flow/system diagrams, ALSO read `reference-kit.tsx` — extracted shared primitives (slabs, tile-scale event/function nodes, flow lines, labels, legend) from a real seven-diagram build. Adapt them; don't rewrite from scratch. Key mechanics:

### Isometric geometry (2:1)
- Top face is a rhombus: half-width `rx` horizontal, half-height `ry = rx/2`. Vertices are the four iso directions from the centre `(cx, cy)`: top `(cx, cy-ry)`, right `(cx+rx, cy)`, bottom `(cx, cy+ry)`, left `(cx-rx, cy)`.
- Extrude a slab by adding a **left** and **right** side face dropping straight down by `depth`.
- **Shade to fake light:** top face lightest, right face mid, left face darkest.

### Stacking
- Space layers evenly on screen-y; the top-of-screen layer has the smallest `cy`.
- **Paint order matters:** render top-of-screen slab first so nearer (lower) slabs occlude farther ones correctly.

### Isometric floor grid
- Two families of parallel lines at slopes **+0.5 and −0.5** (the same axes as the slab faces), covering the whole viewBox, analytically clipped to it.
- Fade with a **gradient mask** (linear bottom→top to ground the base, or radial under the key element). See `buildFloor()` in the reference.

### Shape vocabulary (system diagrams)
A consistent semantic vocabulary is what makes a SET of diagrams read as one system:

| Shape | Meaning |
|---|---|
| Square slab (iso rhombus, extruded) | step · record · component · surface |
| Upright screen-space diamond | action · event |
| Upright screen-space triangle | trigger · function · gate/check |
| Large iso plane | boundary: a document, database, or sandbox (dash the strokes for a sandbox/VM) |
| Flat dashed rhombus outline ("ghost") + red ✕ | thing that must NOT exist/enter; bar its dashed path with the ✕ |

- **Diamonds and triangles are TILE-SCALE** — the same visual mass as the slabs (r ≈ 16 for rx ≈ 30 slabs). Drawn as small glyph markers they read as decoration, not participants; if the user says shapes should be "the same size as the squares," this is what they mean.
- Diamonds/triangles are drawn upright in screen space (billboarded), not iso-projected — a 45°-rotated plan square projects to a flat 2:1 rectangle and stops reading as a diamond.
- Nodes sit ON flow lines; give them a dark surface fill so they mask the line behind them.
- Include a small **legend** (mini diamond + triangle with mono captions) once per diagram so the vocabulary is legible.

### Composition patterns (beyond the stack)
- **Flows run on the ±0.5 iso axes** with small chevron heads; solid = flow, dashed = reference/stream/rejected. Climbing lanes (bottom-left → top-right), V-shapes (descend into the work, ascend to the proof), and parallel out/in lanes (slope −0.5 both ways never cross) all read well.
- **Things ride boundaries**: tiles sit ON a document/database plane; a floating slab above the plane with a dashed vertical drop line reads as elevation/reference.
- Still ONE accent per diagram, with its glow — even across a set, each diagram accents only its key element.

### Labels & motion
- A thin **leader line** from each slab's right vertex to a mono label (NAME + sub-caption) with a small hand-drawn geometric **marker** (diamond/hexagon/ring), not an icon-library glyph.
- Optional dashed **spine** connecting slab centres.
- **Budget horizontal room for labels.** Place the stack left-of-centre so names + sub-captions fit to its right, and put `overflow-visible` on the SVG so the longest caption can bleed past the viewBox instead of clipping. Keep sub-captions short (2-4 words).
- **On diagonal lanes, alternate label anchors** (left of one node, right of the next) — labels centered under every node along a lane WILL collide with neighbours or the lane itself. Labels are annotations: they may ride off the geometry (off a plane's edge) freely. A long caption that would hit the panel border splits into two lines or moves to an HTML caption under the SVG.

### Styling & motion — Tailwind, no companion CSS
- SVG carries layout utilities only: `class="block h-auto w-full overflow-visible"`.
- **Put `group` on the containing PANEL, not the SVG.** Hovering an SVG's transparent interior does not reliably fire `:hover`, so an SVG-as-`group` only lifts when the pointer is over painted geometry. The panel (`<figure class="group …">`) is the reliable hover-root.
- Static by default. Subtle **hover** via `group-hover:`: each slab lifts with its own literal `group-hover:-translate-y-[Npx]` (upper slabs travel more; the accent base stays put); the glow brightens with `group-hover:opacity-*`. Transitions are arbitrary utilities (`[transition:transform_0.55s_…]`).
- **Always gate motion with the `motion-reduce:` variant** (`motion-reduce:[transition:none]`), the Tailwind equivalent of `@media (prefers-reduced-motion: reduce)`.
- **No `group` available on the ancestor?** (e.g. a shared wrapper you can't edit that already has a class like `.chapter-visual`): use the arbitrary ancestor-hover variant on the SVG element itself — `[.chapter-visual:hover_&]:-translate-y-[5px]` — verified to generate correctly in v4.
- **Three verified Tailwind gotchas:** (1) per-slab lift classes MUST be literal strings, never string-interpolated (`-translate-y-[${n}px]`) — the JIT reads source as text and won't generate a computed class, so the hover silently does nothing; keep an array of literals indexed by layer. (2) In v4, `translate-y-*` sets the CSS `translate` property, not `transform` — so a transition declared as `[transition:transform_…]` does NOT animate the lift; it snaps. Transition the `translate` property: `[transition:translate_0.55s_…]`. (3) When several diagrams share a page, prefix every SVG defs id (`#fsGlow`, `#vgGlow`, …) per diagram — duplicate `#glow`/`#mask` ids resolve to the first one in the DOM. See `reference-implementation.tsx` and `reference-kit.tsx`.

### Building a SET of diagrams
- Extract the primitives into a shared kit module (see `reference-kit.tsx`) instead of copying 150 lines per diagram; keep each diagram file to composition + labels.
- Verify each diagram with a rendered screenshot INDIVIDUALLY — label collisions and border-clipped captions only show up rendered, and every diagram will have one or two on the first pass.

## Verify

Render it (screenshot) and check against the aesthetic rules. Ask: *does exactly one element carry the accent? Is the grid isometric? Are strokes thin? Is it a flat panel not a glossy card?* If any answer is no, you drifted toward the generic look — fix it.

## Common Mistakes (the generic-look failure modes)

| Mistake | Fix |
|---|---|
| One saturated color per layer (rainbow) | ONE accent on ONE element; rest neutral |
| Glossy gradients + heavy glows + rounded sheeny card | Flat panel, thin 1px lines, ≤1 soft glow |
| Flat/dot/orthogonal grid behind iso shapes | Isometric grid on ±0.5 axes |
| Colorful numeric badges, everything sans-serif | Mono uppercase micro-labels, muted |
| Icon-library icons on every face | Tiny geometric markers; decorate sparingly |
| Decorating every layer equally | Establish hierarchy — accent the key layer only |
| Hardcoded hex for brand colors | Tailwind `@theme` tokens: `var(--primary)` / `fill-primary` (face-shade constants excepted) |
| Hover lift does nothing (built `-translate-y-[${n}px]`) | Tailwind can't see interpolated classes — use literal `group-hover:-translate-y-[10px]` strings indexed by layer |
| Hover lift snaps instead of animating (`[transition:transform_…]`) | v4 translate utilities set the `translate` property — transition that: `[transition:translate_…]` |
| Hover only fires over painted slabs (`group` on the `<svg>`) | Put `group` on the containing panel; SVG empty areas don't capture `:hover` |
| Companion stylesheet in a Tailwind project | Utilities only: `group-hover:*` for hover, `motion-reduce:*` for reduced motion, arbitrary `[transition:...]` |
| Events/triggers drawn as tiny glyph markers | Vocabulary shapes are tile-scale participants — same visual mass as the slabs |
| One shape for everything (all slabs) | Square = record/step, diamond = action/event, triangle = trigger/function; add the mini legend |
| Labels centered under every node on a diagonal lane | Alternate anchors left/right along the lane; screenshot-verify each diagram for collisions |
| Duplicate SVG defs ids across diagrams on one page | Prefix ids per diagram (`#fsGlow`, `#vgGlow`) — duplicates silently resolve to the first in the DOM |
