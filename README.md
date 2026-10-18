# SheepSure: AI-assisted QA with a human in the loop

A working example, on <https://www.saucedemo.com/> (user `problem_user`, which is deliberately faulty), of how AI can make QA easier and how a person keeps the result trustworthy. The goal and how success is measured are in [`01-task/task.md`](01-task/task.md).

**The principle:** the AI observes and proposes, code decides pass or fail, and a person confirms what counts as a bug. Everything that is not deterministic is fenced in by rules, fixed menus and checks, and every stage is run ten times to see what repeats.

## The stages

| # | Stage | Who | What it does | Command |
|---|---|---|---|---|
| 1 | **Standards** | **Human** | Writes what "correct" means in `02-rules/`. The one place a person defines the truth | edit the files |
| 2 | **Observe the flow** | Script (no AI) | Runs the 7-step flow from the task and records facts as JSON; `check-observations.mjs` applies the standards | `npm run observe`, `npm run check:observations` |
| 3 | **Probe** | Script (no AI) | Runs the extra cases from `test-types.md` (sorting, images, cart, required fields, injection, refresh, small screen), each in its own browser | `npm run probe`, `npm run check:probes` |
| 4 | **Explore** | Local AI (Ollama) | Discovers what the fixed checks do not cover. A model picks actions from a fixed menu and reports observations with a quote; code rejects any quote that is not on the page | `npm run explore`, `npm run explore:report` |
| 5 | **Triage** | **Human** | Stages 2 to 4 feed one findings register. A person confirms or rejects each finding, rates its severity and decides which are relevant. The register check fails the run when a problem is not written up | `npm run check:register`, edit `05-findings/` |
| 6 | **Promote** | Human + AI | A confirmed explorer finding becomes a new probe, so a one-off discovery turns into a check that runs the same way every time | write the probe, add its check id to the finding |
| 7 | **Test cases** | AI, then a person | Written last, from the happy flow and the `confirmed` or `fixed` findings: a manual test-case document, and the checks themselves as regression tests | Test Case Generator agent, `npm run lint:cases` |

A person is pulled in by exceptions: a finding to confirm, an unstable result, an open decision. Nothing is called a bug until a person has confirmed it. When a finding is marked `fixed`, its checks become a regression guard: if they fail again, CI goes red.

## What each stage proves, and what it does not

- **Stages 2 and 3** are deterministic code. Ten runs on GitHub's servers and three on a Mac gave the same verdicts for the same defects. They only look at what the checks cover, and the last-name bug (F-001) hides everything after the checkout form, so the totals, confirmation and cart-cleared checks pass without being exercised.
- **Stage 4** is the only stage that is not deterministic. A local 7B or 3B model on a CPU-only machine followed the guardrails but did not explore well: it looped, asked for elements that did not exist, and most of its claims were rejected for lacking a quote. How useful it is depends on the model and the hardware, and that is measured, not assumed.
- **Nothing is confirmed by a person yet.** The findings in `05-findings/` are marked `unconfirmed`.

## Quick start

Needs Node 18+. Stage 4 also needs [Ollama](https://ollama.com/).

    npm install
    npx playwright install chromium          # once
    npm run observe -- --user problem_user --runs 3
    npm run check:observations -- evidence/observations/problem_user
    npm run probe -- --user problem_user --runs 3
    npm run check:probes -- evidence/probes/problem_user
    npm run check:register

Results go to `evidence/` (not committed). Every check reports `pass`, `FAIL (stable)` (failed in every run), `UNSTABLE` (differs between runs, do not trust it) or `n/a` (the shop has no such feature).

### Stage 4: the explorer

`04-scripts/explore-ollama.mjs` lets a local model explore. Missions and checklists come from `06-charters/*.json`; each session has a step budget.

- The model sees the page as text (visible text, the elements it may use with their ids, image file names) plus the quality standards, and picks **one action from a fixed menu**: click, fill, select, back, done. Playwright performs it.
- It may report an observation with a category from a fixed list and a **quote copied from the page**. Code rejects the observation if the quote is not on the page. Dialogs and script errors are detected by code, not by the model.
- Code stops a session when the model repeats an action or asks for an element that is not there three times in a row.
- Each run uses a different seed. `explore:report` groups the observations by `charter:category:page`, not by wording, and reports how many runs each came back in: every run is a finding, some runs is intermittent, one run is a candidate. It also reports how many observations were rejected and how many replies were invalid, which says how much to trust the model.

```sh
ollama pull qwen2.5:7b                   # Ollama 0.5 or newer; any model that follows JSON instructions
npm run explore -- --runs 5 --model qwen2.5:7b
npm run explore:report -- evidence/explore/problem_user
```

Without GPU acceleration (`ollama ps` shows `100% CPU`) use a smaller model (`--model qwen2.5:3b`) or less context (`--ctx 2048 --standards-chars 2000`). It does not run in CI.

### The flock

`npm run report:flock` draws the results as a picture: one sheep per check in a pen per stage (the flow, the probes, the explorer). White sheep passed, black sheep failed, half-and-half wobbly ones gave different results between runs, sleeping ones belong to a feature the shop does not have. A tag shows the finding it belongs to and its status (`?` waiting, `✓` confirmed, `★` fixed, `×` rejected). The shepherd says how many findings are waiting for a person, the dog is the explorer, and pressing a sheep shows its evidence and the steps to reproduce. It writes `evidence/flock.html`, one self-contained page built from `evidence/` and `05-findings/`, and CI uploads it with the other evidence.

### The findings register

Every finding is written down once in `05-findings/`, with its evidence, a suggested severity (blocker, major, minor, info) and the person's decision. How often it was seen and how bad it is are recorded separately. The register check matches a finding to a check by the check id in backticks; an explorer group is matched by the line `Explorer key: <key>`. Rules and severity scale: [`05-findings/README.md`](05-findings/README.md).

## CI

`.github/workflows/observe.yml` runs on every pull request: 10 observed runs and 10 probe runs of `problem_user` against SauceDemo, the checkers, and the register check. The reports appear in the job summary. There is no answer key, and nothing in it calls a paid API.

## Folders

| Folder | What's in it |
|---|---|
| `01-task/` | The goal, the environment, the 7-step scenario and how success is measured |
| `02-rules/` | The quality standards and test types a person owns, plus the rules for the generator and `execution.md` (the agent observes, code decides) |
| `03-results/` | Generated test cases (empty until findings are confirmed) |
| `04-scripts/` | The observer, probes, explorer, checkers, the register check and the test-case lint |
| `05-findings/` | The findings register |
| `06-charters/` | The explorer's missions and checklists |
| `.github/` | The CI workflow and the two Copilot agent files (Copilot only looks there) |

## Test cases (the last stage)

The **Test Case Generator** agent (`.github/agents/test-case-generator.agent.md`, rules in `02-rules/test-case-rules.md`) writes the manual test plan to `03-results/test-cases.md`: the happy flow first, then one case per `confirmed` or `fixed` finding, using the finding's "Steps to reproduce". `npm run lint:cases` checks the structure. Test types that no finding covers get no case, because their probes pass and keep guarding them.

The checks in `04-scripts/` are the automated regression tests: a `fixed` finding must keep passing its checks (the register check enforces it), so there is no separate test code to write. The plan can take any other form later (for example Playwright specs) from the same list of confirmed findings.

## Ideas not built yet

1. **Customer reporting extension.** A browser extension that sends the URL, a screenshot, console logs and recent clicks with one button; AI turns it into a ticket and links it to a finding or proposes a new check. Customers find what tests miss, and that knowledge is lost today.
2. **Apply the standards to the code.** An AI reads the application's source and checks whether each standard is implemented. Needs the source, so it cannot be shown on SauceDemo.
3. **Blind review at every human step.** A second AI, preferably a different model, produces the same artifact from the upstream inputs; code compares it with the person's version and the person reviews only the differences. The biggest value is the standards.
4. **Requirements and diffs to checks.** Feed a ticket, a pull request diff or an incident and get only the new or affected checks, ranked by risk.
5. **Rule IDs and a traceability matrix.** A stable ID on every rule, joined to checks and findings, so rules with no check show up as gaps.
6. **Production feedback.** Turn each real incident into a permanent standard.
7. **Cost and metrics.** Tokens per run, how many findings people accept, how much human time each stage takes.
