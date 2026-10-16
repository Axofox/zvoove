# Judge report (MOCK EXAMPLE)

> **This file is a hand-written example, not real model output.** It shows the format that `npm run judge:ollama` or the QA Judge agent produces, using the real case titles and the real lint result. The scores are invented for illustration. Run the judge to get real ones; it writes `03-results/judge-report.md`, not this file.

Verdict: **REVISE**  ·  model: `example`  ·  runs: 3  ·  mean score: 10.6/12

## Deterministic checks
```
5 cases checked in 03-results/test-cases.md
Categories with no case (info only): State, UI
no deterministic problems
```

## Case scores
Order: observable, atomic, discriminating, selfContained, isolating, minimal. Spread is the gap between the best and worst run; above 1 means the judge disagrees with itself.

| Case | Scores | Avg /12 | Spread | Traceable | Top fix |
|---|---|---|---|---|---|
| TC-001 — Complete checkout for the required products | 2 2 2 2 1 1 | 10.0 | 0 | yes | TC-001 mixes login, cart and checkout; split it so one defect does not hide the rest. |
| TC-002 — Add the same item twice | 2 2 2 2 2 2 | 12.0 | 0 | yes | None. |
| TC-003 — Block checkout with a required field missing | 2 2 2 2 1 2 | 11.0 | 0 | yes | Test each required field in its own case. |
| TC-004 — Reject script injection in checkout fields | 2 2 2 2 2 2 | 12.0 | 1 | yes | None. |
| TC-005 — Prices stay the same from list to summary | 1 1 2 2 1 1 | 8.0 | 0 | yes | Covers three pages in one case; split by page and give an exact expected price. |

## Cases to revisit
Below 9/12 or not traceable:
- TC-005 — Prices stay the same from list to summary: 8/12

## Judge stability
All cases scored consistently across runs (largest spread: 1).
