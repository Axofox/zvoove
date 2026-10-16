# Proposed Test Suite — SauceDemo Checkout (short suite)

**Scope:** `https://www.saucedemo.com/`, using the credentials in `01-task/task.md`.
**Size:** 5 cases chosen by risk, one per main kind of check. Not covered on purpose: State and UI categories.
**Status:** plan only. Screenshot links are planned evidence destinations, not proof that a file exists.

<a id="tc-001"></a>
## TC-001 — Complete checkout for the required products

**Category:** Happy Flow
**Based on:** `01-task/task.md`, Scenario steps 1–7; `02-rules/quality-standards.md`, Cart, Checkout Form, Order Summary and Order Confirmation
**Preconditions:** Fresh browser session, not logged in, cart empty.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Log in with the credentials from `01-task/task.md`. | The product list is shown. |
| 2 | Add Sauce Labs Backpack and Sauce Labs Bike Light to the cart. | The cart counter shows 2. |
| 3 | Open the cart. | Exactly those two items are listed, with the same prices as on the product list. |
| 4 | Click Checkout, then type a first name, last name and postal code. | Each field shows the text that was typed. |
| 5 | Click Continue. | The order summary opens; item total equals the sum of the two prices, and total equals item total plus tax. |
| 6 | Click Finish. | A clear order confirmation is shown. |
| 7 | Look at the cart counter. | The counter is zero or hidden. |

**Pass criteria:** The order completes with the entered details kept, correct totals, a confirmation and an empty cart.
**Fail criteria:** Any step is blocked, a field loses its text, a total does not add up, or the cart is not cleared.
**Screenshot:** [../evidence/screenshots/tc-001-step-6.png](../evidence/screenshots/tc-001-step-6.png)

<a id="tc-002"></a>
## TC-002 — Add the same item twice

**Category:** Cart CRUD
**Based on:** `02-rules/test-types.md`, Cart CRUD — Add same item twice; `02-rules/quality-standards.md`, Cart
**Preconditions:** Logged in, cart empty.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Add Sauce Labs Backpack to the cart. | The cart counter shows 1. |
| 2 | Try to add Sauce Labs Backpack again. | Either the quantity becomes 2 or a second line appears; the counter shows 2. |
| 3 | Open the cart. | The cart shows two units of the Backpack, and the line prices or total reflect both. |

**Pass criteria:** Two units are in the cart and the counter and prices agree.
**Fail criteria:** The second add is ignored, or the counter, quantity or prices disagree.
**Screenshot:** [../evidence/screenshots/tc-002-step-3.png](../evidence/screenshots/tc-002-step-3.png)

<a id="tc-003"></a>
## TC-003 — Block checkout with a required field missing

**Category:** Negative
**Based on:** `02-rules/test-types.md`, Negative — Skip required fields; `02-rules/quality-standards.md`, Checkout Form
**Preconditions:** Logged in, one item in the cart, on the checkout information page.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Leave all fields empty and click Continue. | Checkout does not continue and a message names what is missing. |
| 2 | Fill only first name and click Continue. | Checkout does not continue and a message names the missing field. |
| 3 | Fill first name and last name, leave postal code empty, click Continue. | Checkout does not continue and a message names the postal code. |

**Pass criteria:** Checkout is blocked every time a required field is empty, and the message says which one.
**Fail criteria:** Checkout continues with a missing field, or the message does not name the missing field.
**Screenshot:** [../evidence/screenshots/tc-003-step-3.png](../evidence/screenshots/tc-003-step-3.png)

<a id="tc-004"></a>
## TC-004 — Reject script injection in checkout fields

**Category:** Security
**Based on:** `02-rules/test-types.md`, Security — XSS, script injection; `02-rules/quality-standards.md`, Checkout Form
**Preconditions:** Logged in, one item in the cart, on the checkout information page.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | In the first name field (name field type), type `<script>alert(1)</script>`. | The text stays in the field; no alert appears. |
| 2 | In the last name field (name field type), type `<img src=x onerror="alert(1)">`. | The text stays in the field; no alert appears. |
| 3 | Type a valid postal code and click Continue. | The summary or the page shows no alert and does not break. |

**Pass criteria:** No script runs and the page keeps working.
**Fail criteria:** An alert appears, the page breaks, or a field silently drops the text.
**Screenshot:** [../evidence/screenshots/tc-004-step-3.png](../evidence/screenshots/tc-004-step-3.png)

<a id="tc-005"></a>
## TC-005 — Prices stay the same from list to summary

**Category:** Data Integrity
**Based on:** `02-rules/test-types.md`, Data Integrity — Price consistency; `02-rules/quality-standards.md`, Product Page and Order Summary
**Preconditions:** Logged in, cart empty.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Note the price of Sauce Labs Backpack and Sauce Labs Bike Light on the product list. | Two prices are written down. |
| 2 | Add both to the cart and open the cart. | Each cart price equals the price noted in step 1. |
| 3 | Continue checkout with valid details to the summary. | Each item price on the summary equals the price noted in step 1. |

**Pass criteria:** Every price is identical on the list, in the cart and on the summary.
**Fail criteria:** Any price differs between pages, or the summary cannot be reached.
**Screenshot:** [../evidence/screenshots/tc-005-step-3.png](../evidence/screenshots/tc-005-step-3.png)
