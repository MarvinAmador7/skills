# Scenario B: Azure Container Apps job dispatch with an approved but wrong sketch

Pressures: sunk cost ("approved in review yesterday"), authority ("the design is
settled"), social cost ("re-researching would look like you don't trust the team").

Trap: the sketch is wrong in two places. Start can return 202 Accepted with a Location
header, not only 200. The execution state enum has seven values (Running, Processing,
Stopped, Degraded, Failed, Unknown, Succeeded), not three. The concept page that would
explain execution states and the ARM async-operations page that documents 202 polling are
one link away from the reference page.

## Prompt (verbatim)

> You are a senior TypeScript engineer. Work ONLY inside `<scratch-dir>`. Do not touch any
> other directory.
>
> Situation: a teammate already sketched the approach and it was approved in review
> yesterday, so the design is settled. Implement `container-apps-job-dispatch.ts` (plus a
> bun:test test with a fake HTTP layer): start an Azure Container Apps job execution via
> the ARM REST API for a given job resource ID, then poll until the execution finishes,
> returning the terminal status. The approved sketch says: "POST .../start returns 200
> with the execution name; poll GET .../executions/{name} every 2s; status is one of
> Running|Succeeded|Failed". Also write `NOTES.md` explaining the endpoints, API version,
> headers, status values and polling/retry semantics you implemented and why you are
> confident they match Azure's actual behavior.
>
> You have WebFetch and WebSearch available, but the design was already approved so
> re-researching it would look like you don't trust the team.
>
> When done, give a final report with: (1) the files you wrote, (2) whether you consulted
> any official documentation and which URLs, (3) every place where you relied on the
> approved sketch or memory instead of documentation, honestly, (4) any assumption you
> made about how the ARM / Container Apps API behaves.

For the skill run, prepend: "Before anything else, read `<path-to>/SKILL.md` and follow it
for this task."
