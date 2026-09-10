# Marvin's Agent Skills

[![skills.sh](https://skills.sh/b/marvinamador7/skills)](https://skills.sh/marvinamador7/skills)

Reusable [agent skills](https://www.skills.sh/) for Claude Code and other SKILL.md-compatible agents.

## Install

```bash
npx skills add MarvinAmador7/skills
```

## Skills

### isometric-blueprint-illustration

Build **isometric system illustrations** in a restrained, technical "blueprint" aesthetic: extruded slabs on an isometric floor grid, one reserved accent color, thin 1px lines, and monospace micro-labels. Inline SVG geometry styled with Tailwind utilities, no companion stylesheet, no 3D library.

It covers two composition families:

- **Layered stacks** for hero illustrations of a system's architecture (surfaces → logic → data, trust/authority stacks)
- **Flow and system diagrams** with a semantic shape vocabulary: square slab = step/record/component, diamond = action/event, triangle = trigger/function, plane = boundary, dashed ghost + red ✕ = forbidden

| Hero stack | System diagram |
| --- | --- |
| ![Layered hero stack](assets/hero-stack.png) | ![Flow diagram with shape vocabulary](assets/system-diagram.png) |

The aesthetic collapses into the generic "AI dashboard" look without discipline, so the skill is built around hard rules: one accent color reserved for the single most important element, thin strokes, a flat framed panel with at most one soft glow, mono micro-labels, an isometric grid on the same ±0.5 axes as the shapes, and colors pulled from your design tokens.

Ships with two working references to adapt: `reference-implementation.tsx` (a complete stacked-slab hero) and `reference-kit.tsx` (shared primitives for building sets of flow diagrams — slabs, tile-scale event/function nodes, flow lines with chevrons, labels, legend). Both are plain SVG math in React/Tailwind and port easily to other stacks. The SKILL.md also documents the verified Tailwind v4 gotchas: JIT-invisible interpolated classes, the `translate` vs `transform` transition trap, ancestor-hover variants, and SVG defs-id collisions across sibling diagrams.

### develop-with-evidence

A discipline for building **adapters, clients, and integrations against an external platform** (Azure, Microsoft Marketplace, Entra, Container Apps, Firebase, Stripe, any vendor API) so that every behavior the code assumes is traceable to a quoted sentence in that product's official documentation, and every gap is visible in code and tests instead of buried in a notes file.

```bash
npx skills add MarvinAmador7/skills --skill develop-with-evidence
```

The deliverable is code plus an **evidence ledger**: one row per claim (endpoint, API version, header, auth audience, status value, error code, retry rule, polling mechanic, timing value) with the source URL, the quoted sentence, a status of `documented` / `gap` / `contradicted`, and the code and test that depend on it. Gaps become `UNVERIFIED_` constants with tests named "undocumented". Contradictions between the docs and a sketch, ticket, or memory resolve in favor of the docs and are reported. A table defines what counts as evidence; another product's page, "general convention", an approved sketch, and community threads do not.

**Evaluated, not just written.** Two pressure scenarios (a Marketplace SaaS activation adapter under a deadline, and a Container Apps job adapter with a pre-approved sketch containing a wrong status enum) were run by fresh subagents with and without the skill. The baselines read the docs but still filled gaps from convention, cited a Microsoft Graph page as proof for a Marketplace API, stopped one link short of the ARM async-operations page, and left every gap in prose. With the skill, both runs produced 12-row ledgers, unverified-prefixed constants (5 and 3 distinct), and 16 and 12 documentation citations in code comments, versus no ledger, no unverified markers, and at most one citation without it. Scenarios, verbatim baseline quotes, metrics, a measurement script, and known limits are in [`skills/develop-with-evidence/evals/`](skills/develop-with-evidence/evals/RESULTS.md). Two complete ledgers from the passing runs ship as references.

## License

MIT
