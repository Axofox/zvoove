# F-002: Sorting does not change the product list

- **Status:** unconfirmed
- **Account:** problem_user
- **Seen:** every run. CI probes 10/10; a Mac run 3/3
- **Suggested severity:** major (a person decides)
- **Task flow step:** outside the 7-step flow (product page standard)

## What was observed
Selecting Name (Z to A), Price (low to high) and Price (high to low) all left the list in the default A to Z order. The prices after both price sorts were 29.99, 9.99, 15.99, 49.99, 7.99, 15.99, which is the default order. Name A to Z passes because it is the default.

## Checks that report it
`sort-za`, `sort-price-low-high`, `sort-price-high-low`.

## Standard it breaks
`02-rules/quality-standards.md`, Product Page: "selecting a different sort order must produce a different result".

## Person's decision
- Confirmed by: ______  Date: ______
- Severity / priority: ______
- Notes: ______
