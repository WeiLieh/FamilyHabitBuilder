# Learning Log (study notebook)

## Notebook

### [2026-11-12 22:34 SGT] A sign-up draft: holding answers until consent
- **Concept:** a **draft** (also called a staging area): a temporary place that holds what someone has typed until they confirm, before anything goes into the real records.
- **In plain English:** while a parent signs up, their name, children and picks wait in one draft row. Only when they tap "I agree" are they turned into the real records, all in one step. If they never agree, the draft is cut down after 7 days and deleted after 90.
- **Analogy:** a shop holds your order at the counter until you pay, instead of shipping it and asking for it back if you don't.
- **Why and when to use it:** when people give personal data in several steps before they consent, or when a half-finished process must not leave half-made records. Not needed when everything is saved in one step at the moment of consent.
- **Best practices:** keep the draft small (only the expected fields, a size cap); turn it into real records in one all-or-nothing step; set a clear time limit and a clean-up; tell people up front how long it's kept.
- **Where it showed up in this project:** migration 007 (12 Nov): `sign_up_drafts`, `finish_sign_up`, `clean_up_sign_ups`, `delete_sign_up_draft`; the 7-day line at `/start` (review finding P1).
- **Explain it to others:** "Answers during sign-up sit in a holding area. Nothing reaches the real tables until the parent agrees, and the holding area clears itself after a week."
- **Governance angle:** a PDPA reviewer will ask whether collecting before consent is allowed, how long it is kept, and whether "delete my data" reaches it (it does: `delete_sign_up_draft`).

### [2026-11-12 20:55 SGT] A partial failure: saved, but not shown
- **Concept:** a **partial failure**: one action that is really two jobs (save the answer, then update the screen), where the first succeeds and the second fails.
- **In plain English:** when you tap ✅ Done, the bot saves your answer in the database, then asks Telegram to remove the buttons and show the receipt. If Telegram hiccups after the save, the answer still counts. The bot must say what actually happened, so it never says "didn't save" after a save.
- **Analogy:** a courier leaves your parcel at the door, then their phone fails to send the "delivered" text. Telling you "we couldn't deliver" would make you order again and pay twice.
- **Why and when to use it:** whenever one tap triggers several steps, decide what the person is told if each step fails. Not needed when there is only one step.
- **Best practices:** do the important step (saving) first; report each step's failure honestly, never a blanket "it failed"; write the failure to the log (rule 1.3); test the in-between case on purpose.
- **Where it showed up in this project:** rule 5.10 (12 Nov): Done and Not today now take two Telegram steps (remove the buttons, send a new message). Two new tests check that a failure in the first step still sends the reply and never says "didn't save".
- **Explain it to others:** "A button tap does two things: save, then show. We test the case where saving worked but showing failed, so the app never tells a parent something untrue."

### [2026-11-11 21:59 SGT] A thin slice, with a webhook and a cron job
- **Concept:** a **thin slice** (the smallest piece of the real product that works end to end), reached by Telegram through a **webhook** (a web address Telegram calls whenever something happens) protected by a **shared secret**, and woken daily by a **cron job** (a scheduled alarm, here Vercel's).
- **In plain English:** instead of building each part fully, we built a tiny version of every part at once: sign-up, one nudge, one button, one receipt, on the real Telegram, Vercel and Supabase. Telegram sends each message to our address with a password only it knows; Vercel's alarm wakes the bot at 7 pm with its own password.
- **Analogy:** opening one route of a new train line, with real track, signals and stations, before building the whole network. And a doorbell that only rings if the visitor says the codeword.
- **Why and when to use it:** early, to find the problems that only appear when real systems meet (wrong settings, typos, slow starts). Not a replacement for the full design: the thin slice leaves out most features on purpose.
- **Best practices:** write the setup and checks (UAT) before setting up; keep secrets only in the hosting settings; check each step's result straight away (e.g. getWebhookInfo after setWebhook); when nothing happens, check whether the request arrived at all before suspecting the code.
- **Where it showed up in this project:** thin slice 1 (11 Nov): tests passed first time, but three setup slips (a migration not applied, a symbol in the secret, `/ape/` instead of `/api/`) were only found live, each traced in one or two rounds and turned into a checklist line.
- **Explain it to others:** "We got one complete path working on the real systems before building more. The automated tests proved the logic; the live run found the setup mistakes the tests can't see, and each one became a line on our checklist."
- **Governance angle:** a reviewer will ask who can call the bot's address (only Telegram, by secret), who can trigger the daily job (only Vercel, by secret), where the secrets live (Vercel, never in code or chat) and whether real users are involved (no: owner only until consent and deletion are built).

### [2026-11-09 21:57 SGT] Changing a live database safely: migration, transaction, check query, fingerprint
- **Concept:** a database **migration** (a numbered change script), run inside a **transaction** (all or nothing), confirmed with a **check query**, then sealed with a **fingerprint** (a short code computed from the file).
- **In plain English:** once a database is live, you never edit the old change scripts. You add a new one (004) that makes the change. It runs as one block, so if any step fails nothing changes. Afterwards a small read-only query proves the result, and the file's fingerprint is recorded so any later edit to it is caught.
- **Analogy:** a signed contract is changed by an addendum, not by crossing out lines. The addendum is signed in one sitting (all or nothing), a witness checks it, and a notary's seal shows if anyone tampers with it later.
- **Why and when to use it:** for every change to a live database's structure (tables, columns, permissions, functions). Not for everyday data, which the app adds itself, or for one-off content fixes (those are content scripts, rule B2).
- **Best practices:** write the database test first and watch it fail for the right reason; repeat the lock-down of permissions for anything new; test the check query on a local copy before the owner runs it; record the fingerprint only after the owner confirms.
- **Where it showed up in this project:** migration 004 (9 Nov) removed the Wrap Up's own on/off switch. Test T42 was written first; the owner ran it in Supabase, the check query matched every expected value, and fingerprint `a4f1cede096b` was recorded (rule B1).
- **Explain it to others:** "We never rewrite history in our database scripts. Each change is a new numbered script that either fully works or changes nothing, we prove the result with a check, and the drift test raises the alarm if anyone edits a script after it has run."
- **Governance angle:** a Change Advisory Board (CAB) will ask: is it reversible, was it tested, who ran it, how was success confirmed, and can it be tampered with afterwards? Here: tested locally first, all or nothing, owner-run, check query recorded, fingerprint in the spec.

### [2026-11-09 00:14 SGT] Metrics that don't double count (mutually exclusive definitions)
- **Concept:** mutually exclusive metric definitions: each event counts toward exactly one of two related metrics.
- **In plain English:** metric 7 asks "did parents do it without a reminder?" and metric 8 asks "did the reminder work?". Before, a log at 2 pm after a 7 am nudge counted as both, so the two numbers contradicted each other. Now one test decides: was that behaviour nudged earlier the same day? Yes, so it is the nudge's success (metric 8). No, so it is unprompted (metric 7).
- **Analogy:** a goal in football is credited to the scorer or to an own goal, never to both. A sale is credited to the ad or to word of mouth, not both.
- **Why and when to use it:** whenever two metrics are meant to explain the same outcome from opposite sides. When not: metrics that measure different things (for example stickiness and connection rating) can and should overlap.
- **Best practices:** define both metrics with the same rule, written once (rule 5.2); test the edge cases (midnight, a different behaviour, Not today); record the change in the spreadsheet's change notes, keep the old version deprecated, never deleted.
- **Where it showed up in this project:** rule 5.2 and metric 8, 9 Nov, after the persistent keyboard made "late answers" to a nudge common.
- **Explain it to others:** "We made sure each logged action counts once: either the reminder gets the credit, or the parent does. Otherwise our 'habit is forming' number and our 'reminders work' number could both look good for the same action."
- **Governance angle:** a reviewer will ask whether a metric definition changed during the trial, and which version a report used. Hence version 2 of the spreadsheet with dated change notes, and version 1 kept in the archive.

### [2026-11-01 16:07 SGT] Designing database tables: add-only diaries, Control and Test, settings versions
- **Concept:** Database **schema design** (deciding the tables, their columns and the rules the database itself enforces), with **add-only** (append-only) tables, **Control and Test** groups, and **settings versions**.
- **In plain English:** Each table holds one kind of thing, one row per item. Diaries such as logs and events are only ever added to, never changed, so history can be trusted. The everyday values (Control, Option A) are saved as numbered versions; an experiment gives some parents a Test option (B) on top, and every event is stamped with both, so results can be split later.
- **Analogy:** A bank statement: transactions are only ever added, a mistake is fixed with a new correcting line, and each line says which account rules applied at the time.
- **Why and when to use it:** When you will need to analyse or audit history later, or when several things can happen at once (Telegram resends, two scheduler runs). Not for things a person simply changes, like their own nudge times: those are edited, with an event recording the change.
- **Best practices:** Let the database enforce structure (links, no duplicates, required fields), keep tuneable numbers in code; give each table only the permissions it needs; make "delete my data" follow the parent automatically; write each multi-step action as one all-or-nothing step.
- **Where it showed up in this project:** The Datastore design (1 Nov): 14 tables now, rules 8.3 to 8.12, after three drafts and a schema review.
- **Explain it to others:** "Our database keeps diaries that are only ever added to, so we can trust the history. Every event is stamped with the settings version and the experiment group the parent was in, so we can compare Control and Test fairly. The database itself blocks duplicates and wrong links, and deleting a parent removes everything about them in one go."
- **Governance angle:** A reviewer would ask who can change or delete data (only three narrow edits and one deletion function, enforced by database permissions and tested), what personal data is held (no child names; an optional birth year), and whether deletion is complete (a test fails if any personal table isn't covered).

### [2026-10-31 19:06 SGT] A/B testing with versioned settings (the Experiments module)
- **Concept:** A/B testing (giving two groups different versions and comparing results), with **sticky assignment** (a parent's version never changes) and **versioned settings** (every change to the numbers is a new, dated version that is never edited)
- **In plain English:** To learn whether a change helps, some parents get version A and some get version B, chosen at random, and we compare how each group does. For the result to mean anything, each parent stays in their group, and every event records which settings and version were in force at the time.
- **Analogy:** A clinical trial: patients are randomly given the medicine or a placebo, they never switch halfway, and every visit is written down with which treatment they were on. Without that label on each visit, the results can't be read afterwards.
- **Why and when to use it:** When you want evidence, not opinion, about which version works, and you have enough people in each group. **Not** with tiny groups: with 12 parents, a split gives 6 per side, too few to tell a real difference from luck. That's why week one runs everyone on one version (`baseline`) but still records it.
- **Best practices:** record the version from day one (you can't add it to old data later); never change someone's group mid-test; never edit a past settings version, add a new one; set guardrails on what a test may change (here: never more than 3 nudges a day).
- **Where it showed up in this project:** the owner made Experiments the ninth module (rules 11.1 to 11.11): week one is `baseline` only, every event is stamped with its settings version and variant, and the owner-run start and stop comes before alpha (50 to about 1,000 parents).
- **Explain it to others:** "We built the app as a testing platform from day one. Every action a parent takes is labelled with the exact settings they had, so when we have enough users we can fairly compare two versions, and we'll never have to guess what someone experienced."
- **Governance angle:** a reviewer would ask whether parents know they may be part of tests (rule 11.9: a plain sentence in the invite before alpha), whether a test could ever push parents harder (rule 11.4: the cap can only go down), and who can start a test (rule 11.7: only the owner).

### [2026-10-31 10:19 SGT] Sub-agents (specialist reviewers with their own desk)
- **Concept:** Sub-agents: separate Claude helpers, each with its own instructions, a limited set of tools and its own context window (working memory).
- **In plain English:** Instead of the main Claude reading every file itself (and filling its memory), it hands a focused job to a specialist, for example "check privacy", which reads widely on its own and returns only a short report. Giving it read-only tools means it cannot change anything.
- **Analogy:** An auditor who goes through the filing cabinets in a separate room and comes back with a one-page memo, instead of piling every file on your desk.
- **Why and when to use it:** Repeated, wide reviews (before every pull request). Not for small, quick questions, where starting a specialist costs more than it saves.
- **Best practices:**
  - Give each agent the fewest tools it needs (least privilege).
  - Cap the report length so it stays useful.
  - Never let a reviewer claim results it did not see (our checker never claims tests passed).
- **Where it showed up in this project:** `.claude/agents/privacy-security-reviewer.md` and `.claude/agents/spec-compliance-checker.md`, run before each pull request (habit H3).
- **Explain it to others:** "Before every change goes in, two read-only reviewers check privacy and whether our rules are really tested, and each hands back a short memo; nobody can edit code during the review."
- **Governance angle:** A reviewer would ask what the agents can do: only read and search, so they cannot leak by changing code or running commands; their findings go to the owner, who decides.

### [2026-10-31 09:41 SGT] Drift test with a ratchet
- **Concept:** A drift test (an automatic check that documentation still matches the code), switched on step by step with a "ratchet".
- **In plain English:** Documents go out of date silently. The drift test reads the repo on every pull request and fails if, for example, the diagram names a module that doesn't exist, a link is broken, or code uses another module without an arrow in the diagram. The ratchet means each module's checks switch on only when that module has been moved into the new structure, and once on they never switch off.
- **Analogy:** A building inspector who checks every renovation against the floor plan; the ratchet is like certifying one floor at a time, and a certified floor stays under inspection.
- **Why and when to use it:** When several documents describe the same system and people (or AIs) edit both. Overkill for a tiny project with one document.
- **Best practices:**
  - Prove each check works by breaking a small example on purpose.
  - Keep the facts the test reads in one place (the Module table).
  - Never weaken the test to make it pass (rule H5).
- **Where it showed up in this project:** Restructure PR 2: 22 tests (21 examples + 1 on the real repo); it found 25 drift problems, which were then fixed.
- **Explain it to others:** "Our docs can't quietly go stale: every pull request runs a test that compares the docs, the diagram and the code, and fails if they disagree."
- **Governance angle:** A reviewer can trust the architecture diagram, because the build fails if it stops matching the code.

### [2026-10-28 22:23 SGT] Passing "now" in (testing time-based rules)
- **Concept:** A pure function with the current time passed in as an input ("injecting the clock").
- **In plain English:** The nudge planner never looks at the real clock. Whoever calls it says "it is Friday 7:05pm"; the planner answers what to do. So a test can check Friday evening, a public holiday or a Sunday at any time of day, instantly and exactly.
- **Analogy:** A flight simulator: the pilot can practise a storm at night without waiting for one.
- **Why and when to use it:** Any rule that depends on dates and times (schedules, streaks, deadlines). Not needed for code that doesn't care about time.
- **Best practices:**
  - Keep the decision (pure, testable) separate from the action (sending a message).
  - Convert to the local time zone once, at the edge (we use Singapore time everywhere).
  - Test the boundaries: the first and last minute of a slot, midnight, Sunday to Monday.
- **Where it showed up in this project:** `planNudge` in `shared/nudge-engine/planner.ts`, with 25+ tests covering slots, holidays, the daily cap, Not today, priority and the Friday/Sunday rule.
- **Explain it to others:** "The nudge brain is a pure decision function: give it a parent's situation and a time, it says whether to nudge and about what. That let us test every scenario, including holidays and weekends, without waiting for real days."

### [2026-10-25 07:51 SGT] Database trigger (an automatic guard)
- **Concept:** A trigger: a small program the database runs automatically when rows change.
- **In plain English:** Some rules can't be written as a simple column check, because they depend on other rows (here: "a nudge must keep at least 3 active examples"). A trigger runs after each change, counts what is left, and refuses the whole change with a clear message if the rule would be broken.
- **Analogy:** A library that won't let you return the last copy of a book to the stockroom: the desk checks the shelf count before accepting.
- **Why and when to use it:** For rules across rows that must hold no matter who edits (dashboard, CSV import, code). Avoid for heavy logic or anything that calls other services; keep triggers small and well tested.
- **Best practices:**
  - Give a message that says what to do next ("Add another example first").
  - Test both the refused and the allowed cases.
  - Keep the number in one place per side, with comments pointing to each other.
- **Where it showed up in this project:** `examples_keep_minimum` in `001_create_nudge_repository.sql`; tests in `supabase/tests/nudge-repository.test.sql`. We broke it on purpose (minimum 2) to confirm the tests catch it.
- **Explain it to others:** "The database itself refuses any edit that would leave a nudge with fewer than 3 examples, and tells the editor how to fix it, so the content can't quietly degrade."

### [2026-10-25 07:42 SGT] Two tables linked by a short code (nudges and examples)
- **Concept:** Splitting data into two linked tables (a "one-to-many" relationship), linked by a reference that the database checks (a "foreign key").
- **In plain English:** Each nudge's settings are written once in the `nudges` table. Each example is a row in the `examples` table that names its nudge by a short code such as TWC. One nudge can have any number of examples, and the database refuses an example whose code doesn't exist.
- **Analogy:** A contacts list (each person's details once) and a message log (each message just names who it's for). You never re-type someone's address on every message.
- **Why and when to use it:** When one thing has many of another (one nudge, many examples), and the "one" side has details that must not disagree. Not needed when every item has exactly the same small, fixed number of parts that never grows.
- **Best practices:**
  - Give every row a plain number ID that never changes; keep meaning (like TWC) in a separate column.
  - Let the database check the link, so typos are refused.
  - Write each fact once.
- **Where it showed up in this project:** The owner noticed 5 fixed example columns limited variety; we compared one table, smart IDs like `1_TWC`, and two linked tables, and chose two tables with short codes (spec v1.6).
- **Explain it to others:** "Nudge settings live once in a small table; examples live in their own table, each tagged with its nudge's code, so we can add unlimited examples without ever copying or contradicting the settings."

### [2026-10-25 07:17 SGT] Defence in depth (two locks on the same door)
- **Concept:** Defence in depth: the same rule checked in more than one place.
- **In plain English:** The nudge rules (no blank names, valid categories, photo idea when photos are allowed...) are checked twice: by the database when the owner saves a row, and by the app when it reads rows. If one check is missed or bypassed, the other still catches the problem.
- **Analogy:** A building with a locked front door and a locked flat door: a mistake at one door doesn't leave your home open.
- **Why and when to use it:** For data that people edit by hand and that reaches real users. Not worth it for data only our own code creates.
- **Best practices:**
  - Keep the two sets of rules the same, and test that they agree (we test the first-load CSV against both).
  - Lock everything by default (Row Level Security on, no public access), then open only what is needed (our server may read).
  - Never rely only on the screen the editor uses.
- **Where it showed up in this project:** `supabase/migrations/001_create_nudges.sql` (database rules) plus `shared/nudge-repository.ts` (app rules), each with its own tests.
- **Explain it to others:** "Content is edited live, so we enforce the rules twice: the database refuses bad rows on save, and the app refuses bad rows on read. Both are tested."
- **Governance angle:** A security reviewer will ask who can read or change the nudges table. Answer: only our server can read it (secret key in Vercel), public roles have no access, and only the owner edits it, through the dashboard.

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
- [2026-11-12 20:55 SGT] CONFIRMED: owner understands tests 3 and 4; moved to the Notebook ("A partial failure: saved, but not shown").
- [2026-11-12 20:51 SGT] **Tests 3 and 4 for rule 5.10 (a Telegram hiccup after saving):** when you tap a button, the bot does two separate jobs: it saves your answer in the database, then tells Telegram what to show. If the second job fails, the first has still happened, so the bot must not say "didn't save". Explained again with the parcel-delivery analogy. Waiting for the owner to confirm it is clear.
- [2026-10-25 07:34 SGT] **Two tables linked by name (nudges and examples):** proposed design where `nudges` holds each nudge's settings once (with an ID number used by parents' choices) and `examples` holds one row per example, naming its nudge. Explained with a mock-up and the contacts-list / message-log analogy. Waiting for the owner to confirm it is clear. CONFIRMED [2026-10-25 07:42 SGT]: moved to the Notebook.
- [2026-10-24 17:39 SGT] Nothing yet. SUPERSEDED [2026-10-25 07:34 SGT]
