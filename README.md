# SauceDemo QA case planning and reports

## Workflow
1. **Test Case Generator** (`.github/agents/`) creates `qa/test-cases.md` from the task, quality standards, and test types in `qa/`.
2. This project no longer includes browser-test execution. Existing JSON results and screenshots in `evidence/` are historical evidence from the previous run.
3. **Report** (`scripts/build-report.mjs`) builds `reports/index.html` from the retained deterministic checks and screenshots.

## Run
    npm run report && open reports/index.html

## Human vs automated
Automated: test-case planning and report rendering from existing evidence. Human: execute proposed cases, review evidence, assess severity/priority, file bugs, and approve expectation changes.

## Next
Feed in tickets/incidents/diffs to generate and prioritise cases; connect an execution tool later if autonomous browser testing is needed; track findings across runs.
