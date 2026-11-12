# Known Issues

## Open

### [2026-11-12 20:59 SGT] Two taps at the same instant can both be saved
- **Issue:** [2026-11-12 20:59 SGT] The bot checks "already answered?" before saving, but two taps arriving at exactly the same moment can both pass the check. The database has no rule against a second log for the same nudge message (`habit_logs.from_message_id` is not unique), and a "not today" event is not linked to its nudge (privacy review of rule 5.10, findings P1 and P2; owner agreed to log it, 12 Nov).
- **Impact:** [2026-11-12 20:59 SGT] Low now (one tester). Two logs for one nudge, two "not today" events, or both for one nudge; streaks and metrics could count wrongly.
- **Workaround:** [2026-11-12 20:59 SGT] Fix in migration 007, test-first: one log per nudge message, and "not today" linked to its nudge and saved once. The bot's own check (rule 5.10, "Already answered.") already stops taps that arrive one after the other.
### [2026-11-11 18:14 SGT] The real database connection is checked only by the owner's UAT
- **Issue:** [2026-11-11 18:14 SGT] `src/datastore/supabase-store.ts` (thin slice 1) talks to the real Supabase project, so the app tests use a pretend store instead. The database functions it calls are tested (T1 to T56), but the connection code itself is not.
- **Impact:** [2026-11-11 18:14 SGT] A mistake in a column name or a query would show only when the owner runs the UAT (src/telegram-bot/UAT-thin-slice-1.md), not in `npm run check`.
- **Workaround:** [2026-11-11 18:14 SGT] Run the UAT after each change to `supabase-store.ts`. Later option: a test against a local Supabase (needs approval: new tooling).

### [2026-11-11 17:31 SGT] The app deletes a photo file before the database checks the request
- **Issue:** [2026-11-11 17:31 SGT] For "delete a photo" and Undo, the app removes the file from storage first (rule 8.5 order), then the database checks the parent and the Undo window (privacy review of migration 005, 11 Nov).
- **Impact:** [2026-11-11 17:31 SGT] None yet (no app code, no photos). If the app found the file without checking the parent, it could delete another parent's file; if an Undo is refused after the file is gone, the photo row points at a missing file.
- **Workaround:** [2026-11-11 17:31 SGT] When building the photo store: the app finds the file only through that parent's own photo row, checks the Undo window before touching the file, and records a failure if the file and the row disagree (rule 1.3). Test both.

### [2026-11-09 21:49 SGT] Removing the child's name before Claude can miss names
- **Issue:** [2026-11-09 21:49 SGT] Typed text goes to Claude with the child's name removed (rule 5.1, Q4). Removing only the stored name misses nicknames, typos, other spellings and a sibling's or friend's name (privacy review of the typed-text design, 9 Nov; owner agreed to log it, handoff of 9 Nov section 4a item 6).
- **Impact:** [2026-11-09 21:49 SGT] None yet (not built). A child's name could still reach Claude, against the owner's decision that it never does.
- **Workaround:** [2026-11-09 21:49 SGT] When building typed messages: the privacy reviewer checks the name removal, with tests for nicknames, different capitals and a second child; decide whether other first names are removed too. Send Claude only the text and the list of habits, nothing else about the family.

### [2026-11-09 21:49 SGT] Typed text and reflections may hold health or other sensitive details
- **Issue:** [2026-11-09 21:49 SGT] What parents type (a reflection, a "how you felt" line) may mention a child's health, school or family problems. It is sent to Claude for matching and stored as a reflection (privacy review of the typed-text design, 9 Nov; owner agreed to log it, handoff of 9 Nov section 4a item 6).
- **Impact:** [2026-11-09 21:49 SGT] None yet (not built). Sensitive personal data about a child, under Singapore's Personal Data Protection Act (PDPA).
- **Workaround:** [2026-11-09 21:49 SGT] Before building: decide how long reflection text is kept (Datastore proposal question), keep it out of Telemetry (no text in the views, rule 8.11), and take reflections that mention the child to the owner's PDPA reviewer.

### [2026-11-09 21:49 SGT] The 24-hour moment window can catch a stray message
- **Issue:** [2026-11-09 21:49 SGT] After "Add a moment", the bot waits 24 hours for a photo or line (B2 handoff, D-e). A later, unrelated message could be saved as a moment. This widens the 9 Nov finding "ignore this to skip has no time limit" (privacy review of the typed-text design, 9 Nov; owner agreed to log it, handoff of 9 Nov section 4a item 6).
- **Impact:** [2026-11-09 21:49 SGT] Low to medium: an unrelated, possibly private message would show in the album. Moments are not sent to Claude.
- **Workaround:** [2026-11-09 21:49 SGT] The agreed mitigations, each with a test at build time: other prompts win; keyboard labels, commands and button taps are never saved as moments; the window closes after one photo and one line, or at the next Wrap Up. Review the window length after the trial.

### [2026-11-09 21:49 SGT] No cap on Claude matching calls per parent
- **Issue:** [2026-11-09 21:49 SGT] Every typed message that is a log attempt calls Claude (B1 part 3 handoff, open question). There is no daily cap per parent.
- **Impact:** [2026-11-09 21:49 SGT] None yet (not built). Cost and abuse risk once live.
- **Workaround:** [2026-11-09 21:49 SGT] Design a cap with a starting number in `src/settings.ts` (rule 1.4) before building typed messages.

### [2026-11-09 17:50 SGT] "Ignore this to skip" has no time limit
- **Issue:** [2026-11-09 17:50 SGT] After a keyboard log the bot waits for a "how did it feel" line with no time limit, so a later, unrelated message could be saved as the log's description and sent to Claude (privacy review of the B1 daily loop design, 9 Nov; owner agreed to log it on 9 Nov).
- **Impact:** [2026-11-09 17:50 SGT] None yet (not built). Wrong or private text could be stored and sent to Claude.
- **Workaround:** [2026-11-09 17:50 SGT] Owner decided (9 Nov): the bot **stops waiting after a set time** (10 minutes suggested; the exact number is a Tuneable value decided in B1 design and kept in `src/settings.ts`), with a test.

### [2026-11-09 17:50 SGT] Telegram keeps the chat history outside Singapore
- **Issue:** [2026-11-09 17:50 SGT] Keyboard taps and messages leave behaviour names (and possibly children's names) in Telegram's own chat history, stored outside Singapore and beyond the reach of "delete my data" (privacy review of the B1 daily loop design, 9 Nov; owner agreed to log it on 9 Nov).
- **Impact:** [2026-11-09 17:50 SGT] Low. Parents may assume "delete my data" removes everything.
- **Workaround:** [2026-11-09 17:50 SGT] Owner decided (9 Nov): mention it in the PDPA (Personal Data Protection Act) note for parents and the owner's PDPA reviewer (the note is not written yet).

### [2026-11-08 22:34 SGT] Withdrawing photo consent has no flow yet
- [2026-11-09 17:44 SGT] Owner (9 Nov): agreed, design it with group C.
- **Issue:** [2026-11-08 22:34 SGT] Photo consent is now asked at the first photo (rule 5.5), so it can be withdrawn on its own, without leaving the app. There is no design for withdrawing it (stop asking for photos; keep or delete the photos already sent). Singapore's Personal Data Protection Act (PDPA) section 16 (withdrawing consent) applies (privacy review of the Telegram onboarding design, 3 Nov; owner agreed to log it on 8 Nov).
- **Impact:** [2026-11-08 22:34 SGT] None yet (no photos). Needed before real families send photos.
- **Workaround:** [2026-11-08 22:34 SGT] Design it with group C (Settings on the Web app, with the photo store); take PDPA section 16 to the owner's PDPA reviewer.

### [2026-11-08 22:34 SGT] A child's name reaches more places than the database
- [2026-11-09 17:44 SGT] Owner (9 Nov): keep children's names out of the Telemetry views, **with a test that checks it**. The child's name is **never sent to Claude**; it is only shown in Telegram messages, to make them feel personal (answers part of Q4).
- **Issue:** [2026-11-08 22:34 SGT] A child's name (rule 8.10) will also appear in the Telegram chat, in the Upstash chat memory and possibly in what is sent to Claude (Q4). Rule 8.11 (Telemetry views) names first names, Telegram IDs and descriptions, but not children's names (privacy review of the Telegram onboarding design, 3 Nov; owner agreed to log it on 8 Nov).
- **Impact:** [2026-11-08 22:34 SGT] None yet (no name column). If missed, children's names could reach Telemetry or third parties without a decision.
- **Workaround:** [2026-11-08 22:34 SGT] When building the name column: keep children's names out of the Telemetry views, with a test, and update rule 8.11. Decide in the Q4 design discussion whether the name is sent to Claude.

### [2026-11-08 22:34 SGT] A family could be recognised in a small group
- [2026-11-09 17:50 SGT] Owner (9 Nov): keep children's names **out of** Telemetry and exports. Keep storing the **birth year** (not the age); any report or export shows ages as **bands**, never years.
- **Issue:** [2026-11-08 22:34 SGT] A child's name together with the birth year, sign-up date and cohort makes a family easier to identify among about 12 to 50 parents (privacy review of the Telegram onboarding design, 3 Nov; owner agreed to log it on 8 Nov).
- **Impact:** [2026-11-08 22:34 SGT] Low for the database (locked). Higher if exports or Telemetry reports combine these fields.
- **Workaround:** [2026-11-08 22:34 SGT] Keep names out of Telemetry and exports; report ages as bands, not years, when sharing results.

### [2026-11-08 22:34 SGT] The 3 Nov design handoff file holds the owner's full name and a private link
- [2026-11-09 17:44 SGT] Owner (9 Nov): workaround agreed; the handoff is a working file, so leaving it as it is is fine.
- **Issue:** [2026-11-08 22:34 SGT] `docs/handoffs/2026-11-03-telegram-onboarding-handoff.md` contains the owner's full name and a link to the private preview artifact (privacy review of the Telegram onboarding design, 3 Nov; owner agreed to log it on 8 Nov).
- **Impact:** [2026-11-08 22:34 SGT] Low: the repository is private and these are the owner's own details; it would matter if the repository were ever made public.
- **Workaround:** [2026-11-08 22:34 SGT] Leave out full names and private links in future handoff files; review before any repository is made public.

### [2026-11-01 16:32 SGT] Telemetry's limited views are a convention until Telemetry has its own role
- **Issue:** [2026-11-01 16:32 SGT] Rule 8.11: the Telemetry views hide names, Telegram IDs, descriptions and photo links, but Telemetry currently reads through our server's role, which can also read the full tables (privacy review of the Datastore build; owner agreed to log it).
- **Impact:** [2026-11-01 16:32 SGT] Low now (nothing reads Telemetry yet). If Telemetry code queried the full tables, the database would not stop it.
- **Workaround:** [2026-11-01 16:32 SGT] When building Telemetry, give it its own database role that can read only the `telemetry_` views, with a test.

### [2026-11-01 16:32 SGT] "Delete my data" doesn't yet remove photos and chat memory
- **Issue:** [2026-11-01 16:32 SGT] Rule 8.5 order is photos, then chat memory, then rows, then the log. The database function only does the rows and the log; the photo store and chat memory are not built yet (both reviews).
- **Impact:** [2026-11-01 16:32 SGT] None yet (no photos or chat memory exist). If the rows were deleted first, photos would be left with no owner.
- **Workaround:** [2026-11-01 16:32 SGT] Build the photo and chat-memory steps with the Photo check and Telegram bot, before any real photos (already in the backlog: "delete my data" built once).

### [2026-11-01 16:32 SGT] Migration 001 repeats a number from settings.ts
- **Issue:** [2026-11-01 16:32 SGT] `001_create_nudge_repository.sql` repeats "at least 3 examples per nudge" (`MIN_EXAMPLES_PER_NUDGE`) and its comment points to the old path `shared/settings.ts` (spec review). Applied migrations can't be edited (rule B1).
- **Impact:** [2026-11-01 16:32 SGT] If the number changes in `src/settings.ts`, the database keeps the old one until a new migration changes it.
- **Workaround:** [2026-11-01 16:32 SGT] Change both together, as the comment in `src/settings.ts` already says; a future migration can move the check into code if wanted.

### [2026-11-01 09:56 SGT] The database doesn't block the same example twice for one nudge
- **Issue:** [2026-11-01 09:56 SGT] The examples table has no database rule against the same example text appearing twice for one nudge. Only the content scripts check for this before adding rows (low note from the PR A review, #12; owner agreed to log it).
- **Impact:** [2026-11-01 09:56 SGT] If the owner adds an example by hand in the Supabase dashboard that already exists, a parent could see the same idea twice before all examples are used (rule 3.13 rotation would treat them as two examples).
- **Workaround:** [2026-11-01 09:56 SGT] Check the list before adding by hand, or add examples through a content script. Option later: a database "unique" rule on nudge plus text (ask the owner first; it is a migration).

### [2026-10-31 18:04 SGT] A failed history read could look like "nothing happened"
- **Issue:** [2026-10-31 18:04 SGT] The Weekly Wrap Up decision (`src/nudge-engine/wrap-up.ts`) and the nudge planner trust the lists of logs and sent messages they are given. If reading them from the Datastore fails and the caller passes empty lists, a failure would look like "never sent" (the Wrap Up could go out twice) or "nothing logged" (silently skipped). Found by the privacy and security review of PR B; owner agreed to log it.
- **Impact:** [2026-10-31 18:04 SGT] None yet (nothing is sent). Once the scheduler is wired up, this would break rule 1.3 (no fallbacks).
- **Workaround:** [2026-10-31 18:04 SGT] When building the scheduler (Datastore and Telegram bot steps), a failed read must stop the decision for that parent and be reported as a failure, never replaced with an empty list. Add a test for it then.

### [2026-10-31 14:47 SGT] No real families may send photos until consent and "delete my data" are built
- **Issue:** [2026-10-31 14:47 SGT] Photo consent at sign-up and the "delete my data" function exist only as specs, not as code (found by the privacy and security review of PR #11; owner agreed to log it).
- **Impact:** [2026-10-31 14:47 SGT] Photos may show children. Collecting them without recorded consent or a working way to delete them would break the agreed privacy rules and the Singapore Personal Data Protection Act (PDPA) expectations.
- **Workaround:** [2026-10-31 14:47 SGT] Do not onboard real families or accept real photos until both are built and tested. Testing with the owner's own sample photos is fine.

### [2026-10-31 14:47 SGT] New Supabase tables start with broad default access
- [2026-10-31 15:07 SGT] Lower risk than first written: the project was created with "Automatically expose new tables" off and "Enable automatic RLS" on (`docs/CONTEXT.md`, 25 Oct), so new tables start locked from the Data API. Database-level grants can still be wider than needed, so the lock-down steps and permission tests remain the rule.
- [2026-11-01 16:14 SGT] Migration 003 (the 14 Datastore tables) repeats the lock-down for every new table and function, and its database tests check the permissions (T1 to T5). The issue stays open for future migrations.
- **Issue:** [2026-10-31 14:47 SGT] Supabase gives every new table wide default permissions. Migration 002 removed them for the nudge tables only. Each future migration must repeat the same "revoke, then grant only what is needed" steps (found by the privacy and security review of PR #11; owner agreed to log it).
- **Impact:** [2026-10-31 14:47 SGT] A table created without those steps (for example parents' data in the Datastore build) could be readable or writable by more roles than intended.
- **Workaround:** [2026-10-31 14:47 SGT] Every new migration copies the lock-down steps of migration 002, and its database tests check the permissions. Consider a drift or database test that fails if any table lacks them (ask the owner first).

### [2026-10-31 09:41 SGT] "One diagram" means one architecture diagram
- [2026-10-31 10:05 SGT] Path update: the rewards design (with its hook-loop flow) is now `src/variable-rewards/DESIGN.md`; the v0.1 original is in `docs/archive/`.
- **Issue:** [2026-10-31 09:41 SGT] The drift test counts as a diagram: any image file, or a Mermaid block that names 2 or more official modules, outside `docs/archive/`. The "hook loop" Mermaid flows in the two rewards specs name no modules, so they are allowed.
- **Impact:** [2026-10-31 09:41 SGT] If the owner meant "no other diagrams at all", the rewards specs' flow diagrams would need moving or removing.
- **Workaround:** [2026-10-31 09:41 SGT] Owner to confirm the reading at PR 2 review.

### [2026-10-28 22:23 SGT] Deliberate nudges can be crowded out on Friday and Sunday
- **Issue:** [2026-10-28 22:23 SGT] Deliberate behaviours are only nudged on Friday and Sunday, and come after due quick behaviours in priority. A parent with few slots on those days (e.g. 1) and a due quick behaviour may never get a deliberate nudge that week.
- **Impact:** [2026-10-28 22:23 SGT] Deliberate behaviours (the bigger family activities) could be under-nudged for some parents.
- **Workaround:** [2026-10-28 22:23 SGT] Parents can still log on their own. Owner chose Option B "to progress things first; we'll figure it along the way". Option to revisit: on Friday and Sunday, put a due deliberate behaviour first.

### [2026-10-28 22:23 SGT] Batch 2 parts that depend on later steps
- **Issue:** [2026-10-28 22:23 SGT] The planner is built and tested, but these are not built yet: the sender that re-checks just before sending (Datastore and Telegram bot steps), the ✅ Done and 😴 Not today buttons, the slot setup screen, and the holiday dates (owner uploads before launch).
- **Impact:** [2026-10-28 22:23 SGT] No nudge messages are sent yet.
- **Workaround:** [2026-10-28 22:23 SGT] Build with the Datastore (step 2) and Telegram bot (step 3).

### [2026-10-25 07:17 SGT] Database tests are not run automatically
- [2026-10-31 09:59 SGT] Path update: the database tests now live in `src/datastore/supabase/tests/` (still run by hand with `npm run test:db`).
- **Issue:** [2026-10-25 07:17 SGT] `npm run test:db` needs a running PostgreSQL, so it is not part of `npm run check` or GitHub Actions.
- **Impact:** [2026-10-25 07:17 SGT] A change to the SQL could break the rules without CI noticing.
- **Workaround:** [2026-10-25 07:17 SGT] Run `npm run test:db` manually after any SQL change. Later option: add a PostgreSQL service to the GitHub Actions workflow (ask the owner first).

### [2026-10-25 06:25 SGT] Broken nudge rows are reported, but no alert is sent yet
- [2026-10-25 07:48 SGT] Also covers nudges with fewer than 3 active examples (spec v1.6): the app reports them, but no alert is delivered yet.
- **Issue:** [2026-10-25 06:25 SGT] The Nudge repository returns a list of broken rows (spec v1.4 says alert the owner), but nothing delivers that alert yet.
- **Impact:** [2026-10-25 06:25 SGT] Until it is built, the owner would not hear about a broken row.
- **Workaround:** [2026-10-25 06:25 SGT] Build the alert with the Datastore and Telegram bot (step 2 or 3), for example a Telegram message or log line to the owner. Not live yet, so no real impact.

### [2026-10-24 22:14 SGT] Nudge repository edits skip review and history
- **Issue:** [2026-10-24 22:14 SGT] Edits in the Supabase dashboard go live to parents immediately, without a pull request, tests or Git history.
- **Impact:** [2026-10-24 22:14 SGT] A typo or a deleted row reaches parents straight away, and the old version cannot be recovered unless a backup was exported. A reviewer (for example a Change Advisory Board (CAB)) would ask who can change live content and how a bad change is undone.
- [2026-10-25 06:59 SGT] Update: IDs are now generated automatically (no duplicates), and retiring a nudge uses the "active" column. Blocking deletes of chosen nudges needs the parents' targets table, so it arrives with the Datastore (step 2); until then, a delete is not blocked.
- **Workaround:** [2026-10-24 22:14 SGT] Database rules block badly formed rows; the app refuses to use invalid rows; the owner exports a CSV backup before each big change. Only the owner has dashboard access.

### [2026-10-24 22:09 SGT] Photo check judging against the photo idea may be too strict
- **Issue:** [2026-10-24 22:09 SGT] The Photo check uses each nudge's photo idea to judge whether a photo fits. A parent may send a valid photo that looks nothing like the idea (for example, a cycling trip for "interesting activities" when the idea shows baking).
- **Impact:** [2026-10-24 22:09 SGT] Valid photos could be rejected, which feels unfair and discourages logging.
- **Workaround:** [2026-10-24 22:09 SGT] Owner agreed this rule "for now". When building the Photo check, propose treating the photo idea as a hint and judging against the nudge itself; if a check fails, the parent can still self-report (rule 9).

### [2026-10-24 21:19 SGT] Development container runs Node.js 22, not 24
- **Issue:** [2026-10-24 21:19 SGT] The project targets Node.js 24 (Vercel and GitHub Actions), but this cloud development container has Node.js 22. npm may print an "unsupported engine" warning here.
- **Impact:** [2026-10-24 21:19 SGT] Low. Checks pass on 22; GitHub Actions runs them again on 24 for every pull request.
- **Workaround:** [2026-10-24 21:19 SGT] Rely on the GitHub Actions run on Node.js 24 as the final word.

### [2026-10-24 21:19 SGT] Vercel project settings not yet confirmed
- **Issue:** [2026-10-24 21:19 SGT] The Vercel project has not been created yet. On the first deploy we must confirm the build settings (framework "Other", Node.js 24) and that `/api/health` answers.
- **Impact:** [2026-10-24 21:19 SGT] Nothing is live yet.
- **Workaround:** [2026-10-24 21:19 SGT] The owner creates the Vercel project when we are ready for the first preview; Claude guides the steps.

### [2026-10-24 18:26 SGT] Weekend nudge moments not defined
- [2026-10-28 21:21 SGT] Now part of the non-school-day schedule (Saturday, Sunday, public and MOE school holidays, spec v1.7). Still open: the default slots for non-school days.
- **Issue:** [2026-10-24 18:26 SGT] Weekday nudges follow everyday moments (to school, dinner, bedtime). Weekends need a separate set, not defined yet.
- **Impact:** [2026-10-24 18:26 SGT] The bot cannot send weekend nudges until these are defined.
- **Workaround:** [2026-10-24 18:26 SGT] None. Product manager to define the weekend moments.
- [2026-10-24 18:34 SGT] Kept as WIP, added to `docs/PRODUCT-BACKLOG.md`.

### [2026-10-24 18:26 SGT] Photos kept with no time limit
- [2026-11-01 16:32 SGT] Also: photos that fail the check are kept too (rule 6.2), and from alpha a child's birth year plus sign-up date and cohort could identify a family in a small group (privacy review, 1 Nov). Revisit both before alpha.
- **Issue:** [2026-10-24 18:26 SGT] Photos (which may show children) are kept until the parent deletes their data. The PDPA expects organisations to stop keeping personal data once it is no longer needed.
- **Impact:** [2026-10-24 18:26 SGT] Fine for a friends trial with consent; a reviewer would question it before opening to the public.
- **Workaround:** [2026-10-24 18:26 SGT] Consent at sign-up plus the "delete my data" function. Revisit before any public launch.
- [2026-10-24 18:34 SGT] Product manager confirmed: keep as an open issue.

## Resolved

### [2026-11-12 20:59 SGT] The agreement can wrongly say "didn't save"
- [2026-11-12 21:06 SGT] RESOLVED: once "I agree" is saved, a Telegram failure is logged and "You're all set" is still sent; never "didn't save" (test in tests/telegram-bot-sign-up.test.ts). Also fixed in the same change: the sign-up gap (silence when the "already signed up?" or "who is this?" check fails).
- **Issue:** [2026-11-12 20:59 SGT] If Telegram fails after the "I agree" tap is saved, the parent is told "Sorry, that didn't save" (`src/telegram-bot/handle-update.ts`, the agree path), which is untrue (rule 1.3) (privacy review of rule 5.10, finding P4; owner agreed to log it, 12 Nov).
- **Impact:** [2026-11-12 20:59 SGT] Low: the parent taps again; the agreement is recorded twice (the latest answer counts, rule 11.13).
- **Workaround:** [2026-11-12 20:59 SGT] Fix it in the sign-up gap pull request (next), test-first, the same way as rule 5.10.
### [2026-11-09 17:50 SGT] No spec requires checking Telegram's webhook secret
- [2026-11-11 18:14 SGT] **RESOLVED:** rule 5.9 written and built in thin slice 1; tests/telegram-bot-webhook.test.ts checks a missing or wrong secret is refused and nothing is saved or sent.
- **Issue:** [2026-11-09 17:50 SGT] No spec says the bot checks Telegram's secret header on each incoming request (privacy review of the B1 daily loop design, 9 Nov; owner agreed to log it on 9 Nov).
- **Impact:** [2026-11-09 17:50 SGT] None yet (the bot is not built). A forged request could create or undo logs for any parent.
- **Workaround:** [2026-11-09 17:50 SGT] Owner decided (9 Nov): a **must-have for the Telegram bot build**: requests without the right secret are refused, with a test. Add it as a Telegram bot rule at build time.


### [2026-11-08 22:34 SGT] "Delete a photo" needs a fifth narrow edit to the add-only rule
- [2026-11-11 17:28 SGT] **RESOLVED:** migration 005 adds edit 6 (`delete_photo`, rule 8.4), with database test T50; photos now live in their own table, so no link is left in the log. Removing the file from storage is built with the photo store (rule 8.5 order).
- [2026-11-09 17:44 SGT] Owner (9 Nov): workaround agreed. The goal: when a parent deletes a photo, **no copy of it is kept anywhere** (not in the photo store and not as a link in the log).
- [2026-11-09 00:14 SGT] Update: Undo (rule 5.8) became edit 5 of rule 8.4 on 8 Nov, so "delete a photo" would be **edit 6**.
- **Issue:** [2026-11-08 22:34 SGT] Rule 9.1 now promises "delete a photo", but rule 8.4 allows only four narrow edits and logs are add-only (privacy review of the Telegram onboarding design, 3 Nov; owner agreed to log it on 8 Nov).
- **Impact:** [2026-11-08 22:34 SGT] None yet (no photos are stored). Without it, the promise in the photo consent can't be kept.
- **Workaround:** [2026-11-08 22:34 SGT] When building the photo store: a new migration with a fifth narrow edit (remove one photo link from one parent's log), plus removing the file from storage, test-first, with an approved change to rule 8.4.


### [2026-11-09 17:50 SGT] An undone log's "how did it feel" line and photo are not cleaned up
- [2026-11-11 17:28 SGT] **RESOLVED:** migration 005's `undo_log` blanks the line and deletes the photo row in the same step (rule 8.4 edit 7, rule 5.8); database test T49. The app removes the photo file first (rule 8.5).
- **Issue:** [2026-11-09 17:50 SGT] The "Add how you felt" line is free text that may hold a child's name or health details, and it goes to Claude (rule 5.3). The spec does not say what happens to the line or photo when a log is undone (privacy review of the B1 daily loop design, 9 Nov; owner agreed to log it on 9 Nov).
- **Impact:** [2026-11-09 17:50 SGT] None yet (Undo is not built). Personal details could be kept for a log the parent cancelled.
- **Workaround:** [2026-11-09 17:50 SGT] Owner decided (9 Nov): when a log is undone, **delete its line and any photo**. Write it into rules 5.8 and 8.4 (approved change, test-first) when building Undo.


### [2026-11-09 17:50 SGT] Undo's 30-second limit must be enforced by the database
- [2026-11-11 17:28 SGT] **RESOLVED:** migration 005's `undo_log` refuses an Undo after the window (read from the settings version) or on a non-keyboard log; database test T49 (and T53).
- **Issue:** [2026-11-09 17:50 SGT] Rule 8.4 edit 5 (Undo, rule 5.8) says it is enforced by the database, but nothing says the database itself checks the 30-second window and "keyboard logs only" (privacy review of the B1 daily loop design, 9 Nov; owner agreed to log it on 9 Nov).
- **Impact:** [2026-11-09 17:50 SGT] None yet (Undo is not built). If only the app code checked them, a bug could quietly undo any old log and change streaks and metrics.
- **Workaround:** [2026-11-09 17:50 SGT] When building Undo: the database function itself refuses an undo after 30 seconds or on a non-keyboard log, with database tests for both.


### [2026-10-24 18:26 SGT] Trial length not decided
- [2026-10-31 18:00 SGT] RESOLVED: 5 full weeks per family from its first full Monday, 5 to 10 families (D9, Telemetry rule 10.3). Moved to Resolved.
- **Issue:** [2026-10-24 18:26 SGT] Metrics 6 and 7 (target-hit rate, unprompted log rate) use "the final 4 weeks" and "the final 2 weeks", so they need a trial length of at least 4 weeks.
- **Impact:** [2026-10-24 18:26 SGT] Success tests Y and Z cannot be calculated without it.
- **Workaround:** [2026-10-24 18:26 SGT] None yet. Product manager to decide (see the Settings sheet of the metrics file).
- [2026-10-24 18:34 SGT] Kept as WIP, added to `docs/PRODUCT-BACKLOG.md`.

### [2026-10-25 07:17 SGT] The nudges SQL has not run on the real Supabase yet
- [2026-10-25 08:14 SGT] RESOLVED: `001` and `002` have run on Supabase; tables, columns and permissions confirmed by the owner's screenshots. (Moved to Resolved.)
- [2026-10-25 08:11 SGT] `001` has now run on Supabase (tables and columns confirmed by screenshot). The live permission check found extra `service_role` permissions; fixed by `002` (see `docs/ERROR-LOG.md`), waiting for the owner to run it.
- [2026-10-25 07:51 SGT] The file is now `supabase/migrations/001_create_nudge_repository.sql` (two tables, guard, view); 25 database checks pass locally. Still not run on Supabase.
- **Issue:** [2026-10-25 07:17 SGT] `001_create_nudges.sql` passed 13 tests on a local PostgreSQL 16, but Supabase may differ slightly (version, built-in roles, Data API grant rules).
- **Impact:** [2026-10-25 07:17 SGT] The first run in Supabase could show an error.
- **Workaround:** [2026-10-25 07:17 SGT] When the owner creates the Supabase project (step 3), run the file in the SQL Editor and report any error; Claude fixes it and logs it here.


### [2026-10-24 17:39 SGT] How long photos of children are kept
- [2026-10-24 18:26 SGT] **Resolved:** photos are kept until the parent deletes their data, with consent at sign-up (spec version 1.1). The remaining privacy risk is tracked above under "Photos kept with no time limit".
- **Issue:** [2026-10-24 17:39 SGT] The spec stores photos (which may show children) but does not say how long they are kept or how they are deleted.
- **Impact:** [2026-10-24 17:39 SGT] Must be decided before real families use the app. Personal data of children is sensitive (for example under Singapore's Personal Data Protection Act (PDPA)).
- **Workaround:** [2026-10-24 17:39 SGT] None yet. Do not onboard real families until decided.

- [2026-10-24 17:39 SGT] Nothing resolved yet. SUPERSEDED [2026-10-24 18:26 SGT]
