# Run results — 2026-10-15

Moved out of `qa/test-cases.md`, which is plan-only. Original header (Run Findings, Run Summary) is in `qa/history/test-cases-before-manual-run-2026-10-15.md`.

## TC-001 — Complete checkout for the required products
**Status:** FAIL  
**Severity:** blocker  
**Actual outcome:** Login and both product additions succeeded; the cart badge showed 2 and both cart prices matched the listing. Entering Alex, Tester, and 12345 left “Tester” in First Name and Last Name empty. After Continue, First Name was marked red despite containing text, and the form reported “Last Name is required”; summary and confirmation were not reached.  
**Evidence:** [listing](../evidence/screenshots/tc-001-step-1.png), [cart](../evidence/screenshots/tc-001-step-5.png), [form values](../evidence/screenshots/tc-001-step-8.png), [validation](../evidence/screenshots/tc-001-step-9.png), [blocked Finish attempt](../evidence/screenshots/tc-001-step-11.png). Recorder reported a console 401 response.

## TC-002 — Add one item to the cart
**Status:** PASS  
**Actual outcome:** One Backpack was added; the badge and cart quantity were 1, and the cart price was $29.99, matching the listing.  
**Evidence:** [cart item and price](../evidence/screenshots/tc-002-step-4.png). Recorder reported a console 401 response.

## TC-003 — Add the same item twice
**Status:** FAIL  
**Severity:** major  
**Actual outcome:** The first Bike Light add changed its control to Remove, leaving no second Add control. The badge and cart quantity remained 1, not 2.  
**Evidence:** [listing after first add](../evidence/screenshots/tc-003-step-2.png), [cart quantity](../evidence/screenshots/tc-003-step-4.png). Recorder reported a console 401 response.

## TC-004 — Update cart quantity
**Status:** OUT OF SCOPE  
**Actual outcome:** The Backpack was added, but the cart exposes no quantity-edit control. The spec skipped the unavailable update action; no quantity mutation was attempted.  
**Evidence:** [cart row](../evidence/screenshots/tc-004-step-4.png). Recorder reported a console 401 response.

## TC-005 — Remove an item from the cart
**Status:** PASS  
**Actual outcome:** Removing the Bike Light removed its cart row and hid the zero-count badge.  
**Evidence:** [empty cart after removal](../evidence/screenshots/tc-005-step-4.png). Recorder reported a console 401 response.

## TC-006 — Empty the cart
**Status:** PASS  
**Actual outcome:** Both required products were removed; no cart rows or visible badge remained.  
**Evidence:** [empty cart](../evidence/screenshots/tc-006-step-5.png). Recorder reported a console 401 response.

## TC-007 — Block checkout with required fields missing
**Status:** FAIL  
**Severity:** major  
**Actual outcome:** Empty submission was blocked with “First Name is required.” After entering Alex and Tester while postal code remained empty, First Name showed “Tester” and was marked red, Last Name was empty, and the banner reported “Last Name is required.” This is inconsistent with the fields entered and does not identify the omitted postal code.  
**Evidence:** [empty-form validation](../evidence/screenshots/tc-007-step-5.png), [partial-form validation](../evidence/screenshots/tc-007-step-6.png). Recorder assertions passed their visibility checks, but the observed message contradicts the expected missing-field result. Console 401 was recorded.

## TC-008 — Navigate backward and forward during checkout
**Status:** SUSPICIOUS  
**Severity:** info  
**Actual outcome:** Login, product additions, cart, and checkout information page were reached. The customer information did not advance to the summary, so the specified summary precondition was unmet; browser back/forward did not verify summary state or totals.  
**Evidence:** [information step and validation](../evidence/screenshots/tc-008-step-6.png), [back-navigation state](../evidence/screenshots/tc-008-step-7.png), [forward-navigation state](../evidence/screenshots/tc-008-step-8.png). Console 401 was recorded.

## TC-009 — Verify multiple quantities and arithmetic
**Status:** FAIL  
**Severity:** major  
**Actual outcome:** The Backpack Add control became Remove after one click. The badge and cart quantity remained 1, so three units and the expected three-unit amount were not achieved.  
**Evidence:** [listing badge after add attempts](../evidence/screenshots/tc-009-step-2.png), [cart quantity and price](../evidence/screenshots/tc-009-step-4.png). Recorder reported a console 401 response.

## TC-010 — Reject script injection in checkout fields
**Status:** PASS  
**Actual outcome:** Neither supplied XSS payload triggered a JavaScript dialog; the checkout page remained usable and submission showed a validation message.  
**Evidence:** [payload submission and validation](../evidence/screenshots/tc-010-step-5.png). Recorder reported a console 401 response.

## TC-011 — Handle unusually long customer input
**Status:** FAIL  
**Severity:** major  
**Actual outcome:** The 500-character first name remained present, but the last-name value was not retained. No address field is exposed; continuing remained on the information page with a validation message.  
**Evidence:** [long-input fields](../evidence/screenshots/tc-011-step-5.png), [blocked submission](../evidence/screenshots/tc-011-step-6.png). Recorder reported a console 401 response.

## TC-012 — Handle special characters in customer fields
**Status:** FAIL  
**Severity:** major  
**Actual outcome:** The first-name special characters remained, but the last-name value was not retained. The postal field was exercised and no email field is exposed; the observed validation reported Last Name missing, so malformed-postal validation was not isolated.  
**Evidence:** [special-character fields](../evidence/screenshots/tc-012-step-5.png), [postal attempts and validation](../evidence/screenshots/tc-012-step-6.png). Recorder reported a console 401 response.

## TC-013 — Refresh during checkout
**Status:** SUSPICIOUS  
**Severity:** info  
**Actual outcome:** The customer form did not reach the summary because the entered last name was not retained. Refresh therefore occurred on the information page, not the required summary; the page remained usable with the cart badge still showing 2. Summary-resume behavior was not tested.  
**Evidence:** [blocked summary transition](../evidence/screenshots/tc-013-step-6.png), [page after refresh](../evidence/screenshots/tc-013-step-7.png), [post-refresh state](../evidence/screenshots/tc-013-step-8.png). Recorder logged 401 and 404 resource responses.

## TC-016 — Check checkout controls are reachable
**Status:** FAIL  
**Severity:** major  
**Actual outcome:** Listing Add, cart Checkout, and the customer-information page were reached. Continue remained on the information page because Last Name was reported missing; the subsequent Finish lookup timed out because the summary was never reached.  
**Evidence:** [form validation](../evidence/screenshots/tc-016-step-5.png), [blocked Finish attempt](../evidence/screenshots/tc-016-step-6.png). Recorder reported a console 401 response.

## TC-017 — Use checkout at a reduced viewport height
**Status:** FAIL  
**Severity:** major  
**Actual outcome:** The 700px viewport was set and the cart, Checkout, and information form were usable; all customer fields were visible. Continue was blocked by “Last Name is required,” so summary and confirmation reachability were not tested.  
**Evidence:** [checkout form at reduced height](../evidence/screenshots/tc-017-step-6.png), [blocked Finish attempt](../evidence/screenshots/tc-017-step-7.png). Recorder reported a console 401 response.

## TC-018 — Investigate product-detail and cross-stage consistency
**Status:** FAIL  
**Severity:** major  
**Actual outcome:** The selector-based rerun confirmed that clicking Sauce Labs Backpack opens Sauce Labs Fleece Jacket ($49.99), while clicking Sauce Labs Bike Light opens Sauce Labs Bolt T-Shirt ($15.99); both detail descriptions and prices disagree with their listings. The detail-image selector returned an empty `src` for both products. Listing and cart prices match ($29.99 and $9.99), but both listings use the same image source (`/assets/sl-404-Cq1a9k9X.jpg`). Checkout again stopped on the information page with “Last Name is required,” so summary prices and totals were not reached. The earlier result that parsed the Bike Light detail name as “Sauce Labs Backpack” was stale generic-body-parser output that contradicted its screenshot; this rerun’s detail-specific selector returned “Sauce Labs Bolt T-Shirt,” and the earlier parsed name is not used as rerun evidence.
**Evidence:** [listing](../evidence/screenshots/tc-018-step-1.png), [Backpack detail observation](../evidence/screenshots/tc-018-step-3.png), [Bike Light detail observation](../evidence/screenshots/tc-018-step-5.png), [cart price comparisons](../evidence/screenshots/tc-018-step-11.png), [blocked summary transition](../evidence/screenshots/tc-018-step-12.png). Recorder reported a console 401 response.

## TC-019 — Check that a discount is applied once
**Status:** SUSPICIOUS  
**Severity:** info  
**Actual outcome:** The customer-information form did not advance to the order summary because Last Name was reported missing. A promotion inspection was recorded on the information page only; discount application and single-use behavior were not tested.  
**Evidence:** [blocked summary transition](../evidence/screenshots/tc-019-step-5.png), [information-page promotion inspection](../evidence/screenshots/tc-019-step-6.png). Recorder reported a console 401 response.

## TC-020 — Verify discount arithmetic independently
**Status:** SUSPICIOUS  
**Severity:** info  
**Actual outcome:** The customer-information form did not advance to the summary because Last Name was reported missing. Discount calculation and summary arithmetic were not reached or assessed.  
**Evidence:** [blocked summary transition](../evidence/screenshots/tc-020-step-5.png), [information-page promotion inspection](../evidence/screenshots/tc-020-step-6.png). Recorder reported a console 401 response.
