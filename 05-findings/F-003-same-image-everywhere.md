# F-003: Every product shows the same placeholder image

- **Status:** unconfirmed
- **Account:** problem_user
- **Seen:** every run. CI probes 10/10; a Mac run 3/3
- **Suggested severity:** major, because the shop works but customers cannot tell the products apart by picture
- **Decided severity:** ______ (person)
- **Task flow step:** outside the 7-step flow (product page standard)

## What was observed
All six products use one image file, `/assets/sl-404-….jpg`, instead of their own pictures.

## Steps to reproduce
1. Log in as `problem_user` and look at the product list.
2. Compare the pictures of the six products.

**Expected:** each product shows its own picture.
**Actual:** all six show the same placeholder image.

## Checks that report it
`product-images-distinct`.

## Standard it breaks
`02-rules/quality-standards.md`, Product Page: "each product must display the correct image for that specific product, not a placeholder or another product's image".

## Limit of the check
It only proves the six images are the same file. It cannot tell whether a single product's image is the right one; a person looks at the page for that.

## Person's decision
- Confirmed by: ______  Date: ______
- Priority: ______
- Notes: ______
