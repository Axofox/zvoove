# Example observations (synthetic)

**What these are:** three hand-written JSON files, `example-TC-001-run1.json` to `run3.json`. Each is what an agent (or a person) would record while running TC-001 on `problem_user`: the cart, the prices, the form values and whether a summary and confirmation appeared. They are not real agent output; each file says `"synthetic": true`.

**Why they exist:**
1. **They show the format.** This is the JSON an agent must write. The agent only records facts and never says pass or fail.
2. **They let the checker run without a browser.** `npm run check:observations -- 06-execution/examples` applies the standards to these files and prints the report. That makes the "agent observes, code decides" idea demonstrable today, with no Ollama, no Copilot and no network.
3. **They show the stability check.** Three runs with identical results give `FAIL (stable)`. Change one file by hand to see `UNSTABLE`.

**What they contain:** they reproduce the failure found in the earlier manual run, where the last name is lost, so checkout never reaches the summary or confirmation. Cart contents, badge and prices are correct, so those checks pass.

**When to delete them:** once real agent runs exist, save those in `evidence/observations/` (gitignored) and run the checker on that folder. Then remove this folder and update the example command in `README.md` and `06-execution/README.md`.
