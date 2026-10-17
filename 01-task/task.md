# Goal: prove that AI makes QA easier, with a human in the loop

1. Environment

Application: https://www.saucedemo.com/
Accounts (password for both: secret_sauce):
- problem_user: deliberately faulty
- standard_user: works, used as the clean baseline

No paid AI API is available. Everything must run on free tools: Playwright, GitHub Actions, local Ollama, or Copilot.

2. Scenario

A user should be able to:
1. Log into the application.
2. Add Sauce Labs Backpack and Sauce Labs Bike Light to the shopping
cart.
3. Open the shopping cart.
4. Start checkout.
5. Enter valid customer information.
6. Continue through checkout.
7. Complete the order successfully.

3. What we want to prove

AI can reduce manual QA work, and the result can be trusted, because the AI is stabilised by rules, quality standards and checks:
- Run the same test ten times and get the same result.
- Show where a human is still needed, and what exactly that person decides.
- Show how a human can verify what the AI delivers, so reliability can be built on it.

Rules for the design:
- The AI observes and proposes. Code decides pass or fail.
- Quality standards are written by a person and checkable (see 02-rules/).
- Nothing is called a bug until a person has confirmed it.
- There is no list of expected bugs in advance. The number of bugs is an output of the runs, not an input.

4. How we measure it

For every stage, run it ten times and report:
- Which findings appear in all ten runs, and which only in some. Compare by meaning, not by wording.
- What the human had to decide: confirm a finding, correct a rule, approve a plan.
- How many of the AI's findings the human rejected, and how many real problems it missed.
- Every miss and false positive becomes a change to a rule or a check, and the next run shows the effect.

The exploratory part is expected to vary. The goal there is a stable core of repeated findings plus a measured, explained tail, not identical output.

5. Looking further ahead

Show how the same approach could take in: product requirements, development changes, support tickets, customer-reported defects, existing automated tests and production incidents.

Each planning or reporting round should stay within about two hours of human time.
