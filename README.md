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
| `06-execution/manual-test-plan-2026-10-15.md`, `07-history/` | A manual session plan and archived runs |
| `.github/agents/` | Copilot agents: **QA Orchestrator**, **Test Case Generator**, **QA Judge** |
| `08-scripts/lint-cases.mjs` | Free, deterministic structure checks on the plan |
| `08-scripts/build-report.mjs` | Builds `reports/index.html` from saved results and screenshots |

## Workflow

1. **Generate:** the Orchestrator calls the Test Case Generator, which reads `01-task/task.md`, the standards and the test types and writes `04-test-cases/test-cases.md`.
2. **Lint:** `npm run lint:cases` checks structure (fields, numbering, links, categories, no results in a plan). No AI, no cost.
3. **Judge:** the QA Judge agent runs the lint, then scores each case against `05-judge/judge-rubric.md` and writes `05-judge/judge-report.md` with a verdict (ACCEPT / REVISE / REJECT). It never edits the plan, so the author of a case is never its reviewer.
4. **Execute (human):** run the cases in a browser, record results and screenshots in `evidence/`.
5. **Report:** `npm run report` builds `reports/index.html`.

## How to run it

Requirements: Node 18+ and VS Code with GitHub Copilot (agent mode). No `npm install` is needed; there are no dependencies.

1. **Generate the plan.** In Copilot Chat choose the **QA Orchestrator** agent and say "generate the test cases". It calls the Test Case Generator, which writes `04-test-cases/test-cases.md`.
2. **Check structure (free).** `npm run lint:cases`. Exit code 1 lists what is wrong, such as a missing field, a broken link or a result written into the plan.
3. **Judge the plan.** Choose the **QA Judge** agent and say "judge the plan". It runs the lint, scores the cases against `05-judge/judge-rubric.md` and writes `05-judge/judge-report.md` with a verdict. If the verdict is REVISE, fix `02-standards/quality-standards.md`, `02-standards/test-types.md` or the generator prompt (not the plan by hand) and go back to step 1.
4. **Execute by hand.** Run the cases on <https://www.saucedemo.com/> (`problem_user` / `secret_sauce`). Put results in `evidence/` as `TC-nnn.json` plus screenshots in `evidence/screenshots/`.
5. **Report.** `npm run report`, then open `reports/index.html`.

`evidence/` and `reports/` are gitignored, so they exist only on the machine that produced them. Past results are kept in `07-history/`.

## Run the judge locally with Ollama (no GitHub, no Copilot, no tokens)

Needs [Ollama](https://ollama.com/) and Node 18+. The judge reads text only, so no screenshots are involved.

    ollama pull qwen2.5:7b          # once; any model that follows JSON instructions works
    npm run lint:cases              # free structure checks
    npm run judge:ollama            # scores all cases, writes 05-judge/judge-report.md
    npm run judge:ollama -- --runs 3 --model llama3.1:8b   # repeat to measure stability

The script asks the model about one case at a time (temperature 0, fixed seed), so small models cope. Each case gets six 0-2 scores, a traceability flag, a quote and one suggested fix. With `--runs 3` the report adds a **spread** column: if the judge scores the same case differently between runs, the case or the rubric is ambiguous. That is the stability loop for improving the standards and the judge.

## Commands

    npm run lint:cases   # structure checks, exits 1 on problems
    npm run report       # needs evidence/

## Human vs AI

AI: draft cases, review them against a rubric. Human: execute, judge severity, file bugs, approve changes to expectations.

## Why Playwright isn't in `package.json`

The earlier run used Playwright, but it was removed; `evidence/` and `reports/` are gitignored, so only results on the author's machine remain. A Copilot agent runs in its own cloud environment (or through a browser tool it brings itself), so it can execute tests without the project depending on Playwright.
