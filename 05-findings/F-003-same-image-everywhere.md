# F-003: Every product shows the same placeholder image

- **Status:** unconfirmed
- **Account:** problem_user
- **Seen:** every run. CI probes 10/10; a Mac run 3/3
- **Suggested severity:** major (a person decides)
- **Task flow step:** outside the 7-step flow (product page standard)

## What was observed
All six products use one image file, `/assets/sl-404-….jpg`, instead of their own pictures.

## Checks that report it
`product-images-distinct`.

## Standard it breaks
`02-rules/quality-standards.md`, Product Page: "each product must display the correct image for that specific product, not a placeholder or another product's image".

## Limit of the check
It only proves the six images are the same file. It cannot tell whether a single product's image is the right one; a person looks at the page for that.

## Person's decision
- Confirmed by: ______  Date: ______
- Severity / priority: ______
- Notes: ______
