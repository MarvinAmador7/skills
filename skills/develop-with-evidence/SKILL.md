---
name: develop-with-evidence
description: Use when implementing an adapter, client, integration, fake, or conformance test against an external platform API (Azure, Microsoft Marketplace, Entra, Container Apps, Firebase, Stripe, GitHub, any vendor REST or SDK), when a sketch, ticket, teammate, or memory states how a provider behaves, or when a request mentions "official docs", "Microsoft Learn", "make sure it matches their requirements", or "don't assume". Produces code plus an auditable evidence ledger tying every assumed platform behavior to a quoted sentence from that product's official documentation.
license: MIT
metadata:
  author: MarvinAmador7
  version: "1.0.0"
---

# Develop With Evidence

## Overview

Every behavior your code assumes about a platform is a claim. A claim is either backed by a
sentence you read on that product's official documentation, or it is a gap. Both are fine.
What is not fine is a gap that looks like a documented behavior. The deliverable is code
plus an evidence ledger that lets a reviewer audit every claim in under a minute.

Reading the main page is the start, not the end. The failures this skill exists for are
subtler than "never opened the docs": stopping after one page, filling the rest with
"general convention", using another product's page as proof, and recording gaps only in
prose where code and tests cannot see them.

## The recipe

1. **List the claims first.** Before writing code, write the ledger rows: every endpoint,
   API version, header, auth audience, request/response field, status or state value,
   error code, retry or throttling rule, polling or long-running-operation mechanic,
   idempotency guarantee, and timing value you intend to rely on. If a sketch or ticket
   supplied any of these, they are claims to verify, not facts.
2. **Fetch the product's own pages, and follow the chain.** For each claim, fetch the
   official page for that product and API version. When a page names a concept it does
   not define (async operations, throttling, token scope, an enum value, a state's
   meaning), fetch the page that defines it. Stop only when every claim has a quoted
   sentence or is marked as a gap.
3. **Classify each claim** as `documented`, `gap`, or `contradicted`. A contradiction
   between the docs and a sketch, ticket, teammate, or your memory resolves in favor of
   the docs, and you report it explicitly.
4. **Encode the classification where it executes.**
   - `documented`: implement it, and put the quoted sentence with its URL in a comment at
     the code that depends on it. The test for it names the same URL.
   - `gap`: choose fail-closed where possible. If you must pick a default, name the
     constant or branch with `UNVERIFIED_` and add a test that pins the default and
     states in its name that the behavior is undocumented.
   - `contradicted`: implement what the docs say and put the discrepancy in the ledger and
     in your final report.
5. **Ship the ledger** as `EVIDENCE.md` next to the module, or as the module header if the
   project keeps evidence in code. Fill every column. Then write the summary paragraph.

## Evidence ledger (REQUIRED columns)

```markdown
| # | Claim | Source URL (product + version) | Quoted sentence | Status | Code | Test |
|---|-------|-------------------------------|-----------------|--------|------|------|
| 1 | GET subscription returns saasSubscriptionStatus in {PendingFulfillmentStart, Subscribed, Suspended, Unsubscribed} | https://learn.microsoft.com/.../pc-saas-fulfillment-subscription-api | "saasSubscriptionStatus ... Subscribed" | documented | activation.ts:isDefinitive | activation.test.ts "maps every documented status" |
| 2 | 429 responses carry Retry-After for this API | (none found on the fulfillment pages) | | gap | UNVERIFIED_RETRY_AFTER_FALLBACK_MS | activation.test.ts "undocumented: 429 without Retry-After uses fallback" |
| 3 | Start returns 200 with execution name | https://learn.microsoft.com/.../jobs/start?view=...2025-07-01 | "202 Accepted ... Location" | contradicted (sketch said 200) | dispatch.ts:start | dispatch.test.ts "202 with Location polling" |
```

Below the table, one paragraph: pages fetched in order, what changed in the design because
of them, and which claims remain gaps.

Two complete ledgers produced under this skill are in `references/`:
`example-ledger-marketplace.md` (Azure Marketplace SaaS activation) and
`example-ledger-container-apps.md` (Container Apps job dispatch).

## What counts as evidence

| Source | Counts? |
|---|---|
| Official page for this product and this API version | Yes |
| Official page for a linked concept this product references (ARM async operations, Entra token scopes) | Yes |
| A different product's page (Graph throttling for a Marketplace API) | No. It is a gap. |
| "General REST or Azure convention" | No. It is a gap. |
| Approved sketch, ticket, teammate, prior review, your memory | No. It is a claim to verify. |
| Community Q&A, GitHub issues, blog posts, search-engine summaries | No. Useful for finding the official page, never as the citation. |
| Vendor SDK source code | Only for wire shape; semantics still need the page. |

## Common mistakes

- **Stopping after the primary page.** The status enum was on the reference page, but what
  `Stopped` and `Degraded` mean was on the concept page nobody fetched. Follow the chain.
- **Gap in prose, behavior in code.** Writing "poll interval is my guess" in notes while the
  code has a bare `2000`. The constant must say `UNVERIFIED_` and the test must say
  "undocumented".
- **Cross-product proof.** Citing one Microsoft product's throttling page for another
  product's API. Different products, different contracts.
- **Silent edge decisions.** "Skip Activate when already Subscribed" chosen without a row in
  the ledger. Every undocumented edge is a gap row with a fail-closed or pinned default.
- **Keeping a sketch's number because nothing contradicts it.** A 2-second poll from a
  sketch is still a gap.

## Red flags in your own reasoning

"General convention", "implied but not stated", "I've done this before", "the design was
approved", "corroborated by hints", "not shown verbatim but standard". Each one is a ledger
row with status `gap`, not a sentence in a notes file.
