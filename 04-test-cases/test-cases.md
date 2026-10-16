# Proposed Test Suite — SauceDemo Checkout

**Scope:** `https://www.saucedemo.com/`, using the credentials in `01-task/task.md`.
**Timebox:** 120 minutes total; about 102 minutes of planned execution, 18 for setup and evidence. TC-014 and TC-015 are out of scope (see their timebox lines).
**Status:** plan only. Results of the 2026-10-15 run are in `07-history/run-results-2026-10-15.md`.
Screenshot links are planned evidence destinations, not proof that a file exists.

<a id="tc-001"></a>
## TC-001 — Complete checkout for the required products

**Category:** Happy Flow
**Based on:** `01-task/task.md`, Scenario steps 1–7; `02-standards/quality-standards.md`, Cart, Checkout Form, Order Summary, and Order Confirmation
**Preconditions:** Start a fresh browser session at the application. Use the provided `problem_user` credentials. Allow approximately 15 minutes.
**Timebox:** In scope (15 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Sign in with the provided credentials. | The product listing is displayed and the session is usable. |
| 2 | Add Sauce Labs Backpack and Sauce Labs Bike Light to the cart. | Both named products are selected, and the cart counter reflects two units. |
| 3 | Open the cart. | The cart contains exactly the Backpack and Bike Light, each at quantity 1, with prices matching the listing. |
| 4 | Start checkout. | The customer-information form is displayed. |
| 5 | Enter valid first name, last name, and postal code in the fields provided. | Each value remains visible in its field. |
| 6 | Continue to the order summary. | The summary lists both selected products and quantities. Item total equals the independently added item prices; tax is consistent with the displayed rate/calculation, and grand total equals item total plus tax. |
| 7 | Complete the order. | A clear confirmation is displayed with the ordered items and final amount; the cart is empty or its badge is zero/hidden. |
| 8 | Look for an accessible order-history view and inspect it if present. | If present, it shows this order's items, quantities, prices, and totals. If no history view is exposed, report that requirement unsupported; do not infer that history works. |

**Pass criteria:** The required products can be checked out and confirmed with retained customer data, correct visible totals, and a cleared cart; order history is verified only if an accessible view exists.
**Fail criteria:** A required action is blocked unexpectedly, the wrong items or totals appear, entered data is lost, confirmation is unclear, or the cart remains populated after the order.

**Screenshot:** [../evidence/screenshots/tc-001-step-9.png](../evidence/screenshots/tc-001-step-9.png)

<a id="tc-002"></a>
## TC-002 — Add one item to the cart

**Category:** Cart CRUD
**Based on:** `02-standards/test-types.md`, Cart CRUD — Add; `02-standards/quality-standards.md`, Product Page and Cart
**Preconditions:** Fresh session, signed in, cart empty, product listing displayed. Allow 5 minutes.
**Timebox:** In scope (5 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Add Sauce Labs Backpack. | Its add control changes to the corresponding remove state, and the cart counter immediately shows 1. |
| 2 | Open the cart. | Exactly one Backpack is present at quantity 1 with the listing price. |

**Pass criteria:** The selected item appears exactly once and the cart counter and displayed price are correct.
**Fail criteria:** The item is missing/duplicated, the counter is stale, or its cart price differs from the listing.

**Screenshot:** [../evidence/screenshots/tc-002-step-4.png](../evidence/screenshots/tc-002-step-4.png)

<a id="tc-003"></a>
## TC-003 — Add the same item twice

**Category:** Cart CRUD
**Based on:** `02-standards/test-types.md`, Cart CRUD — Add same item twice
**Preconditions:** Fresh session, signed in, cart empty, product listing displayed. Allow 5 minutes.
**Timebox:** In scope (5 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Add Sauce Labs Bike Light twice using the available add/quantity controls. | The cart represents two units, either as quantity 2 or two lines, and the counter reflects 2. |
| 2 | Open the cart and compare its total for this item with twice the listing unit price. | Both units are accounted for exactly once; the line(s) and cart amount equal two unit prices. |

**Pass criteria:** The cart and counter represent exactly two Bike Lights and the amount equals two unit prices.
**Fail criteria:** One or more units are missing/duplicated in the amount, or the counter/total disagrees with the represented quantity.

**Screenshot:** [../evidence/screenshots/tc-003-step-4.png](../evidence/screenshots/tc-003-step-4.png)

<a id="tc-004"></a>
## TC-004 — Update cart quantity

**Category:** Cart CRUD
**Based on:** `02-standards/test-types.md`, Cart CRUD — Update quantity; `02-standards/quality-standards.md`, Cart
**Preconditions:** Fresh session, signed in, cart contains one Sauce Labs Backpack. Allow 5 minutes.
**Timebox:** In scope (5 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Change the Backpack quantity to 2 using the cart's exposed quantity control. | The quantity is visibly 2. |
| 2 | Observe the line amount, cart total, and counter if shown. | The displayed amount updates to twice the unit price and the cart count reflects 2 without stale values. |

**Pass criteria:** The quantity, line amount, cart total, and count (where shown) update consistently.
**Fail criteria:** Quantity cannot be changed despite an exposed control, or any displayed amount/count remains inconsistent.

**Screenshot:** [../evidence/screenshots/tc-004-step-4.png](../evidence/screenshots/tc-004-step-4.png)

<a id="tc-005"></a>
## TC-005 — Remove an item from the cart

**Category:** Cart CRUD
**Based on:** `02-standards/test-types.md`, Cart CRUD — Remove
**Preconditions:** Fresh session, signed in, cart contains one Sauce Labs Bike Light. Allow 4 minutes.
**Timebox:** In scope (4 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Remove the Bike Light from the cart. | The item disappears, the counter becomes zero or hidden, and the cart total recalculates with no Bike Light amount. |

**Pass criteria:** The removed item is absent and no stale count or price remains.
**Fail criteria:** A ghost item, stale counter, or stale amount remains after removal.

**Screenshot:** [../evidence/screenshots/tc-005-step-4.png](../evidence/screenshots/tc-005-step-4.png)

<a id="tc-006"></a>
## TC-006 — Empty the cart

**Category:** Cart CRUD
**Based on:** `02-standards/test-types.md`, Cart CRUD — Empty cart
**Preconditions:** Fresh session, signed in, cart contains both required products. Allow 3 minutes.
**Timebox:** In scope (3 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Remove every cart item using the available cart controls. | No item rows remain; the counter is zero or hidden and no item amount remains. |

**Pass criteria:** The cart is completely empty with no stale items, badge, or total.
**Fail criteria:** Any removed item or nonzero item count/amount remains visible.

**Screenshot:** [../evidence/screenshots/tc-006-step-5.png](../evidence/screenshots/tc-006-step-5.png)

<a id="tc-007"></a>
## TC-007 — Block checkout with required fields missing

**Category:** Negative
**Based on:** `02-standards/test-types.md`, Negative / Edge Cases — Skip required fields; `02-standards/quality-standards.md`, Checkout Form
**Preconditions:** Fresh session, signed in, at least one item in cart, on the customer-information form. Allow 5 minutes.
**Timebox:** In scope (5 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Leave every customer-information field empty and activate Continue. | Progress is blocked and a visible validation message identifies the missing or invalid information. |
| 2 | Enter valid values in all but one required field and activate Continue again. | Progress remains blocked and the omitted required field is identified. |

**Pass criteria:** Empty and partial forms cannot proceed and visibly identify the validation issue.
**Fail criteria:** Checkout proceeds with a required field missing or provides no observable indication of why it is blocked.

**Screenshot:** [../evidence/screenshots/tc-007-step-6.png](../evidence/screenshots/tc-007-step-6.png)

<a id="tc-008"></a>
## TC-008 — Navigate backward and forward during checkout

**Category:** Negative
**Based on:** `02-standards/test-types.md`, Negative / Edge Cases — Back and forward navigation
**Preconditions:** Fresh session, signed in, cart contains both required products, valid customer information entered, order summary reached. Allow 6 minutes.
**Timebox:** In scope (6 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Navigate back to the customer-information step. | The prior customer values remain present, or any reset is clearly communicated before proceeding. |
| 2 | Navigate forward to the order summary. | Both products and quantities remain correct and item/tax/grand totals remain consistent with the displayed values. |

**Pass criteria:** Back/forward navigation preserves or clearly communicates data state and does not corrupt cart contents or totals.
**Fail criteria:** Data or totals change silently, required values disappear without notice, or cart contents become inconsistent.

**Screenshot:** [../evidence/screenshots/tc-008-step-8.png](../evidence/screenshots/tc-008-step-8.png)

<a id="tc-009"></a>
## TC-009 — Verify multiple quantities and arithmetic

**Category:** Negative
**Based on:** `02-standards/test-types.md`, Negative / Edge Cases — Multiple quantities
**Preconditions:** Fresh session, signed in, cart empty, product listing displayed. Allow 4 minutes.
**Timebox:** In scope (4 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Add Sauce Labs Backpack multiple times until the cart represents three units. | The cart visibly represents quantity 3, whether in one line or multiple lines. |
| 2 | Compare the displayed item amount with three times the listing unit price. | The amount is exactly the sum for three units, with no missing or extra unit. |

**Pass criteria:** The three selected units and their calculated amount agree.
**Fail criteria:** Quantity representation or amount incorrectly omits, duplicates, or misprices a unit.

**Screenshot:** [../evidence/screenshots/tc-009-step-4.png](../evidence/screenshots/tc-009-step-4.png)

<a id="tc-010"></a>
## TC-010 — Reject script injection in checkout fields

**Category:** Security
**Based on:** `02-standards/test-types.md`, Security — XSS / script injection
**Preconditions:** Fresh session, signed in, at the customer-information form with a cart item. Use only fields actually exposed by the form. Allow 7 minutes.
**Timebox:** In scope (7 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Enter `<script>alert(1)</script>` in an exposed name field and `<img src=x onerror="alert(1)">` in another exposed text field; attempt to continue. | Neither payload executes; the page remains usable and input is safely retained, rejected, or rendered as text. |
| 2 | If an address, postal-code, or email field is exposed, repeat with the payload in that field type. | The payload does not execute and the UI remains intact. If a field type is not exposed, record that target as unsupported, not passed. |

**Pass criteria:** No supplied payload executes in any tested field, and validation/rendering does not break the page.
**Fail criteria:** A payload executes or causes unsafe rendering, a broken UI, or an unhandled error.

**Screenshot:** [../evidence/screenshots/tc-010-step-5.png](../evidence/screenshots/tc-010-step-5.png)

<a id="tc-011"></a>
## TC-011 — Handle unusually long customer input

**Category:** Security
**Based on:** `02-standards/test-types.md`, Security — Unusually long input; test-case-generator heuristics for text fields
**Preconditions:** Fresh session, signed in, at the customer-information form. Use available name and address fields; allow 6 minutes.
**Timebox:** In scope (6 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Enter a string of at least 500 characters in each available name field and any available address field. | The page remains responsive; field contents are visibly retained or the input is gracefully constrained with an observable indication. |
| 2 | Attempt to continue. | The app either validates/rejects the values gracefully or proceeds without crashing or silently corrupting visible data. |

**Pass criteria:** Long input is handled predictably without a crash, broken layout, or silent data loss.
**Fail criteria:** The page crashes/freezes, silently drops data, or enters an unusable state.

**Screenshot:** [../evidence/screenshots/tc-011-step-6.png](../evidence/screenshots/tc-011-step-6.png)

<a id="tc-012"></a>
## TC-012 — Handle special characters in customer fields

**Category:** Security
**Based on:** `02-standards/test-types.md`, Security — Special characters; test-case-generator heuristics for text fields
**Preconditions:** Fresh session, signed in, at the customer-information form. Use available name, address, postal-code, and email field types; allow 5 minutes.
**Timebox:** In scope (5 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Enter `' " ; -- \ / < >` in available text fields, including name/address where present. | The UI remains intact and each value is retained or rejected with clear validation. |
| 2 | In a postal-code field, if exposed, enter letters, a negative number, a decimal, a too-short value, and a too-long value in turn. In an email field, if exposed, try a malformed value. | Invalid formats are rejected gracefully; no field breaks the checkout UI. Record absent field types as unsupported, not passed. |

**Pass criteria:** Special or malformed input is retained or rejected clearly, without breaking the form or silently losing data.
**Fail criteria:** Input causes a UI failure, unhandled error, or silent corruption, or invalid data proceeds without any expected validation.

**Screenshot:** [../evidence/screenshots/tc-012-step-6.png](../evidence/screenshots/tc-012-step-6.png)

<a id="tc-013"></a>
## TC-013 — Refresh during checkout

**Category:** State
**Based on:** `02-standards/test-types.md`, State — Refresh mid-checkout
**Preconditions:** Fresh session, signed in, cart contains both required products, customer information entered, checkout summary reached. Allow 6 minutes.
**Timebox:** In scope (6 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Refresh the page once while on the checkout summary. | The session either resumes with state intact or restarts cleanly with an observable indication; it must not silently lose data while appearing ready to place the order. |
| 2 | Inspect the current checkout/cart state without placing another order. | Any resumed items and totals are consistent, or the reset is clear and safe. |

**Pass criteria:** Refresh produces a coherent resumed or cleanly restarted state, with no silent loss or misleading stale checkout.
**Fail criteria:** Data disappears silently, stale values remain presented as current, or checkout is left broken.

**Screenshot:** [../evidence/screenshots/tc-013-step-8.png](../evidence/screenshots/tc-013-step-8.png)

<a id="tc-014"></a>
## TC-014 — Prevent duplicate order from two simultaneous tabs

**Category:** State
**Based on:** `02-standards/test-types.md`, State — Two tabs
**Preconditions:** Fresh session, signed in, cart populated and checkout available in two tabs. Allow approximately 12 minutes; excluded from this run's timebox.
**Timebox:** **OUT OF SCOPE** — excluded to preserve the 120-minute limit after the higher-priority single-tab flow and core edge cases.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Open the same checkout state in a second browser tab. | Both tabs show a coherent checkout state. |
| 2 | Complete the order in the first tab, then inspect and attempt to continue/finish in the second tab. | The second tab does not permit a duplicate order from stale state; it refreshes, blocks completion, or clearly reports the updated state. |

**Pass criteria:** Completing one order cannot create a second order from stale state in the other tab.
**Fail criteria:** The second tab permits a duplicate order or presents stale state as current without warning.
**Screenshot:** Not captured; this case was out of scope.


<a id="tc-015"></a>
## TC-015 — Communicate session timeout during checkout

**Category:** State
**Based on:** `02-standards/test-types.md`, State — Session timeout
**Preconditions:** A checkout session that can expire through normal inactivity. Allow up to 10 minutes; excluded from this run's timebox.
**Timebox:** **OUT OF SCOPE** — timeout duration is unknown and waiting/setup could consume the remaining two-hour budget.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Begin checkout and leave the session idle until it expires, if an expiry interval can be established. | The app informs the user that the session expired and redirects to login or a clear recovery state. |
| 2 | Inspect the resulting page. | It is not broken, and the cart/session loss (if any) is communicated rather than silent. |

**Pass criteria:** An expired session is clearly communicated and leaves the user at login or a usable recovery state.
**Fail criteria:** The user is left on a broken page or loses checkout/cart state silently.
**Screenshot:** Not captured; this case was out of scope.


<a id="tc-016"></a>
## TC-016 — Check checkout controls are reachable

**Category:** UI
**Based on:** `02-standards/test-types.md`, UI / Visual — Button and link reachability
**Preconditions:** Fresh session, signed in, proceed through a populated cart to checkout. Allow 4 minutes.
**Timebox:** In scope (4 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | At the listing, cart, information, summary, and confirmation stages, inspect the relevant Add to Cart, Checkout, Continue, and Finish controls. | Each available next-step CTA is visible in the viewport or scrolls into view automatically, without unexpected scrolling. |
| 2 | Activate each relevant CTA once in sequence. | Each control is reachable and advances to the expected next stage. |

**Pass criteria:** Required CTAs are visible/reachable and each advances the flow once as expected.
**Fail criteria:** A required CTA is hidden without automatic reachability or cannot be activated as expected.

**Screenshot:** [../evidence/screenshots/tc-016-step-6.png](../evidence/screenshots/tc-016-step-6.png)

<a id="tc-017"></a>
## TC-017 — Use checkout at a reduced viewport height

**Category:** UI
**Based on:** `02-standards/test-types.md`, UI / Visual — Viewport size
**Preconditions:** Fresh session, signed in, browser viewport set to approximately 700 pixels high, cart contains an item. Allow 4 minutes.
**Timebox:** In scope (4 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Navigate through cart and checkout at the reduced viewport height. | Text and controls do not overlap; required controls remain usable and are visible or brought into view. |
| 2 | Inspect the checkout form and summary at that viewport. | Fields, totals, and next-step controls remain legible and operable without clipping that prevents use. |

**Pass criteria:** The flow remains usable at the reduced viewport without overlapping content or inaccessible controls.
**Fail criteria:** Layout overlap/clipping prevents reading or completing a required action.

**Screenshot:** [../evidence/screenshots/tc-017-step-7.png](../evidence/screenshots/tc-017-step-7.png)

<a id="tc-018"></a>
## TC-018 — Investigate product-detail and cross-stage consistency

**Category:** Data Integrity
**Based on:** `02-standards/quality-standards.md`, Product Page (image, description, and price); Cart (contents and prices); Order Summary (item total); `02-standards/test-types.md`, Data Integrity — Price consistency
**Preconditions:** Fresh session, signed in, cart empty, product listing displayed. Perform this investigation for Sauce Labs Backpack and Sauce Labs Bike Light. Allow 10 minutes.
**Timebox:** In scope (10 minutes)

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | For each required product, inspect the listing name, description, image, and price. | The listing visibly identifies the selected product and shows its product-specific image, description, and price. Record the observed values for comparison. |
| 2 | For each required product, click its detail link if the UI exposes one. | If navigation is available, the detail view identifies the selected product; compare its name, description, image, and price with that product's listing values. If no detail link/navigation is exposed, report detail navigation and the corresponding comparison as **unsupported**, not passed or inferred. |
| 3 | Compare the two products' descriptions. | If descriptions are identical while their images or prices differ, flag the duplicate description as suspicious or failed and include both products and observed values as evidence. |
| 4 | Add both required products and open the cart. | The cart contains exactly the two selected products; each cart price matches its listing price and each detail price where detail navigation was reachable. |
| 5 | Continue to the order summary and compare the item prices and item total. | Each price remains identical across listing, reachable detail view, cart, and summary. The item total independently equals the sum of the selected quantities and item prices. |

**Pass criteria:** All reachable views identify the correct selected product and agree on description/image/price as applicable; the cart and summary prices and arithmetic match, with unavailable detail navigation explicitly reported unsupported.
**Fail criteria:** A reachable detail view is for the wrong product, visible descriptions/images/prices disagree unexpectedly, the image is a placeholder/another product, duplicate descriptions violate the stated rule, or any cross-stage price/total is inconsistent.

**Screenshot:** [../evidence/screenshots/tc-018-step-12.png](../evidence/screenshots/tc-018-step-12.png)

<a id="tc-019"></a>
## TC-019 — Check that a discount is applied once

**Category:** Data Integrity
**Based on:** `02-standards/test-types.md`, Data Integrity — Discount codes, single application; `02-standards/quality-standards.md`, Product Page and Order Summary
**Preconditions:** Fresh session, signed in, cart contains an eligible item. A promotion code/control must be discoverable in the UI or supplied by the application; do not invent a code. Allow 4 minutes.
**Timebox:** In scope (4 minutes); if no promotion is offered, report discount-code behavior unsupported.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | If the UI offers a promotion, apply one valid code once and proceed to the order summary. | A single discount line is shown and the discount is applied once. If no code/control is offered, record unsupported rather than assuming a discount exists. |
| 2 | Inspect the summary for repeated discount lines or compounded application. | The discount is not duplicated or compounded unexpectedly. |

**Pass criteria:** When a promotion is available, it appears and applies exactly once; otherwise its absence is reported unsupported.
**Fail criteria:** An available promotion is duplicated, compounded incorrectly, or omitted from a summary that indicates it is active.

**Screenshot:** [../evidence/screenshots/tc-019-step-6.png](../evidence/screenshots/tc-019-step-6.png)

<a id="tc-020"></a>
## TC-020 — Verify discount arithmetic independently

**Category:** Data Integrity
**Based on:** `02-standards/test-types.md`, Data Integrity — Discount codes, correct calculation; `02-standards/quality-standards.md`, Order Summary
**Preconditions:** Fresh session, signed in, eligible cart and a valid promotion code/control discoverable in the UI. Do not invent a code. Allow 4 minutes.
**Timebox:** In scope (4 minutes); if no promotion is offered, report discount-code calculation unsupported.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Apply the available valid promotion and reach the summary. | The summary shows the pre-discount item total, discount, taxable amount/tax, and grand total where those values are exposed. |
| 2 | Independently calculate the discounted amount and tax from the displayed prices/rate. | Discount and tax arithmetic match the displayed terms; grand total equals the appropriately discounted subtotal plus tax, with no unexplained amount or rounding discrepancy. If no promotion is available, report unsupported rather than passing. |

**Pass criteria:** An available discount is mathematically correct and the final total reconciles; unavailable promotion behavior is reported unsupported.
**Fail criteria:** Discount, tax, or grand total does not reconcile with the displayed prices and rate, or an active discount is not carried through correctly.

**Screenshot:** [../evidence/screenshots/tc-020-step-6.png](../evidence/screenshots/tc-020-step-6.png)
