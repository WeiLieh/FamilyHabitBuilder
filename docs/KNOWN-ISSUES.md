# Known Issues

## Open

### [2026-10-28 22:23 SGT] Deliberate nudges can be crowded out on Friday and Sunday
- **Issue:** [2026-10-28 22:23 SGT] Deliberate behaviours are only nudged on Friday and Sunday, and come after due quick behaviours in priority. A parent with few slots on those days (e.g. 1) and a due quick behaviour may never get a deliberate nudge that week.
- **Impact:** [2026-10-28 22:23 SGT] Deliberate behaviours (the bigger family activities) could be under-nudged for some parents.
- **Workaround:** [2026-10-28 22:23 SGT] Parents can still log on their own. Owner chose Option B "to progress things first; we'll figure it along the way". Option to revisit: on Friday and Sunday, put a due deliberate behaviour first.

### [2026-10-28 22:23 SGT] Batch 2 parts that depend on later steps
- **Issue:** [2026-10-28 22:23 SGT] The planner is built and tested, but these are not built yet: the sender that re-checks just before sending (Datastore and Telegram bot steps), the ✅ Done and 😴 Not today buttons, the slot setup screen, and the holiday dates (owner uploads before launch).
- **Impact:** [2026-10-28 22:23 SGT] No nudge messages are sent yet.
- **Workaround:** [2026-10-28 22:23 SGT] Build with the Datastore (step 2) and Telegram bot (step 3).

### [2026-10-25 07:17 SGT] Database tests are not run automatically
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

### [2026-10-24 18:26 SGT] Trial length not decided
- **Issue:** [2026-10-24 18:26 SGT] Metrics 6 and 7 (target-hit rate, unprompted log rate) use "the final 4 weeks" and "the final 2 weeks", so they need a trial length of at least 4 weeks.
- **Impact:** [2026-10-24 18:26 SGT] Success tests Y and Z cannot be calculated without it.
- **Workaround:** [2026-10-24 18:26 SGT] None yet. Product manager to decide (see the Settings sheet of the metrics file).
- [2026-10-24 18:34 SGT] Kept as WIP, added to `docs/PRODUCT-BACKLOG.md`.

### [2026-10-24 18:26 SGT] Photos kept with no time limit
- **Issue:** [2026-10-24 18:26 SGT] Photos (which may show children) are kept until the parent deletes their data. The PDPA expects organisations to stop keeping personal data once it is no longer needed.
- **Impact:** [2026-10-24 18:26 SGT] Fine for a friends trial with consent; a reviewer would question it before opening to the public.
- **Workaround:** [2026-10-24 18:26 SGT] Consent at sign-up plus the "delete my data" function. Revisit before any public launch.
- [2026-10-24 18:34 SGT] Product manager confirmed: keep as an open issue.

## Resolved

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
