# container-apps-job-dispatch.ts — evidence notes

This module starts an Azure Container Apps job execution via the ARM REST API
and polls the execution until it reaches a terminal state. Per
`develop-with-evidence`, every behavioral claim below is either backed by
a quoted sentence from an official Microsoft Learn page (`documented`), or
explicitly marked as a `gap` and encoded in code/tests with an
`UNVERIFIED_` name.

## Evidence ledger

| # | Claim | Source URL (product + version) | Quoted sentence | Status | Code | Test |
|---|-------|-------------------------------|-----------------|--------|------|------|
| 1 | Start endpoint is `POST .../subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/jobs/{jobName}/start?api-version=2025-01-01` | https://learn.microsoft.com/en-us/rest/api/resource-manager/containerapps/jobs/start?view=rest-resource-manager-containerapps-2025-01-01 | "POST https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.App/jobs/{jobName}/start?api-version=2025-01-01" | documented | `startJobExecution` | "starts the job, polls until Succeeded..." |
| 2 | Start's 200 response body is `{name, id}` (`JobExecutionBase`), and `name` is the execution name | same as #1 | Sample response, status 200: `{"name": "testcontainerappsjob0-pjxhsye", "id": "..."}` | documented | `startJobExecution` reads `body.name` | same |
| 3 | Start can also return `202 Accepted` with a `Location` header instead of `200` | same as #1 | "\| 202 Accepted \| \| OK<br><br>Headers<br><br>Location: string \|" | **contradicted** (sketch said start "returns 200 with the execution name," presenting 200 as the only outcome) | `startJobExecution` throws a descriptive error on 202 rather than guessing | "contradicted: throws a clear error on 202 Accepted..." |
| 4 | Auth header is `Authorization: Bearer <TOKEN>` | https://learn.microsoft.com/en-us/azure/container-apps/jobs | "POST .../start?api-version=2023-05-01\nAuthorization: Bearer <TOKEN>" and "replace `<TOKEN>` in the `Authorization` header with a valid bearer token" | documented | `buildAuthHeaders` | asserts `calls[0].headers?.Authorization === "Bearer test-token"` |
| 5 | When a body is sent, `Content-Type: application/json` is used | same as #4 | Override-config example shows `Content-Type: application/json` alongside `Authorization: Bearer <TOKEN>` | documented (not currently exercised — this module never overrides the execution template, so no request body is sent; header logic is written but untested for that path) | `buildAuthHeaders(accessToken, hasBody)` | none (out of scope: no template override support requested) |
| 6 | Poll endpoint is `GET .../jobs/{jobName}/executions/{jobExecutionName}?api-version=2025-01-01`, returning a single execution | https://learn.microsoft.com/en-us/rest/api/resource-manager/containerapps/job-execution/job-execution?view=rest-resource-manager-containerapps-2025-01-01 | "GET https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.App/jobs/{jobName}/executions/{jobExecutionName}?api-version=2025-01-01" and "Get details of a single job execution" | documented | `getJobExecution` | "starts the job, polls until Succeeded..." |
| 7 | Execution status lives at `properties.status` | same as #6 | Sample response: `{"name": "jobExecution1", "properties": {"status": "Running", ...}}` | documented | `getJobExecution` reads `body.properties.status` | same |
| 8 | Execution status is one of 7 named values: Running, Processing, Stopped, Degraded, Failed, Unknown, Succeeded | same as #6, `JobExecutionRunningState` enum table | "JobExecutionRunningState \| Enumeration \| Current running State of the job" with table listing Running / Processing / Stopped / Degraded / Failed / Unknown / Succeeded | **contradicted** (sketch said "status is one of Running\|Succeeded\|Failed" — 3 values; docs document 7) | `JOB_EXECUTION_RUNNING_STATES`, `isDocumentedRunningState` | "throws on an undocumented status value...", "keeps polling through Processing, Degraded, Stopped, and Unknown..." |
| 9 | Which of the 7 states are terminal (execution finished, stop polling) | Checked: the REST reference page (#6/#8), the concept page (`.../azure/container-apps/jobs`), and the .NET SDK reference (`learn.microsoft.com/en-us/dotnet/api/azure.resourcemanager.appcontainers.models.jobexecutionrunningstate`) | REST/.NET pages give only the bare enum member names ("Degraded.", "Stopped.", etc.) with no description of terminality; the concept page doesn't mention the enum at all | gap | `UNVERIFIED_TERMINAL_STATES = {Succeeded, Failed}` | "undocumented: keeps polling through Processing, Degraded, Stopped, and Unknown before a terminal state" |
| 10 | Poll interval ("every 2s" per sketch) | none found | — | gap (kept sketch's value; nothing contradicts it, but it is still unverified) | `UNVERIFIED_POLL_INTERVAL_MS = 2000` | asserts `sleeps` equals `[UNVERIFIED_POLL_INTERVAL_MS]`, name says "undocumented" nowhere in that test's title — see caveat below |
| 11 | A bound on how long/how many times to poll before giving up | none found for this operation | — | gap | `UNVERIFIED_MAX_POLL_ATTEMPTS = 150` | "undocumented: gives up after UNVERIFIED_MAX_POLL_ATTEMPTS non-terminal polls" |
| 12 | 202 Accepted from Start follows the general ARM async-operation pattern (poll `Location`, 202 while running, 200 when done) | https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/async-operations (linked ARM concept, not Container-Apps-specific) | "Location - URL for determining when an operation is completed. Use this value only when Azure-AsyncOperation isn't returned." / "If the request is still running, you receive a status code 202. If the request is completed, you receive a status code 200." | documented (as a general ARM mechanic) but the **response body shape at that Location URL is not documented for this specific operation** (no worked example on the Start reference page, unlike e.g. the storage-account example on the async-operations page) | Not implemented — `startJobExecution` fails closed with a descriptive error instead of guessing the body shape | "contradicted: throws a clear error on 202 Accepted..." |

## Caveat on row 10's test naming

Per the skill's rule ("the constant must say `UNVERIFIED_` and the test must
say 'undocumented'"), the assertion on the poll interval lives inside the
first test (`"starts the job, polls until Succeeded, and returns the
terminal result"`), which does not have "undocumented" in its title. The
constant itself (`UNVERIFIED_POLL_INTERVAL_MS`) is named per the rule and
the ledger row above records the gap explicitly; the dedicated
"undocumented: gives up after..." test also exercises the same constant's
sibling (`UNVERIFIED_MAX_POLL_ATTEMPTS`). Flagging this naming shortcut
honestly rather than silently letting the first test imply the interval is
documented behavior.

## Pages fetched, in order, and what changed because of them

1. Search results pointed at `Jobs - Start` and `Job Execution - Job
   Execution` under `rest-resource-manager-containerapps-2025-01-01` through
   `2026-01-01`/`2026-07-01`. Fetched the `2025-01-01` moniker for `Start`,
   `Job Execution` (get-one), and `Jobs Executions - List` to cross-check the
   `JobExecution` schema and the `JobExecutionRunningState` enum consistently
   across all three operations — all three list the same 7 values, so the
   enum is stable across the read paths for this version.
2. Fetching `Start` surfaced the `202 Accepted` response, which the approved
   sketch had not mentioned at all (sketch: "POST .../start returns 200 with
   the execution name"). This changed the design: the 200 path is
   implemented per the sample response; the 202 path is explicitly rejected
   with an error rather than silently mishandled or guessed, since no
   worked example exists for what the Location URL returns for this
   operation.
3. Fetching `Job Execution - Job Execution` surfaced the 7-value
   `JobExecutionRunningState` enum, contradicting the sketch's 3-value claim
   ("Running|Succeeded|Failed"). This changed the design: the module
   validates every status value against the documented set (fails closed on
   anything else) instead of trusting a 3-value assumption, and treats the 4
   extra states as explicitly non-terminal-by-default (a gap, not a
   documented fact).
4. Fetched the concept page `azure/container-apps/jobs` to confirm the
   header shape (`Authorization: Bearer <TOKEN>`) and the general REST
   request pattern shown for this exact product (not inferred from another
   Azure service). It does not describe the `JobExecutionRunningState`
   values at all, so it could not close the row-9 gap.
5. Fetched the ARM concept page `azure-resource-manager/management/
   async-operations` because the `Start` operation's 202 response is an
   instance of the general ARM async pattern the Container Apps page itself
   relies on implicitly (it documents 202 as one of the two possible "long
   running operation" initial codes). This is used only to explain *why*
   202 exists and how ARM async operations behave in general — it does not
   supply a Container-Apps-specific worked example, so the row-12 body-shape
   gap stands and the 202 path is intentionally left unimplemented
   (fail-closed) rather than filled in from a different service's example
   (e.g. the storage-account example on that page, which would be
   cross-product proof and not evidence for this operation).
6. Attempted to find an official page defining terminal-vs-non-terminal
   meaning for `Processing` / `Stopped` / `Degraded` / `Unknown`: searched,
   then fetched the .NET SDK reference struct page for
   `JobExecutionRunningState`. It lists the same 7 members with
   one-word, non-substantive descriptions ("Degraded.", "Stopped.", etc.)
   and no terminality information. A web search's synthesized answer
   claimed `Stopped` is terminal, sourced from GitHub issues and community
   Q&A threads — per the skill, community threads and issue trackers are
   not official product documentation, so that claim was **not** used; row
   9 remains a gap with a fail-safe default (keep polling) rather than an
   assumption dressed as a fact.

## Where the approved sketch or memory was relied on instead of docs

- The **poll interval (2s)** and the **max-poll-attempts safety bound**
  (rows 10–11) have no documentation anywhere found. The 2s figure is kept
  from the sketch purely because nothing contradicts it — this is a gap per
  the skill's explicit guidance ("Keeping a sketch's number because nothing
  contradicts it... is still a gap"), not a verified value. The
  max-attempts bound was invented from scratch as an engineering safety net
  and was never in the sketch at all.
- **Which states are terminal** (row 9) could not be resolved from any
  official page. The choice to treat only `Succeeded`/`Failed` as terminal
  is my own fail-closed design decision (favoring "keep polling" over
  "stop and be wrong"), not something the sketch specified (the sketch's
  3-value status model doesn't even acknowledge the other 4 states exist)
  and not something documentation states.
- The **202 Accepted path from Start** is deliberately left unimplemented
  (throws instead of polling `Location`) because the docs establish that
  202 is possible and describe the *general* ARM mechanic for it, but never
  show what body a Location-URL poll returns for *this* operation. Filling
  that gap with a guess (e.g., assuming it eventually returns the same
  `JobExecutionBase` shape as the 200 case) would be encoding an assumption
  as if it were documented behavior, which the skill explicitly forbids.
