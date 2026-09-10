#!/usr/bin/env bash
# Measures whether an adapter directory produced under the skill has the required shape.
# Usage: evals/measure.sh <dir> <implementation.ts> <test.ts>
# Prints counts only; read the ledger yourself before trusting the numbers.
set -euo pipefail

dir="${1:?directory}"
impl="${2:?implementation file}"
test_file="${3:?test file}"

ledger=""
for candidate in "$dir/EVIDENCE.md" "$dir/NOTES.md"; do
  if [ -f "$candidate" ] && grep -q '^| #' "$candidate"; then
    ledger="$candidate"
    break
  fi
done

echo "ledger file:                 ${ledger:-none}"
if [ -n "$ledger" ]; then
  echo "ledger rows:                 $(grep -c '^| [0-9]' "$ledger")"
  echo "ledger status=gap rows:      $(grep -c '| gap |' "$ledger")"
  echo "ledger contradicted rows:    $(grep -ci '| contradicted' "$ledger")"
fi
echo "UNVERIFIED_ occurrences:     $(grep -c 'UNVERIFIED_' "$dir/$impl" || true)"
# Only comment lines count: an endpoint base URL inside a string literal is not a citation.
echo "doc citations in code comments: $(grep -cE '^[[:space:]]*(//|\*|/\*).*(https?://|EVIDENCE\.md)' "$dir/$impl" || true)"
echo "tests naming 'undocumented': $(grep -c 'undocumented' "$dir/$test_file" || true)"
echo "cross-product citations:     $(grep -cHiE 'microsoft graph|graph\.microsoft|/graph/' "$dir"/*.md 2>/dev/null | awk -F: '{s+=$NF} END {print s+0}')"
