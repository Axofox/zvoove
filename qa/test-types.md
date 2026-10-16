# Test Types — E-commerce Checkout Agent

This file tells the AI agent what kinds of tests to run beyond the happy flow.
For each category, the agent should attempt the scenario, observe the outcome,
and report whether the behaviour matches expectations.

---

## Happy Flow

The baseline. A user logs in, adds items, fills the form correctly, and completes the order successfully.
Everything in quality-standards.md must pass in this flow before edge cases are explored.

---

## Cart CRUD

The cart must behave correctly for all create, read, update and delete operations.

- **Add:** Adding an item must appear in the cart and update the counter
- **Add same item twice:** Should either increment quantity to 2, or add a second line — either is acceptable, but the total must reflect both units correctly
- **Update quantity:** Changing quantity in the cart must immediately update the line price and the cart total
- **Remove:** Removing an item must eliminate it from the cart, update the counter, and recalculate the total — no ghost items, no stale prices
- **Empty cart:** Removing all items must result in a completely empty cart with a zero or hidden counter

---

## Negative / Edge Cases

- **Skip required fields:** Attempt to continue checkout without filling required fields — the form must block progress and clearly indicate what is missing
- **Back and forward navigation:** Navigate backwards through checkout steps and then forward again — previously entered data must be preserved, totals must remain correct
- **Multiple quantities:** Add the same item multiple times — the cart must reflect the correct total quantity and price, not duplicate line items incorrectly

---

## Security

- **XSS — script injection:** Enter `<script>alert(1)</script>` and `<img src=x onerror="alert(1)">` into form fields — the payload must not execute in the browser
- **Unusually long input:** Enter a string of 500+ characters into name and address fields — the app must handle it without crashing or behaving unexpectedly
- **Special characters:** Enter characters like `' " ; -- \ /` into fields — the app must accept or reject them gracefully, not break the UI or produce errors

---

## State

- **Refresh mid-checkout:** Refresh the page during checkout — the session should either resume where the user left off, or restart cleanly. Losing data silently without warning is a failure.
- **Two tabs:** Open the checkout in two browser tabs simultaneously and complete the order in one — the second tab must not allow a duplicate order to be placed with stale state
- **Session timeout:** If the session expires mid-checkout, the user must be informed and redirected to login — not left on a broken page or silently lose their cart

---

## UI / Visual

- **Button and link reachability:** Every CTA (Add to Cart, Checkout, Continue, Finish) must be visible in the viewport without requiring unexpected scrolling — or must scroll into view automatically
- **Viewport size:** The layout must remain usable at a reduced viewport (around 700px height) — no buttons hidden below the fold, no overlapping elements

---

## Data Integrity

- **Price consistency:** The price of an item must be identical on the product page, in the cart, and in the order summary — any discrepancy is a critical failure
- **Discount codes — single application:** If a discount code is applied, it must appear once and only once in the summary — it must not be applied twice or compound incorrectly
- **Discount codes — correct calculation:** The discounted amount must be mathematically correct — the AI must verify the arithmetic independently, not just check that a discount line exists

---

## Reporting

For every test type attempted, the agent must report:
- What it tried to do
- What actually happened
- Whether it matches the expected behaviour
- Severity if it does not: blocker / major / minor / info
- Any console errors or network anomalies observed
