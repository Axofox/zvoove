# Judge report (MOCK EXAMPLE)

> **This file is a hand-written example, not real model output.** It shows the format that `npm run judge:ollama` or the QA Judge agent produces, using the real case titles and the real lint result. The scores are invented for illustration. Run the judge to get real ones; it overwrites `05-judge/judge-report.md`, not this file.

Verdict: **REVISE**  ·  model: `example`  ·  runs: 3  ·  mean score: 10.2/12

## Deterministic checks
```
20 cases checked in 04-test-cases/test-cases.md
no deterministic problems
```

## Case scores
Order: observable, atomic, discriminating, selfContained, isolating, minimal. Spread is the gap between the best and worst run; above 1 means the judge disagrees with itself.

| Case | Scores | Avg /12 | Spread | Traceable | Top fix |
|---|---|---|---|---|---|
| TC-001 — Complete checkout for the required products | 2 2 2 2 1 1 | 10.0 | 0 | yes | Split into login, add-to-cart and checkout cases so a form bug does not hide the rest. |
| TC-002 — Add one item to the cart | 2 2 2 2 2 2 | 12.0 | 0 | yes | None. |
| TC-003 — Add the same item twice | 2 2 2 2 2 2 | 12.0 | 0 | yes | None. |
| TC-004 — Update cart quantity | 2 2 2 2 2 1 | 11.0 | 0 | yes | Add what to record if the cart has no quantity control. |
| TC-005 — Remove an item from the cart | 2 2 2 2 2 2 | 12.0 | 0 | yes | None. |
| TC-006 — Empty the cart | 2 2 2 2 2 2 | 12.0 | 0 | yes | None. |
| TC-007 — Block checkout with required fields missing | 2 2 2 2 1 2 | 11.0 | 0 | yes | Test each required field on its own. |
| TC-008 — Navigate backward and forward during checkout | 1 2 1 2 0 1 | 7.0 | 1 | yes | Needs the summary page, so it is blocked by the form bug; add a precondition that reaches it another way. |
| TC-009 — Verify multiple quantities and arithmetic | 2 2 2 2 1 2 | 11.0 | 0 | yes | Quantity and arithmetic are two checks; split them. |
| TC-010 — Reject script injection in checkout fields | 2 2 2 2 2 2 | 12.0 | 0 | yes | None. |
| TC-011 — Handle unusually long customer input | 2 2 2 2 1 2 | 11.0 | 0 | yes | The 500-character input is blocked if the last name is lost; use the first name field. |
| TC-012 — Handle special characters in customer fields | 2 2 2 2 1 2 | 11.0 | 0 | yes | Same: one special character per field. |
| TC-013 — Refresh during checkout | 1 2 1 2 1 1 | 8.0 | 2 | yes | Unstable: 'session resumes or restarts cleanly' is ambiguous. State which outcomes are acceptable. |
| TC-014 — Prevent duplicate order from two simultaneous tabs | 2 2 2 1 2 2 | 11.0 | 0 | yes | Out of scope for time, as stated. |
| TC-015 — Communicate session timeout during checkout | 2 2 2 1 2 2 | 11.0 | 0 | yes | Out of scope for time, as stated. |
| TC-016 — Check checkout controls are reachable | 1 2 1 2 0 1 | 7.0 | 0 | yes | Depends on reaching the Finish button, which the form bug blocks. |
| TC-017 — Use checkout at a reduced viewport height | 2 2 1 2 0 2 | 9.0 | 0 | yes | Same blocker; check the viewport on pages that are reachable. |
| TC-018 — Investigate product-detail and cross-stage consistency | 2 1 2 2 1 1 | 9.0 | 0 | yes | Mixes product page, cart and summary checks; split by page. |
| TC-019 — Check that a discount is applied once | 1 2 1 1 1 2 | 8.0 | 1 | yes | Depends on a promotion existing; say what to record if none is offered. |
| TC-020 — Verify discount arithmetic independently | 1 2 1 1 1 2 | 8.0 | 0 | yes | Same dependency as TC-019, and arithmetic needs a discount to exist. |

## Cases to revisit
Below 9/12 or not traceable:
- TC-008 — Navigate backward and forward during checkout: 7/12
- TC-013 — Refresh during checkout: 8/12
- TC-016 — Check checkout controls are reachable: 7/12
- TC-019 — Check that a discount is applied once: 8/12
- TC-020 — Verify discount arithmetic independently: 8/12

## Judge stability
Unstable cases (the rubric or the case is ambiguous): TC-013 — Refresh during checkout
