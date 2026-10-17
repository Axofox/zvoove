# Findings register

Every finding the observer or the probes report is written down here, once, with the evidence. Nothing is deleted or ignored: a finding is either confirmed, rejected with a reason, or open.

## How often it was seen

| Seen | Class | What happens |
|---|---|---|
| In every run | **finding** | Recorded, awaiting a person's confirmation |
| In some runs | **intermittent** | Recorded with the count (for example 4/10). The checker's own rule is that an unstable result may come from the probe or the page, so a person decides which |
| Once | **candidate** | Recorded, then re-run before anyone calls it a bug |

Nothing is dropped. How often a finding is seen and how bad it is are separate things: a bug seen in 1 of 10 runs can still be a blocker.

## Severity

Taken from the reporting list in `02-rules/test-types.md` (blocker / major / minor / info), with these meanings:

| Severity | Meaning |
|---|---|
| **blocker** | A step of the task flow in `01-task/task.md` cannot be completed |
| **major** | The flow can be completed, but something a customer relies on is wrong or missing |
| **minor** | Wrong, but with an easy workaround, or only how it looks |
| **info** | An observation worth keeping, with no action needed |

The AI may *suggest* a severity and must give the reason in one line, quoting the meaning above. A person *decides*; the decided severity is the one that counts. Priority (what to fix first) is also the person's call and is not guessed here.

## Rules

1. **One file per root cause**, not per failing check. Several checks can fail because of one bug (`F-001` explains four).
2. **A person confirms.** The checks only say what was observed. Status stays `unconfirmed` until a person has looked at the shop and written their name and date in the file.
3. **Every file records both**: how often it was seen, and the suggested and decided severity.
4. **Decisions that are not bugs** (`D-` files) are kept too, so the same question is not asked twice.
5. A finding becomes a permanent check or standard in `02-rules/` once confirmed, and a rejected finding records why, so it can be re-opened if the shop changes.

## Index

| ID | What | Checks that report it | Seen | Severity (suggested) | Status |
|---|---|---|---|---|---|
| [F-001](F-001-last-name-dropped.md) | Last name is dropped, checkout cannot continue | form-retains-input, summary-reached, confirmation, required-fields-named | every run | blocker | unconfirmed |
| [F-002](F-002-sorting-does-nothing.md) | Sorting does not change the product list | sort-za, sort-price-low-high, sort-price-high-low | every run | major | unconfirmed |
| [F-003](F-003-same-image-everywhere.md) | Every product shows the same placeholder image | product-images-distinct | every run | major | unconfirmed |
| [D-001](D-001-add-same-item-twice.md) | Adding the same item twice: not offered by the shop | cart-add-twice (n/a) | every run | not rated | open decision |

## Untested because of F-001

The totals (`item-total`, `grand-total`), the confirmation page content and `cart-cleared` pass only because the summary is never reached on `problem_user`. They are **not verified**, and the register keeps that visible here until F-001 is fixed or the flow can be run another way.
