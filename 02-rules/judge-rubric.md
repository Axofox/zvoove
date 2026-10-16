# Judge rubric

The judge scores the **plan**, not the shop. Lint (`npm run lint:cases`) proves structure; the judge decides what needs reading.

## Hard gates (any failure = REVISE)

1. **Traceable:** every case names a rule in `02-rules/quality-standards.md` or a scenario in `02-rules/test-types.md`, and the rule exists.
2. **Happy flow complete:** all seven steps of `01-task/task.md` section 2 appear, in order, with both products named.
3. **No invented requirements:** no expected outcome relies on behaviour neither source document states (for example a specific error text or tax rate).
4. **No claimed results:** the plan contains no Pass/Fail, "Actual outcome" or observed data.

## Scored 0–2 per case (0 = absent, 1 = weak, 2 = solid)

| Criterion | 2 means |
|---|---|
| Observable | Every expected outcome is something visible on screen. |
| Atomic | One action and one expectation per row. |
| Discriminating | A wrong behaviour would actually fail it (not "page loads"). |
| Self-contained | Preconditions let it start from nothing, including login and empty cart. |
| Isolating | It varies one thing; a failure points to one cause. |
| Minimal | No step that does not serve the pass/fail criteria. |

## Also check

- **Duplicates:** cases that would fail for the same reason (name them).
- **Gaps:** rules in `02-rules/quality-standards.md` no case covers.
- **Contradictions:** pass criteria that conflict with another case or the standards.
- **Known-defect assumptions:** `problem_user` is meant to be faulty; flag cases that would be blocked by an earlier defect and so cannot isolate their own rule (give the earlier case).

## Report format (`03-plan/judge-report.md`)

```
# Judge report — <date>
Verdict: ACCEPT | REVISE | REJECT
## Deterministic checks
<lint output>
## Hard gates
<gate: PASS/FAIL — quoted evidence>
## Case scores
| Case | Obs | Atom | Disc | Self | Isol | Min | Total /12 | Top fix |
## Duplicates, gaps, contradictions
## Cases to regenerate
```
