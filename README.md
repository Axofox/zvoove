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

## Commands

    npm run lint:cases   # structure checks, exits 1 on problems
    npm run report       # needs evidence/ (gitignored, kept locally)

No dependencies are installed; Node 18+ is enough.

## Human vs AI

AI: draft cases, review them against a rubric. Human: execute, judge severity, file bugs, approve changes to expectations.

## Why Playwright isn't in `package.json`

The earlier run used Playwright, but it was removed; `evidence/` and `reports/` are gitignored, so only results on the author's machine remain. A Copilot agent runs in its own cloud environment (or through a browser tool it brings itself), so it can execute tests without the project depending on Playwright.
