# SauceDemo QA case planning

An AI-assisted QA exercise for the checkout of <https://www.saucedemo.com/> (user `problem_user`, which is deliberately faulty). The scenario, from `01-task/task.md`: log in, add the Backpack and the Bike Light, open the cart, check out with valid details, and complete the order.

AI plans and reviews the tests, code decides pass or fail, and a person is pulled in only for the standards and for real failures. The project does not drive a browser yet: execution is manual today, and a Playwright observer script is the next step.

## What is in it

Folders are numbered in the order you meet them. Everything a person owns is in `02-rules/`; everything produced is in `03-results/`. `.github/agents/` holds the two Copilot agent files (**Test Case Generator**, **QA Judge**) and cannot be renamed or moved, because Copilot only looks there.

| Folder | What's in it |
|---|---|
| `01-task/` | The goal (prove AI helps QA with a human in the loop), the environment, the happy-flow scenario and how success is measured |
| `02-rules/` | The quality standards, the test types, the generator's rules and format (`test-case-rules.md`), the judge rubric, and `execution.md` (the agent observes, code decides) |
| `03-results/` | Generated files only (test cases, judge report), written by a run. Cleared on 2026-10-17 for a fresh start |
| `05-findings/` | The findings register: every finding and open decision, with evidence and the person's verdict |
| `04-scripts/` | Lint, judge (Ollama), observation checker and report scripts |

## Workflow: two human jobs, two automatic stages

Requirements: Node 18+. The Copilot steps need VS Code with GitHub Copilot (agent mode); the Ollama route below needs neither. No `npm install`.

| # | Stage | Who | How |
|---|---|---|---|
| 1 | **Standards** | **Human** | Write and maintain `02-rules/`. This is the one place a person defines what "correct" means |
| 2 | **Make the plan** | Automatic | Agent **Test Case Generator** writes `03-results/test-cases.md`, then `npm run plan:check` runs the lint and the judge (`03-results/judge-report.md`). A person looks only if the verdict is REVISE |
| 3 | **Run and check** | Person today, automatic later | Execute the cases and record facts as JSON. `npm run check:observations -- <folder>` applies the standards, three runs at a time. A person looks only at failures and `UNSTABLE` results |
| 4 | **Triage** | **Human** | Confirm each failure is a real bug, set severity and priority, file it. `npm run report` builds the evidence page if you want one |

**The human is pulled in by exceptions, not by every step.** If the judge says ACCEPT and every check is stable and passing, nothing needs a person. The two human jobs are the ones that need judgement: what "correct" means, and what a failure is worth.

**Honest status:** step 3 is still manual, because the observer script is not built (see the improvement ideas). Steps 1, 2 and 4 work as described.

## Run the judge locally with Ollama (no GitHub, no Copilot, no tokens)

Needs [Ollama](https://ollama.com/) and Node 18+. The judge reads text only, so no screenshots are involved.

    ollama pull qwen2.5:7b          # once; any model that follows JSON instructions works
    npm run lint:cases              # free structure checks
    npm run judge:ollama            # scores all cases, writes 03-results/judge-report.md
    npm run judge:ollama -- --runs 3 --model llama3.1:8b   # repeat to measure stability

The script asks the model about one case at a time (temperature 0, fixed seed), so small models cope. Each case gets six 0-2 scores, a traceability flag, a quote and one suggested fix. With `--runs 3` the report adds a **spread** column: if the judge scores the same case differently between runs, the case or the rubric is ambiguous. That is the stability loop for improving the standards and the judge.

## The agent observes, code decides

The AI never decides pass or fail. An agent (or a person) records what is on screen as JSON: badge count, prices, form values, totals. `04-scripts/check-observations.mjs` applies the quality standards to those facts and reports each check as `pass`, `FAIL (stable)` or `UNSTABLE` across repeated runs. Details, schema and status: [`02-rules/execution.md`](02-rules/execution.md).

    npm run observe -- --user problem_user --runs 3 && npm run check:observations -- evidence/observations/problem_user

## Commands

    npm run plan:check       # lint, then the Ollama judge; exits 1 on problems or REVISE
    npm run lint:cases       # structure checks only, exits 1 on problems
    npm run judge:ollama     # the judge only
    npm run check:observations -- <folder>   # standards vs recorded facts; exits 1 on failures
    npm run report           # needs evidence/

## What to improve next

**From the author (my ideas):**

1. **Customer reporting extension.** A browser extension that sends the URL, a screenshot, console logs and recent clicks with one button. An AI turns it into a ticket and links it to a test case, or proposes a new one.
   **Why:** customers find the bugs the tests miss, and today that knowledge is lost between support and QA.
2. **Improve the standards and the judge by repetition.** Re-run until the same results come back. Same issues every time means tight wording; different results mean ambiguity. Also: keep known-bad plans the judge must reject, pin the model and temperature, and save each run to show the trend.
   **Why:** a judge that is consistent can still be wrong, and without repetition nobody knows which parts of the standards are vague.
   **Next, from the first real run** (a local 7B model gave 11–12 out of 12 to every case, with generic suggestions):
   1. *Known-bad plan test.* Add a `--plan` option and a small plan with deliberate flaws (a case with no expected outcome, a duplicate). If the judge scores those 10 or more, it is not trustworthy yet.
   2. *Real stability check.* Use a different seed on each run, and a little temperature when `--runs` is above 1. Today the seed is fixed, so repeated runs are identical and the spread is always 0.
   3. *Relevant "Top fix".* Ask the model to name a fix for its lowest-scoring criterion, and to say "None" when every score is 2.
3. **Apply the standards to the code.** An AI reads the application's source and checks, from a QA point of view, whether each standard is implemented (does the form keep the last name, is the total the sum plus tax). The output is suspected defects with file and lines; the browser run confirms them. Needs the source, so it cannot be shown on SauceDemo.
   **Why:** finds bugs before the app runs and points the tests at risky places. (`check-observations.mjs` today checks recorded observations, not code.)
4. **Blind review at every human step.** A second AI, preferably a different model, produces the same artifact from the upstream inputs only. Code compares it with the human's version, and the human reviews only the differences. It applies to the standards, test types, test cases, judge rubric and triage; add rule IDs first, and repeat runs to keep only repeating differences.
   **Why:** humans miss what they cannot see in their own work. The biggest value is the standards, since everything is built on them.

**Added by Claude (suggestions):**

5. **Automate execution.** First a plain Playwright observer script (no AI): it runs TC-001 three times and writes the facts as JSON, so stage 3 needs no person. Later a browser-use agent with a local Ollama model in text-only mode, which only records observations while code decides pass or fail.
6. **Requirements and diffs to cases.** Feed a ticket, a pull request diff or an incident to the generator and get only the new or affected cases, ranked by risk.
7. **Traceability matrix.** Rule to case to result, plus a list of rules that no case covers. It needs a stable ID on every rule in `02-rules/` and those IDs in each case's "Based on" line, then a script joins rules, cases and check results. It catches gaps (rules with no case), orphans (cases citing a rule that does not exist) and rules whose cases are all blocked by the same earlier defect.
8. **Bug triage.** Group duplicate findings by root cause and draft severity and reproduction steps for a human to approve.
9. **Exploratory testing.** An agent that looks for suspicious behaviour outside the written cases, such as the wrong product opening from a click.
10. **Production feedback.** Turn each real incident into a permanent standard.
11. **Cost and metrics.** Track tokens per run, how many cases the judge sends back, and how many findings humans accept.

**Known gaps today:** the browser-use runner is not built; the Ollama judge ran once for real, and was lenient and repetitive (see idea 2); most cases need the checkout form, which `problem_user` breaks, so one defect can hide the rest.

## Probing stage

`04-scripts/probe-shop.mjs` runs the extra cases from `02-rules/test-types.md` (sorting, product images and descriptions, removing and emptying the cart, adding twice, required fields, script injection, 500+ characters, special characters, refresh mid-checkout, a 700px-high screen). Each probe starts in its own logged-in browser, so one defect cannot hide the others. It records facts only; `04-scripts/check-probes.mjs` decides and reports `pass`, `FAIL (stable)`, `UNSTABLE` or `n/a` (the shop has no such feature). A probe that errors is reported as a failure that says so, so a broken selector is not mistaken for a shop bug.

    npm run probe -- --user problem_user --runs 3 && npm run check:probes -- evidence/probes/problem_user

## The register check

`04-scripts/check-register.mjs` fails when a check reports `FAIL (stable)` or `UNSTABLE` and no file in `05-findings/` names it, or when a check is `n/a` and no decision file (`D-`) names it. A finding that now passes is listed for a person to review, without failing the run. A finding is matched by its check id written in backticks, as in the existing files.

    npm run check:register    # after check:observations and check:probes

## Playwright and CI

`04-scripts/observe-tc001.mjs` is a plain Playwright script (no AI) that records TC-001 as JSON, so the checker has real input. It is the reference an AI observer must later match. Playwright is a pinned dev dependency for it. The agent files still do not need it.

`.github/workflows/observe.yml` runs, on every pull request: 10 observed runs and 10 probe runs of `problem_user` against SauceDemo, then the checkers. There is no answer key: each run reports what it found, and what repeats across runs is the result. Nothing in it calls a paid API.
