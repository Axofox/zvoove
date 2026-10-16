# Manual Test Plan — Shared Browser Session — 2026-10-15

**Scope:** Time-bounded manual checks against SauceDemo, based on `01-task/task.md` and the applicable quality standards and test types.
**Session timebox:** 45 minutes total: MTP-001 (15 min), MTP-002 (8 min), MTP-003 (8 min), MTP-004 (8 min), MTP-005 (6 min). Stop a case at its time limit and record the furthest step reached.
**Execution status:** MANUAL RUN COMPLETE. All five cases were attempted in the shared browser; downstream checkout steps blocked by the form defect are marked not exercised.

**Evidence note:** Browser observations were recorded in `evidence/manual-run-2026-10-15.json`. Only the MTP-005 screenshot was saved; no screenshot is claimed for the other cases.

## Case Index

| Case | Category | Coverage |
|---|---|---|
| [MTP-001](#mtp-001) | Happy Flow | Checkout through the furthest reachable step, with conditional completion if reachable |
| [MTP-002](#mtp-002) | Data Integrity | Listing-to-detail name, description, image, and price comparison for Backpack and Bike Light |
| [MTP-003](#mtp-003) | Cart CRUD | Quantity-edit availability and repeated-add behavior |
| [MTP-004](#mtp-004) | Negative | Checkout field retention and validation after Continue, including First Name invalid styling |
| [MTP-005](#mtp-005) | Negative | Required-field validation when information is incomplete |

<a id="mtp-001"></a>
## MTP-001 — Checkout through the furthest reachable step

**Category:** Happy Flow
**Based on:** `01-task/task.md`, Scenario steps 1–7; `02-standards/quality-standards.md`, Cart, Checkout Form, Order Summary, and Order Confirmation
**Preconditions:** Open a fresh SauceDemo session, use the credentials in `01-task/task.md`, and ensure the cart is empty. Allow 15 minutes. Use distinct valid customer values that can be checked field by field.
**Timebox:** 15 minutes; do not repeat a blocked transition.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Sign in using the provided credentials. | The product listing is displayed and usable. |
| 2 | Add Sauce Labs Backpack and Sauce Labs Bike Light once each. | Both intended products are selected and the cart counter shows two items. |
| 3 | Open the cart and inspect its contents and prices. | Exactly the two intended products appear, each at quantity 1; each price matches its listing price. |
| 4 | Start checkout and enter valid first name, last name, and postal code. | The customer-information form accepts and visibly retains each value in its corresponding field. |
| 5 | Activate Continue once. | If valid data is accepted, the order summary appears. If progress is blocked, a visible validation message explains the issue; record this as the furthest reachable step and do not retry or infer later-step behavior. |
| 6 | If the summary is reached, verify its items, quantities, item total, tax, and grand total; independently add item prices and check grand total = item total + tax. | The summary contains the two selected products and correct arithmetic, with no unexplained amount. |
| 7 | If the summary is reached and time remains, activate Finish once. | A clear confirmation identifies the order; the cart badge is zero or hidden. |

**Pass criteria:** The flow advances through every reachable step within the timebox, all observed contents and totals are correct, and a confirmation with a cleared cart is shown if Finish is reachable.
**Fail criteria:** An unexpected blocker prevents the next required step, data or products are wrong, totals are inconsistent, or a reached confirmation is unclear or leaves a populated cart. Steps not reached are recorded as not exercised, not as passes.
### Result

**Status:** FAIL  
**Severity:** blocker  
**Actual outcome:** Login and both product additions succeeded; the cart badge showed 2 and both intended products appeared at quantity 1 with prices $9.99 and $29.99. Entering Maya, Nguyen, and 94105 left “Nguyen” in First Name and Last Name empty. Continue remained on the information form with “Error: Last Name is required”; summary and confirmation were not reached.  
**Evidence:** Browser-observed page state and values are recorded in `evidence/manual-run-2026-10-15.json`. No screenshot file was captured for this case.

<a id="mtp-002"></a>
## MTP-002 — Compare Backpack and Bike Light listing details

**Category:** Data Integrity
**Based on:** `02-standards/quality-standards.md`, Product Page (product-specific image, descriptions, and price consistency); `02-standards/test-types.md`, Data Integrity — Price consistency
**Preconditions:** Signed in with the product listing visible. Cart contents do not affect this comparison. Allow 8 minutes.
**Timebox:** 8 minutes.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | On the listing, note the displayed name, description, image, and price for Sauce Labs Backpack. | All four listing attributes are identifiable for the Backpack. |
| 2 | Open the Backpack detail view from its listing entry. | The detail view is for Sauce Labs Backpack; its name, description, image, and price can be inspected. |
| 3 | Compare the Backpack listing attributes with its detail attributes. | Name and description identify the same product, the image is the Backpack image rather than a placeholder or another item, and the price matches exactly. |
| 4 | Return to the listing, note the same four attributes for Sauce Labs Bike Light, and open its detail view. | The detail view is for Sauce Labs Bike Light and exposes its name, description, image, and price. |
| 5 | Compare the Bike Light listing attributes with its detail attributes and compare its description/image/price with the Backpack. | Listing and detail values agree for the Bike Light; its image is product-specific. Flag identical descriptions between these products as suspicious/failure unless their images and prices also match exactly. |

**Pass criteria:** For both products, listing and detail names, descriptions, images, and prices correspond; images are product-specific and price is identical across the two views.
**Fail criteria:** A detail view opens for the wrong product, any attribute is inconsistent, an image is a placeholder/wrong product, or descriptions are duplicated without the matching-image-and-price exception.
### Result

**Status:** FAIL  
**Severity:** major  
**Actual outcome:** The listing showed Backpack at $29.99 and Bike Light at $9.99 with distinct listing descriptions and names. Clicking Backpack opened the Fleece Jacket detail at $49.99 with the jacket description/image; clicking Bike Light opened the Bolt T-Shirt detail at $15.99 with the T-shirt description/image. Both detail views were for different products than selected.  
**Evidence:** The observed listing/detail names, descriptions, prices, and URLs are recorded in `evidence/manual-run-2026-10-15.json`. No screenshot file was captured for this case.

<a id="mtp-003"></a>
## MTP-003 — Check quantity editing and repeated add

**Category:** Cart CRUD
**Based on:** `02-standards/test-types.md`, Cart CRUD — Add same item twice and Update quantity; Multiple quantities; `02-standards/quality-standards.md`, Cart quantities and prices
**Preconditions:** Fresh signed-in session, empty cart, product listing visible. Allow 8 minutes.
**Timebox:** 8 minutes.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Add Sauce Labs Bike Light once and inspect its listing control and cart counter. | The counter immediately reflects one selected unit. |
| 2 | Use the available interface to add the same Bike Light a second time. | The cart represents exactly two units, either as quantity 2 or as two lines; the counter reflects two. If no second-add action is available, record that behavior and continue to the cart inspection without inventing an alternate control. |
| 3 | Open the cart and compare represented quantity and amount with twice the listing unit price. | If two units were added, quantity and amount account for exactly both units. |
| 4 | Inspect the cart for an exposed quantity-edit control. If present, change the Bike Light quantity from 1 to 2 (or from 2 to 1). | The control accepts the change and visibly displays the new quantity. If no edit control is exposed, record quantity editing as unavailable and do not treat an absent control as a successful update. |
| 5 | After an edit, inspect the line amount and cart counter. | The amount equals quantity multiplied by the listing unit price, and any displayed counter agrees with the resulting quantity. |

**Pass criteria:** Repeated add represents two units with the correct counter and arithmetic; any exposed quantity-edit control updates quantity, line amount, and count consistently. Report edit as unavailable if there is no exposed control.
**Fail criteria:** Repeated add yields an incorrect quantity/count/amount, or an exposed edit control fails to update the cart consistently.
### Result

**Status:** FAIL  
**Severity:** major  
**Actual outcome:** Adding Bike Light once changed its listing action to Remove and showed badge 1; no second Add action was available. The cart showed one Bike Light at $9.99. The cart contained zero input/select/contenteditable quantity controls, so quantity editing is unavailable.  
**Evidence:** Browser-observed badge, control state, cart row, and zero editable controls are recorded in `evidence/manual-run-2026-10-15.json`. No screenshot file was captured for this case.

<a id="mtp-004"></a>
## MTP-004 — Verify checkout values and Continue validation state

**Category:** Negative
**Based on:** `02-standards/quality-standards.md`, Checkout Form; `02-standards/test-types.md`, Negative / Edge Cases — Skip required fields
**Preconditions:** Fresh signed-in session with one product in the cart; customer-information form displayed. Allow 8 minutes. Use valid, distinguishable values for first name, last name, and postal code.
**Timebox:** 8 minutes; submit once and do not repeatedly retry a blocked form.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Enter distinct valid values into First Name, Last Name, and Postal Code, checking each field before moving to the next. | Each value remains in its intended field; no value silently replaces or clears another field. |
| 2 | Activate Continue once. | If input is valid, the order summary is shown. Otherwise, checkout remains on the form and visibly identifies the validation issue. |
| 3 | If the form remains visible, inspect the First Name field and its validation styling/message. | A valid retained first name is not marked red as invalid. Any red invalid state is accompanied by a coherent reason and is treated as a failure when the entered value is valid. |
| 4 | Record the actual visible field values, validation message, and furthest reached step without changing the values. | The observations are sufficient to distinguish correct field retention and validation from a field-mapping or styling defect. |

**Pass criteria:** All entered values remain in their intended fields; Continue advances for valid input, or any block accurately identifies invalid data; First Name is not marked red when its retained value is valid.
**Fail criteria:** A value is dropped/misplaced, Continue blocks without coherent validation, or First Name is shown red/invalid despite containing the valid value entered.
### Result

**Status:** FAIL  
**Severity:** blocker  
**Actual outcome:** Entering Maya, Nguyen, and 94105 resulted in First Name=`Nguyen`, Last Name empty, and Postal Code=`94105`. After one Continue, the form stayed on `checkout-step-one.html`, displayed “Error: Last Name is required”, and applied the `input_error form_input error` class to both name fields.  
**Evidence:** Exact values, URL, error text, and field classes are recorded in `evidence/manual-run-2026-10-15.json`. No screenshot file was captured for this case.

<a id="mtp-005"></a>
## MTP-005 — Confirm required-field validation blocks progress

**Category:** Negative
**Based on:** `02-standards/quality-standards.md`, Checkout Form — required fields enforced; `02-standards/test-types.md`, Negative / Edge Cases — Skip required fields
**Preconditions:** Fresh signed-in session with one product in the cart; customer-information form displayed with all fields empty. Allow 6 minutes.
**Timebox:** 6 minutes.

### Steps

| # | Action | Expected outcome |
|---|--------|-----------------|
| 1 | Leave all customer-information fields empty and activate Continue once. | Checkout does not advance, and a visible validation message identifies missing required information. |
| 2 | Enter valid values in all but one required field, then activate Continue once. | Checkout remains blocked and identifies the omitted field; no unrelated field is marked invalid without a coherent reason. |

**Pass criteria:** Both empty and partial submissions are blocked with visible, relevant validation and no transition to the order summary.
**Fail criteria:** Checkout proceeds with required information missing, validation is absent/irrelevant, or an unrelated valid field is incorrectly marked invalid.
### Result

**Status:** PASS  
**Actual outcome:** With all fields empty, Continue kept the browser on the information page and displayed “Error: First Name is required.” First Name received the `input_error form_input error` class.  
**Evidence:** [MTP-005 required-field screenshot](../evidence/manual-run-2026-10-15/MTP-005-required-fields.png); exact URL, error text, and field class are in `evidence/manual-run-2026-10-15.json`.

## Test Plan Summary

**Proposed test cases:** 5
**Categories covered:** Happy Flow, Data Integrity, Cart CRUD, Negative
**Out of scope:** Security payloads and long/special-character inputs; refresh, multi-tab, and timeout state checks; reduced-viewport and CTA reachability checks; removal/empty-cart operations; discount behavior and order history. These are excluded from this 45-minute shared-browser plan to prioritize the requested checkout, product comparison, cart quantity, and form-validation checks.

**Execution status:** MANUAL RUN COMPLETE
**Results:** 1 PASS, 4 FAIL, 0 SUSPICIOUS, 0 OUT OF SCOPE within this focused five-case plan. The full order-summary and confirmation behavior was not exercised because checkout was blocked by the field-mapping defect.