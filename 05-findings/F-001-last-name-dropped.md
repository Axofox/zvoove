# F-001: Last name is dropped, checkout cannot continue

- **Status:** unconfirmed (nobody has repeated it by hand since 2026-10-15)
- **Account:** problem_user
- **Seen:** every run. CI observer 10/10 and probes 10/10 (workflow runs 5 to 8); a Mac run 3/3 for both
- **Suggested severity:** blocker, because step 5 of the task flow (enter valid customer information) cannot be completed, so the order can never be placed
- **Decided severity:** ______ (person)
- **Task flow step:** 5 and 6 (enter valid customer information, continue through checkout)

## What was observed
Typed "Alex", "Tester", "12345" into first name, last name and postal code. The first-name field kept "Tester", the last-name field stayed empty, and Continue answered "Last Name is required". The summary and confirmation pages are never reached.

## Checks that report it
`form-retains-input`, `summary-reached`, `confirmation` (observer), `required-fields-named` (probes: with the postal code missing, the message still says "Last Name is required", because the last name never gets filled).

## Evidence
Observer JSON per run in the `observations-problem_user` artifact of each CI run. Matches the manual run recorded in git history (`03-results/history/run-results-2026-10-15.md`, TC-001).

## Person's decision
- Confirmed by: ______  Date: ______
- Priority: ______
- Notes: ______
