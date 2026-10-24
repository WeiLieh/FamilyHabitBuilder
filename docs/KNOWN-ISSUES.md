# Known Issues

## Open

### [2026-10-25 06:25 SGT] Broken nudge rows are reported, but no alert is sent yet
- **Issue:** [2026-10-25 06:25 SGT] The Nudge repository returns a list of broken rows (spec v1.4 says alert the owner), but nothing delivers that alert yet.
- **Impact:** [2026-10-25 06:25 SGT] Until it is built, the owner would not hear about a broken row.
- **Workaround:** [2026-10-25 06:25 SGT] Build the alert with the Datastore and Telegram bot (step 2 or 3), for example a Telegram message or log line to the owner. Not live yet, so no real impact.

### [2026-10-24 22:14 SGT] Nudge repository edits skip review and history
- **Issue:** [2026-10-24 22:14 SGT] Edits in the Supabase dashboard go live to parents immediately, without a pull request, tests or Git history.
- **Impact:** [2026-10-24 22:14 SGT] A typo or a deleted row reaches parents straight away, and the old version cannot be recovered unless a backup was exported. A reviewer (for example a Change Advisory Board (CAB)) would ask who can change live content and how a bad change is undone.
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

### [2026-10-24 17:39 SGT] How long photos of children are kept
- [2026-10-24 18:26 SGT] **Resolved:** photos are kept until the parent deletes their data, with consent at sign-up (spec version 1.1). The remaining privacy risk is tracked above under "Photos kept with no time limit".
- **Issue:** [2026-10-24 17:39 SGT] The spec stores photos (which may show children) but does not say how long they are kept or how they are deleted.
- **Impact:** [2026-10-24 17:39 SGT] Must be decided before real families use the app. Personal data of children is sensitive (for example under Singapore's Personal Data Protection Act (PDPA)).
- **Workaround:** [2026-10-24 17:39 SGT] None yet. Do not onboard real families until decided.

- [2026-10-24 17:39 SGT] Nothing resolved yet. SUPERSEDED [2026-10-24 18:26 SGT]
