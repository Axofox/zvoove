# SauceDemo QA case planning

An AI-assisted QA exercise for the checkout of <https://www.saucedemo.com/> (user `problem_user`, which is deliberately faulty). The scenario, from `01-task/task.md`: log in, add the Backpack and the Bike Light, open the cart, check out with valid details, and complete the order.

The project does not drive a browser. AI agents **plan and review** tests; people execute them and judge the findings.

## What is in it

Folders are numbered in the order the work happens. `.github/agents/` keeps its name because Copilot requires it; `evidence/` and `reports/` are created locally and gitignored.

| Path | Purpose |
|---|---|
| `01-task/task.md` | The assignment and the happy-flow scenario |
| `02-standards/quality-standards.md` | What "working correctly" means for product page, cart, form, summary and confirmation |
| `02-standards/test-types.md` | Extra categories: cart CRUD, negative, security, state, UI, data integrity |
| `03-generator/test-case-generator.md` | Instructions and format for the generator |
| `04-test-cases/test-cases.md` | The generated suite (20 cases, TC-001 to TC-020) |
| `05-judge/judge-rubric.md` | How the judge scores the plan |
| `06-execution/` | How execution works (agent observes, code decides), example observations |
| `07-history/` | Archived runs |
| `.github/agents/` | Copilot agents: **Test Case Generator**, **QA Judge** |
| `08-scripts/lint-cases.mjs` | Free, deterministic structure checks on the plan |
| `08-scripts/build-report.mjs` | Builds `reports/index.html` from saved results and screenshots |

## Workflow and where the human is in the loop

Requirements: Node 18+. The Copilot steps need VS Code with GitHub Copilot (agent mode); the Ollama route below needs neither. No `npm install`.

| # | Step | Who | How | Human checkpoint |
|---|---|---|---|---|
| 1 | **Generate** the plan | AI | Copilot Chat, agent **Test Case Generator**: "generate the test cases". Writes `04-test-cases/test-cases.md` | Human owns the inputs in `02-standards/`. The plan is never edited by hand |
| 2 | **Judge** the plan | Code, then AI | Agent **QA Judge**: "judge the plan" (or `npm run judge:ollama`). It runs `npm run lint:cases` first, then scores each case against `05-judge/judge-rubric.md` into `05-judge/judge-report.md` | **Gate 1:** a human reads the report and decides: accept, or change the standards and go back to step 1. The judge only advises |
| 3 | **Execute** the cases | Person today; an AI agent later | Run them on <https://www.saucedemo.com/> (`problem_user` / `secret_sauce`) and record facts as JSON | A person executes. With an agent, a human reviews what it recorded |
| 4 | **Check** the facts against the standards | Code | `npm run check:observations -- <folder>` | None. Code, not AI, decides pass or fail |
| 5 | **Triage** the failures | **Human** | Read the check report | **Gate 2:** confirm each finding is a real bug, set severity and priority, file it. `UNSTABLE` results are investigated, not reported |
| 6 | **Report** | Code | `npm run report`, open `reports/index.html` | A human reads it and signs off |

AI proposes and advises, code decides repeatable facts, humans own the standards, the severity and the sign-off.

`evidence/` and `reports/` are gitignored, so they exist only on the machine that produced them. Past results are in `07-history/`.

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

    npm run lint:cases   # structure checks, exits 1 on problems
    npm run report       # needs evidence/

## What to improve next

**From the author (my ideas):**

1. **Customer reporting extension.** A browser extension that captures the URL, a screenshot, console logs and recent clicks with one button, so customers report problems to support more easily. An AI turns it into a structured ticket and links it to the matching test case, or proposes a new case. Support tickets then feed the test suite.
2. **Improve the standards and the judge by repetition.** Re-run until the same results come back, not different ones. When the same issues are found every time, the standards and the rubric are tight. Where results differ, the wording is ambiguous. *Claude's additions:* apply it to both targets, the judge (`--runs 3` exists) and the test results (flag any check that changes between runs); keep a few known-bad plans (a case with no expected outcome, a duplicate) that the judge must always reject, because a judge can be consistent and still wrong; pin the model and temperature; and keep the results of each run to show the trend.
3. **Apply the standards to the code.** An AI reads the application's source code and checks, from a functional QA point of view and not a developer's, whether each standard is implemented (for example: does the form handler keep the last name, is the total the sum plus tax, is the cart cleared after the order). The output is a list of suspected defects with file and lines, which are suspicions, not verdicts: they point the tests at risky places, and the browser run confirms them. With access to the SauceDemo repository, the agent would read the code for the cart, form and totals and compare it with each standard; without the source it cannot be demonstrated. The related step that exists today, `08-scripts/check-observations.mjs`, applies the standards to recorded observations, not to code.

**Added by Claude (suggestions):**

4. **Browser-use agent.** Run the cases with browser-use and a local Ollama model, in text-only mode. The agent only records observations; code decides pass or fail. Start with the happy flow (TC-001) only.
5. **Requirements and diffs to cases.** Feed a ticket, a pull request diff or an incident to the generator and get only the new or affected cases, ranked by risk.
6. **Traceability matrix.** Rule to case to result, plus a list of rules that no case covers. It needs a stable ID on every rule in `02-standards/` and those IDs in each case's "Based on" line, then a script joins rules, cases and check results. It catches gaps (rules with no case), orphans (cases citing a rule that does not exist) and rules whose cases are all blocked by the same earlier defect.
7. **Bug triage.** Group duplicate findings by root cause and draft severity and reproduction steps for a human to approve.
8. **Exploratory testing.** An agent that looks for suspicious behaviour outside the written cases, such as the wrong product opening from a click.
9. **Production feedback.** Turn each real incident into a permanent standard.
10. **Cost and metrics.** Track tokens per run, how many cases the judge sends back, and how many findings humans accept.

**Known gaps today:** the browser-use runner is not built; the examples in `06-execution/examples/` are hand-written; the Ollama judge has only been tested against a mock server; about eight cases are blocked by the same `problem_user` defect and cannot isolate their own rule.

## Why Playwright isn't in `package.json`

The earlier run used Playwright, but it was removed; `evidence/` and `reports/` are gitignored, so only results on the author's machine remain. A Copilot agent runs in its own cloud environment (or through a browser tool it brings itself), so it can execute tests without the project depending on Playwright.
