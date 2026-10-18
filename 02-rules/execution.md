# 06 — Execution: the agent observes, code decides

**Rule: the AI never decides pass or fail.** It only records what it saw. Plain code compares those facts with the quality standards.

```
 test case (04)            agent (browser-use + Ollama, or a person)         code
 ─────────────  steps ──▶  records facts as JSON, no opinions  ──▶  04-scripts/check-observations.mjs
                           badge 2, prices, form values,              applies 02-rules      
                           totals, confirmation shown?                 → pass / FAIL (stable) / UNSTABLE
```

## Why

- **Repeatable verdicts.** Arithmetic and string comparison give the same answer every time. An LLM asked "is this a bug?" does not.
- **Auditable.** Every failed check names the standard it comes from and shows the values that broke it.
- **Honest about the AI.** If the agent misreads the page, the facts are wrong, and running 3 times shows it (see below). It cannot talk its way to a pass.

## What the agent records (one JSON file per run)

`added`, `listingPrices`, `cartBadge`, `cart[]` (name, price, qty), `form.typed` and `form.retained`, `summary` (itemTotal, tax, total, or `null` if never reached), `confirmation` (shown, badgeAfter). `04-scripts/observe-tc001.mjs` writes this format.

**Instruction for the agent:** *Perform the steps. After each step write down exactly what is on screen. Do not say whether anything is correct, wrong or suspicious. If something is missing, record `null`.*

## What the code checks

| Check | Standard it comes from |
|---|---|
| cart-contents | Cart: exactly the items the user added |
| badge-matches-cart | Product page: counter reflects the quantity |
| price-consistency | Data Integrity: same price on listing, cart, summary |
| form-retains-input | Checkout Form: every field keeps the text typed |
| summary-reached | Order Summary: checkout can proceed with valid data |
| item-total | Order Summary: item total equals the sum of prices |
| grand-total | Order Summary: grand total equals item total plus tax |
| confirmation | Order Confirmation: a clear confirmation is shown |
| cart-cleared | Order Confirmation: cart cleared after the order |

New standard, new check: add one line to `04-scripts/check-observations.mjs`.

## Run it 3 times

Put the 3 JSON files (or one file with a `"runs"` array) in one folder and run:

    npm run check:observations -- evidence/observations/problem_user

Each check is reported as `pass`, `FAIL (stable)` (failed in every run) or `UNSTABLE` (differs between runs). Only stable results are findings; unstable ones mean the agent or the page is not repeatable.

## Honest status

- `04-scripts/observe-tc001.mjs` is a plain Playwright script (no AI) that records real observations. An AI observer is not built yet.
- The agent runner (browser-use with Ollama) is **not built yet**. The checker works without it, so a person can fill in the JSON by hand and get the same verdicts.
- `problem_user` is a good first target: its bugs are fixed and repeatable, so a working setup should report the same stable failures every time.
