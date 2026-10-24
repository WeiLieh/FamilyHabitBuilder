# Learning Log (study notebook)

## Notebook

### [2026-10-25 06:25 SGT] Checking data at the door (validation with zod)
- **Concept:** Input validation with a schema (using the `zod` library).
- **In plain English:** Any data coming from outside the code (a database the owner edits by hand, a Telegram message, Claude's reply) is checked against a description of what "good" looks like before the app uses it. Bad data is refused with clear reasons instead of quietly causing strange behaviour later.
- **Analogy:** A receiving clerk who checks each delivery against the order form before it goes on the shelf, and sends back anything wrong with a note saying why.
- **Why and when to use it:** Wherever data crosses into the app from something we don't control. Not needed for values the code creates itself.
- **Best practices:**
  - Check at the door, once; inside, trust the checked data.
  - Report every problem at once, in words a person can act on.
  - Never patch bad data with guesses (our rule 9).
- **Where it showed up in this project:** `shared/nudge-repository.ts` checks every row of the owner-edited `nudges` table; a broken row is left out and reported while the other nudges keep working.
- **Explain it to others:** "Because content is edited live in the database, the app checks every row before using it. A bad row is set aside and flagged, and the rest of the app carries on."
- **Governance angle:** A reviewer would ask what happens when someone enters bad content. Answer: it is refused and reported, never shown to parents.

### [2026-10-24 21:35 SGT] Walking skeleton
- **Concept:** Walking skeleton.
- **In plain English:** The thinnest version of the whole product that works from end to end, deployed for real, before any part is made rich. Every later feature plugs into something that already runs.
- **Analogy:** Before decorating a house, you first make sure the plumbing runs from the street to one tap. Then you add rooms.
- **Why and when to use it:** When a product joins several services (here Telegram, Vercel, Supabase, a scheduler), so connection problems show up early and cheaply. Less useful for a single, self-contained component.
- **Best practices:**
  - Keep the first version embarrassingly small.
  - Deploy it for real, not just on a laptop.
  - Build the core logic first, then connect it end to end soon after.
- **Where it showed up in this project:** The Telegram bot moved from last to step 3 in the development order, so the owner can try the app on a phone early.
- **Explain it to others:** "We build the brain first, then quickly wire up a bare-bones version that runs end to end on a phone, so integration surprises appear in week two, not at launch."

### [2026-10-24 21:19 SGT] Red, then green (test first)
- **Concept:** The red-green cycle of Test-Driven Development (TDD).
- **In plain English:** We write a test that describes what the code should do, run it and watch it fail (red), because the code doesn't exist yet. Then we write the code and run it again until it passes (green). The failing run proves the test really checks something.
- **Analogy:** Testing a smoke alarm by holding a match under it. If it doesn't beep before you fix the wiring, you know the test works.
- **Why and when to use it:** For any rule that matters (XP, streaks, nudge caps). Not worth it for throwaway experiments you will delete tomorrow.
- **Best practices:**
  - Always see the test fail once before writing the code.
  - Test what the user sees (the reply), not how the code is wired inside.
  - Never loosen a test just to make it pass.
- **Where it showed up in this project:** The `/api/health` test was written first, failed, and passed after `api/health.ts` was written.
- [2026-10-25 06:17 SGT] **The third step, refactor:** the full cycle is red, green, **refactor**. Once tests pass, the code can be tidied or improved (renamed, simplified, commented) and the tests re-run to prove the behaviour did not change. Adding learner comments to `api/health.ts` was a small refactor: same behaviour, tests still green.
- [2026-10-25 06:17 SGT] **Reading a test file:** `describe` groups related tests; `it` is one test ("it should..."); `expect(...)` is a check that fails the test if false; `beforeAll`/`afterAll` set up and clean up. The owner used GitHub Copilot to map the explanation to each line of `tests/api-health.test.ts` (line numbers have since shifted because comments were added).
- **Explain it to others:** "We write the acceptance check before the feature. It fails first, which proves the check is real, then we build until it passes. So every rule in the app has proof it works."

### [2026-10-24 21:19 SGT] Continuous Integration (CI) with GitHub Actions
- **Concept:** CI (Continuous Integration), run by GitHub Actions.
- **In plain English:** Every time someone proposes a change (a pull request), GitHub automatically sets up a clean computer, installs the project and runs `npm run check`. The pull request shows a green tick or a red cross.
- **Analogy:** A second inspector at the factory gate who checks every delivery, even if the first inspector already said it was fine.
- **Why and when to use it:** Any project with pull requests; it catches "works on my machine" problems. Overkill for a single throwaway script.
- **Best practices:**
  - Run the same check command locally and in CI, so results match.
  - Only merge with a green tick.
  - Give CI only read access to the code.
- **Where it showed up in this project:** `.github/workflows/check.yml` runs on Node.js 24 for every pull request and every push to `main`.
- **Explain it to others:** "No change reaches main unless an automatic, independent run of all our tests passes on a clean machine."
- **Governance angle:** A Change Advisory Board (CAB) would ask: can a change be merged with failing checks? Answer: our rule is no; GitHub's branch protection can enforce it.

### [2026-10-24 17:39 SGT] Project memory files
- **Concept:** Project memory files (the `docs/` folder plus `CLAUDE.md`).
- **In plain English:** Claude forgets everything between sessions. These files are where we write down what we are building, what we decided and where we stopped, so every new session starts from the same page.
- **Analogy:** A shift handover logbook in a hospital ward: the night nurse doesn't remember the day, but reads the log.
- **Why and when to use it:** Any project longer than one sitting, or with more than one person (or AI) working on it. Not worth it for a one-off five-minute task.
- **Best practices:**
  - Keep each file to one job (spec, decisions, progress...).
  - Date every entry; never silently rewrite history.
  - Keep them short so they are actually read.
- **Where it showed up in this project:** Session 1 created them before any code, so decisions are captured from day one.
- **Explain it to others:** "Our AI developer has no memory between sessions, so we keep a small set of shared documents: the spec, the decisions, and a handover note. Every session starts by reading them, which keeps work consistent and auditable."
- **Governance angle:** A reviewer can trace every decision to a dated entry, which helps with audits and change approvals.

## Still unclear
- [2026-10-24 17:39 SGT] Nothing yet.
