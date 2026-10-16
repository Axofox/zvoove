# SauceDemo QA case planning

An AI-assisted QA exercise for the checkout of <https://www.saucedemo.com/> (user `problem_user`, which is deliberately faulty). The scenario, from `01-task/task.md`: log in, add the Backpack and the Bike Light, open the cart, check out with valid details, and complete the order.

AI plans and reviews the tests, code decides pass or fail, and a person is pulled in only for the standards and for real failures. The project does not drive a browser yet: execution is manual today, and a Playwright observer script is the next step.

## What is in it

Folders are numbered in the order the work happens. `.github/agents/` (the Copilot agents **Test Case Generator** and **QA Judge**) keeps its name because Copilot requires it.

| Folder | What's in it |
|---|---|
| `01-task/` | The assignment and the happy-flow scenario |
| `02-standards/` | What "working correctly" means, and the extra test categories |
| `03-generator/` | Instructions and format for the test case generator |
| `04-test-cases/` | The generated suite (20 cases, TC-001 to TC-020) |
| `05-judge/` | The scoring rubric, and a mock of the judge report in `examples/` (invented scores, real format) |
| `06-execution/` | How execution works (agent observes, code decides) and example observations |
| `07-history/` | Archived runs |
| `08-scripts/` | Lint, judge (Ollama), observation checker and report scripts |

## Workflow: two human jobs, two automatic stages

Requirements: Node 18+. The Copilot steps need VS Code with GitHub Copilot (agent mode); the Ollama route below needs neither. No `npm install`.

| # | Stage | Who | How |
|---|---|---|---|
| 1 | **Standards** | **Human** | Write and maintain `02-standards/`. This is the one place a person defines what "correct" means |
| 2 | **Make the plan** | Automatic | Agent **Test Case Generator** writes `04-test-cases/test-cases.md`, then `npm run plan:check` runs the lint and the judge (`05-judge/judge-report.md`). A person looks only if the verdict is REVISE |
| 3 | **Run and check** | Person today, automatic later | Execute the cases and record facts as JSON. `npm run check:observations -- <folder>` applies the standards, three runs at a time. A person looks only at failures and `UNSTABLE` results |
| 4 | **Triage** | **Human** | Confirm each failure is a real bug, set severity and priority, file it. `npm run report` builds the evidence page if you want one |

**The human is pulled in by exceptions, not by every step.** If the judge says ACCEPT and every check is stable and passing, nothing needs a person. The two human jobs are the ones that need judgement: what "correct" means, and what a failure is worth.

**Honest status:** step 3 is still manual, because the observer script is not built (see the improvement ideas). Steps 1, 2 and 4 work as described.

## Run the judge locally with Ollama (no GitHub, no Copilot, no tokens)

Needs [Ollama](https://ollama.com/) and Node 18+. The judge reads text only, so no screenshots are involved.

    ollama pull qwen2.5:7b          # once; any model that follows JSON instructions works
    npm run lint:cases              # free structure checks
    npm run judge:ollama            # scores all cases, writes 05-judge/judge-report.md
    npm run judge:ollama -- --runs 3 --model llama3.1:8b   # repeat to measure stability

The script asks the model about one case at a time (temperature 0, fixed seed), so small models cope. Each case gets six 0-2 scores, a traceability flag, a quote and one suggested fix. With `--runs 3` the report adds a **spread** column: if the judge scores the same case differently between runs, the case or the rubric is ambiguous. That is the stability loop for improving the standards and the judge.

## The agent observes, code decides

The AI never decides pass or fail. An agent (or a person) records what is on screen as JSON: badge count, prices, form values, totals. `08-scripts/check-observations.mjs` applies the quality standards to those facts and reports each check as `pass`, `FAIL (stable)` or `UNSTABLE` across repeated runs. Details, schema and status: [`06-execution/README.md`](06-execution/README.md).

    npm run check:observations -- 06-execution/examples

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
3. **Apply the standards to the code.** An AI reads the application's source and checks, from a QA point of view, whether each standard is implemented (does the form keep the last name, is the total the sum plus tax). The output is suspected defects with file and lines; the browser run confirms them. Needs the source, so it cannot be shown on SauceDemo.
   **Why:** finds bugs before the app runs and points the tests at risky places. (`check-observations.mjs` today checks recorded observations, not code.)
4. **Blind review at every human step.** A second AI, preferably a different model, produces the same artifact from the upstream inputs only. Code compares it with the human's version, and the human reviews only the differences. It applies to the standards, test types, test cases, judge rubric and triage; add rule IDs first, and repeat runs to keep only repeating differences.
   **Why:** humans miss what they cannot see in their own work. The biggest value is the standards, since everything is built on them.

**Added by Claude (suggestions):**

5. **Automate execution.** First a plain Playwright observer script (no AI): it runs TC-001 three times and writes the facts as JSON, so stage 3 needs no person. Later a browser-use agent with a local Ollama model in text-only mode, which only records observations while code decides pass or fail.
6. **Requirements and diffs to cases.** Feed a ticket, a pull request diff or an incident to the generator and get only the new or affected cases, ranked by risk.
7. **Traceability matrix.** Rule to case to result, plus a list of rules that no case covers. It needs a stable ID on every rule in `02-standards/` and those IDs in each case's "Based on" line, then a script joins rules, cases and check results. It catches gaps (rules with no case), orphans (cases citing a rule that does not exist) and rules whose cases are all blocked by the same earlier defect.
8. **Bug triage.** Group duplicate findings by root cause and draft severity and reproduction steps for a human to approve.
9. **Exploratory testing.** An agent that looks for suspicious behaviour outside the written cases, such as the wrong product opening from a click.
10. **Production feedback.** Turn each real incident into a permanent standard.
11. **Cost and metrics.** Track tokens per run, how many cases the judge sends back, and how many findings humans accept.

**Known gaps today:** the browser-use runner is not built; the examples in `06-execution/examples/` are hand-written; the Ollama judge has only been tested against a mock server; about eight cases are blocked by the same `problem_user` defect and cannot isolate their own rule.

## Why Playwright isn't in `package.json`

The earlier run used Playwright, but it was removed; `evidence/` and `reports/` are gitignored, so only results on the author's machine remain. A Copilot agent runs in its own cloud environment (or through a browser tool it brings itself), so it can execute tests without the project depending on Playwright.
