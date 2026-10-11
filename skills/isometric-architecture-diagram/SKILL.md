---
name: isometric-architecture-diagram
description: Use when you need a static, presentation-grade architecture diagram (PNG/SVG) of a software system in the dark Palantir-style isometric look — layers as thin 30° slabs, components as small blocks with name tags, right-angle connectors, and one accent color on the live request path. Generates from a JSON spec, renders to 2x PNG with headless Chrome. For interactive React/Tailwind hero illustrations use isometric-blueprint-illustration instead.
license: MIT
metadata:
  author: MarvinAmador7
  version: "1.0.0"
---

# Isometric Architecture Diagram

## Overview

Turns a JSON description of a system (layers, components, flows, one highlighted path) into a
standalone SVG and a 2x PNG. The look follows Palantir's Foundry architecture-center diagrams as
reinterpreted on the g-ops landing page: black canvas, thin extruded slabs, line-art objects,
Manhattan-routed "streets" instead of a starburst, monospace micro-labels, and **one** reserved
accent. Zero dependencies beyond Node 18+ and Chrome/Chromium.

**Core principle: calm through restraint.** Hierarchy comes from the accent path and placement,
never from extra colors, shadows, or icons.

## Files

- `scripts/generate.mjs` — `node generate.mjs spec.json out.svg` → writes `out.svg` + `out.html`, warns on overlapping name tags.
- `scripts/render.sh` — `render.sh out.html out.png [w] [h]` → headless Chrome at device scale 2.
- `examples/rag-service.json` (+ `.svg`, `.png`) — generic example using auto-routing.
- `examples/addriva.json` (+ `.svg`, `.png`) — a dense real diagram using explicit routes.

## Spec format

Plane coordinates: **x runs down-right, y runs down-left** (screen = `origin + ((x−y)·cos30°, (x+y)·0.5)·scale`), z is up. Think of the plane as a map seen from the top-left.

```jsonc
{
  "title": "…", "subtitle": "…", "width": 1920, "height": 1080,
  "scale": 0.8, "origin": [698, 150],            // screen position of plane (0,0)
  "accent": "#FF9F45",                           // optional; theme/font overrides also allowed
  "legend": { "accent": "Live request path", "neutral": "Build / support" },
  "slabs":  [{ "x":0,"y":0,"w":220,"d":420,"label":"Clients","grid":40,"strata":false }],
  "boundaries": [{ "x":..,"y":..,"w":..,"d":..,"label":"R2 bucket" }],   // dashed sub-region
  "nodes":  [{ "id":"api","x":420,"y":220,"title":"API","subs":["Hono"],
               "accent":true,"dashed":false,"mono":false,"glow":false,"tagLift":0,
               "w":110,"d":70,"h":16 }],
  "edges":  [{ "from":"a","to":"b","accent":true,"dashed":false,"label":"verb","bendX":300 },
             { "points":[[165,55],[365,55]] }],                          // explicit route
  "notes":  [{ "x":1090,"y":480,"text":"versioned → R2","mono":false }]
}
```

## Workflow

1. **Gather the system.** List components, group them into 3–6 layers (clients, edge/API tier,
   compute, stores, offline/build). Write down the one flow that matters most (the live request,
   the money path). Ask only if the grouping or the hero path is genuinely unclear.
2. **Map layers to slabs.** Lay slabs on a loose grid: the main flow runs along +x (left → right
   on the plane), support/offline layers sit below on +y. Leave ~100 units of gap between slabs
   for connectors. Give the busiest slab `grid: 40`.
3. **Place nodes on a lattice.** Snap node centers to multiples of 20; keep ≥ 180 units between
   neighbors along x so tags don't collide. Use `mono` for data artifacts (versions, buckets,
   paths), `dashed` for planned/future components.
4. **Choose the accent path.** Set `accent: true` on the nodes and edges of exactly one path.
   Everything else stays gray. Never more than one accent color.
5. **Route edges.** Start with `from`/`to` (auto L/Z route along plane axes). Switch to explicit
   `points` when a route would cross a block or tag; routes that share an avenue should bundle
   on purpose. Verb labels (`label`) only on segments long enough to show the pill.
6. **Generate and render.**
   ```bash
   node scripts/generate.mjs my.json out/my.svg
   scripts/render.sh out/my.html out/my.png 1920 1080
   ```
7. **Visual QA (look at the PNG, don't trust the numbers).** Fix and re-render until every box is ticked:
   - [ ] No `WARN tag overlap` lines from the generator.
   - [ ] No connector or note crosses a name tag or slab label.
   - [ ] Accent appears only on the hero path (+ its legend swatch).
   - [ ] Every arrow ends at a block edge, not inside a block or in empty space.
   - [ ] Slab labels read along the front edge and are not covered by blocks.
   - [ ] Nothing is clipped by the canvas; adjust `origin`/`scale` first, then positions.
   - [ ] Text is ≥ 11px at 1x; tags are concise (title + ≤ 2 sub-lines).
8. **Deliver** the PNG (and SVG if they want to edit). Keep the JSON spec next to it so the diagram can be regenerated.

## Aesthetic rules

| Rule | Value |
|---|---|
| Projection | true isometric, 30° (cos30 x-scale, 0.5 y-scale) |
| Canvas | `#000`; slab top `#050505`, faces `#0B0B0C`/`#070707`, 12px edge |
| Lines | 1px `rgba(255,255,255,.18)` structure; 1.2px `#86868B` connectors; 2.2px accent |
| Connectors | right angles only, 2.6px dots at origin and bends, small filled arrowhead |
| Type | sans 13.5/600 titles, 11.5 muted subs, mono uppercase slab labels with 1.2 tracking |
| Accent | one hue, used for the hero path only; optional single radial `glow` on the key node |

## Common mistakes

- Using diagonal or curved connectors on the plane — reads as a flowchart, not a map.
- Accenting every "important" node — the accent stops meaning anything.
- Cramming 4+ sub-lines into a tag; move detail into a note or a legend.
- Fixing overlaps by shrinking text instead of moving nodes or raising `tagLift`.
