# Findings register

Every finding the observer or the probes report is written down here, once, with the evidence. Nothing is deleted or ignored: a finding is either confirmed, rejected with a reason, or open.

## Rules

1. **One file per root cause**, not per failing check. Several checks can fail because of one bug (`F-001` explains four).
2. **A person confirms.** The checks only say what was observed. Status stays `unconfirmed` until a person has looked at the shop and written their name and date in the file.
3. **Seen in every run** is a finding. **Seen in some runs** is recorded as `intermittent` with the count (for example 4/10) and a person decides whether the shop or the probe is unstable. **Seen once** is a `candidate` and is re-run before anyone calls it a bug.
4. **Severity and priority are the person's call.** The suggestion in each file is a starting point only.
5. **Decisions that are not bugs** (`D-` files) are kept too, so the same question is not asked twice.
6. A finding becomes a permanent check or standard in `02-rules/` once confirmed, and a rejected finding records why, so it can be re-opened if the shop changes.

## Index

| ID | What | Checks that report it | Status |
|---|---|---|---|
| [F-001](F-001-last-name-dropped.md) | Last name is dropped, checkout cannot continue | form-retains-input, summary-reached, confirmation, required-fields-named | unconfirmed |
| [F-002](F-002-sorting-does-nothing.md) | Sorting does not change the product list | sort-za, sort-price-low-high, sort-price-high-low | unconfirmed |
| [F-003](F-003-same-image-everywhere.md) | Every product shows the same placeholder image | product-images-distinct | unconfirmed |
| [D-001](D-001-add-same-item-twice.md) | Adding the same item twice: not offered by the shop | cart-add-twice (n/a) | open decision |

## Untested because of F-001

The totals (`item-total`, `grand-total`), the confirmation page content and `cart-cleared` pass only because the summary is never reached on `problem_user`. They are **not verified**, and the register keeps that visible here until F-001 is fixed or the flow can be run another way.
