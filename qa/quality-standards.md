# Quality Standards — E-commerce Checkout

These rules define what "working correctly" means for an online shop checkout flow.
The AI agent uses these standards to judge every step it observes.

---

## Product Page

- Each product must display the correct image for that specific product — not a placeholder or another product's image
- Different products must not display identical descriptions unless their product images and prices also match exactly; otherwise, flag the duplicate description as suspicious or a failure and include the compared products as evidence
- The price shown on the product page must match exactly what will be charged at checkout
- Sort and filter controls must visibly change the product list when used — selecting a different sort order must produce a different result
- Adding a product to the cart must immediately update the cart counter to reflect the new quantity
- If a promotion code or discount is shown as active on the product page, that discount must carry through to the cart and be applied correctly to the final price

---

## Cart

- The cart must contain exactly the items the user added — no more, no less
- A fresh session must start with an empty cart — no leftover items from a previous session
- Quantities displayed in the cart must be correct
- Prices in the cart must match the product page prices
- If a promotion code was applied, the discounted price must be shown correctly in the cart

---

## Checkout Form

- Every input field must accept and retain the text the user types
- Required fields must be enforced — the form must not allow the user to continue if a required field is empty or invalid
- If a field silently drops input (appears filled but returns empty), this is a critical failure
- The form must not allow checkout to proceed with missing or broken data

---

## Order Summary

- Item total must equal the sum of all item prices — the AI must verify this arithmetic independently
- Tax must be calculated correctly as a percentage of the item total
- Grand total must equal item total + tax — no rounding errors, no unexplained additions
- If a promotion code was applied, the discount must appear as a line item in the summary and be deducted correctly before tax is calculated

---

## Order Confirmation

- After completing checkout, the user must see a clear order confirmation
- The confirmation must show what was ordered and the final amount charged
- The cart must be cleared after the order is placed — a full cart badge on the confirmation page is a bug
- The user must be able to access an order history showing all past orders with full details: items, quantities, prices, discounts applied, and totals
- The order history is the minimum required record — email confirmation is a desirable addition but not required

---

## General Rules

- Any failure that produces no console error is still a failure — silent bugs must be caught by observing outcomes, not by waiting for errors
- If something looks correct visually but the underlying data is wrong, it is a bug
- When in doubt, flag as suspicious and include the evidence observed
