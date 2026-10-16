# SauceDemo QA case planning

An AI-assisted QA exercise for the checkout of <https://www.saucedemo.com/> (user `problem_user`, which is deliberately faulty). The scenario, from `task.md`: log in, add the Backpack and the Bike Light, open the cart, check out with valid details, and complete the order.

The project does not drive a browser. AI agents **plan and review** tests; people execute them and judge the findings.

## What is in it

| Path | Purpose |
|---|---|
| `task.md` | The assignment and the happy-flow scenario |
| `qa/quality-standards.md` | What "working correctly" means for product page, cart, form, summary and confirmation |
| `qa/test-types.md` | Extra categories: cart CRUD, negative, security, state, UI, data integrity |
| `qa/test-case-generator.md` | Instructions and format for the generator |
| `qa/test-cases.md` | The generated suite (20 cases, TC-001 to TC-020) |
| `qa/judge-rubric.md` | How the judge scores the plan |
| `qa/manual-test-plan-2026-10-15.md`, `qa/history/` | A manual session plan and archived runs |
| `.github/agents/` | Copilot agents: **QA Orchestrator**, **Test Case Generator**, **QA Judge** |
| `scripts/lint-cases.mjs` | Free, deterministic structure checks on the plan |
| `scripts/build-report.mjs` | Builds `reports/index.html` from saved results and screenshots |

## Workflow

1. **Generate:** the Orchestrator calls the Test Case Generator, which reads `task.md`, the standards and the test types and writes `qa/test-cases.md`.
2. **Lint:** `npm run lint:cases` checks structure (fields, numbering, links, categories, no results in a plan). No AI, no cost.
3. **Judge:** the QA Judge agent runs the lint, then scores each case against `qa/judge-rubric.md` and writes `qa/judge-report.md` with a verdict (ACCEPT / REVISE / REJECT). It never edits the plan, so the author of a case is never its reviewer.
4. **Execute (human):** run the cases in a browser, record results and screenshots in `evidence/`.
5. **Report:** `npm run report` builds `reports/index.html`.

## How to run it

Requirements: Node 18+ and VS Code with GitHub Copilot (agent mode). No `npm install` is needed; there are no dependencies.

1. **Generate the plan.** In Copilot Chat choose the **QA Orchestrator** agent and say "generate the test cases". It calls the Test Case Generator, which writes `qa/test-cases.md`.
2. **Check structure (free).** `npm run lint:cases`. Exit code 1 lists what is wrong, such as a missing field, a broken link or a result written into the plan.
3. **Judge the plan.** Choose the **QA Judge** agent and say "judge the plan". It runs the lint, scores the cases against `qa/judge-rubric.md` and writes `qa/judge-report.md` with a verdict. If the verdict is REVISE, fix `qa/quality-standards.md`, `qa/test-types.md` or the generator prompt (not the plan by hand) and go back to step 1.
4. **Execute by hand.** Run the cases on <https://www.saucedemo.com/> (`problem_user` / `secret_sauce`). Put results in `evidence/` as `TC-nnn.json` plus screenshots in `evidence/screenshots/`.
5. **Report.** `npm run report`, then open `reports/index.html`.

`evidence/` and `reports/` are gitignored, so they exist only on the machine that produced them. Past results are kept in `qa/history/`.

## Commands

    npm run lint:cases   # structure checks, exits 1 on problems
    npm run report       # needs evidence/

## Human vs AI

AI: draft cases, review them against a rubric. Human: execute, judge severity, file bugs, approve changes to expectations.

## Why Playwright isn't in `package.json`

The earlier run used Playwright, but it was removed; `evidence/` and `reports/` are gitignored, so only results on the author's machine remain. A Copilot agent runs in its own cloud environment (or through a browser tool it brings itself), so it can execute tests without the project depending on Playwright.
