# Progress (handoff between sessions)

## [2026-11-11 17:15 SGT] Session 11
### Done
- [2026-11-11 17:15 SGT] Start-of-session routine: drift check passed (22 checks, no warnings); pull request #30 merged by the owner; branch brought level with `main`. Target agreed (2 to 3 hours, Option 1): the five answers, then migration 005.
- [2026-11-11 17:15 SGT] Owner answered the five questions: (1) Option A, plus a new **CLAUDE.md rule 12** (no dead code or obsolete tests); (2) question 12 as recommended (rule 10.2, new rule 3.15); (3) the `/log` default confirmed (rule 5.4); (4) rules 5.6 and 7.7 rewritten; (5) Datastore Option 1. Change note 1.19.
- [2026-11-11 17:15 SGT] Yesterday tests rewritten test-first as today-only checks (3 seen failing, then `week.ts` changed to refuse any day but today; the old "week closed" path removed). 139 before, 139 after.
- [2026-11-11 17:29 SGT] Owner answered the Datastore questions: Undo deletes even a checked photo (keeps everything consistent); reflection text kept as long as the parent stays.
- [2026-11-11 17:29 SGT] **Migration 005 built test-first** (Option 1): photos, reflections, moment lines; habit_logs today only with logged_via and undone_at; Undo and delete-a-photo (edits 5 to 7); the connection question as its own message with a 24-hour answer window; nine event types; windows read from the settings version. Database tests T43 to T53 added and T20 to T25 rewritten (all pass locally); two window tests added (app tests 139 to 141, minimum raised). Rules 8.3, 8.4, 8.6, 8.11, 5.8 changed; values 32 to 34; three known issues resolved. Both review agents run before the pull request.
- [2026-11-11 17:31 SGT] Review agents (H3) on migration 005. Privacy: no high; fixed in 005: ID counters locked for the new tables, the answer window counted in seconds (no rounding), the migration refuses to run if a log still holds a photo, comments no longer overclaim; logged as a known issue: the app must find a photo file through the parent's own row and check the Undo window before deleting the file. Spec checker: rewrote the yesterday-log test in `tests/nudge-engine-due.test.ts` (rule 12), corrected four Tested-by lines (5.4, 5.6, 7.7, 10.2) and stale "14 tables" and B1 lines.
- [2026-11-11 17:38 SGT] Pull request #31 merged by the owner. **Migration 005 applied on Supabase** (before query: 0 logs; check query matched every expected value); fingerprint `a40ed69fcd54` recorded in `src/datastore/SPEC.md` (rule B1).
- [2026-11-11 17:44 SGT] Owner spotted the stale architecture diagram. Statuses updated (Telegram bot "Design in progress"; Photo check, Telemetry, Experiments "Designed, not built"; Variable rewards "Designed, partly built"). New rule **D4** in the drift test, written test-first: a box's colour must fit its status. App tests 141 to 143; minimum raised. Error log entry added.
### In progress
- [2026-11-11 17:38 SGT] None.
- SUPERSEDED [2026-11-11 17:38 SGT] [2026-11-11 17:29 SGT] Migration 005 built and committed; **waiting for the owner to apply it in Supabase** (after the pull request is merged), then its fingerprint is recorded.
- SUPERSEDED [2026-11-11 17:29 SGT] [2026-11-11 17:15 SGT] Migration 005 (Datastore proposal, Option 1): waiting for the owner's answers to its two questions (undo and a checked photo; how long reflection text is kept).
### Next steps
- [2026-11-11 17:15 SGT] Build migration 005 test-first; both review agents; the owner applies it in Supabase.
### Blockers
- [2026-11-11 17:15 SGT] None.

## [2026-11-09 21:57 SGT] HANDOFF: session 10 ended (read this first)
- [2026-11-09 21:57 SGT] **State:** everything is in `main` (pull request #29 merged) plus this end-of-session pull request (habit H9). `npm run check` passes (139 tests, drift clean); database tests T1 to T42 pass locally. Migration 004 is applied on Supabase and fingerprinted.
- [2026-11-09 21:57 SGT] **Owner answers needed first, next session** (also in `docs/CATCH-UP.md`, top): (1) the yesterday test, Option A (turn all four yesterday tests into today-only checks, 139 stays) or B; (2) question 12 and rule 10.2 (Claude's recommended events; nudge, then summary, then question); (3) the `/log` default for an unchosen habit; (4) go-ahead to update the texts of rules 5.6 and 7.7; (5) the Datastore proposal (Option 1 or 2 and its two questions).
- [2026-11-09 21:57 SGT] Screen previews belong in Claude Chat (the owner found the Code preview not good enough).

## [2026-11-09 17:45 SGT] Session 10
### Done
- [2026-11-09 17:45 SGT] Start-of-session routine: drift check passed (22 checks, no warnings); catch-up page shown. Pull request #22 (session 9) still open for the owner to merge.
- [2026-11-09 17:45 SGT] Owner decided the five 3 Nov privacy findings (already logged): status lines in `docs/KNOWN-ISSUES.md`; Q4 partly answered (the child's name is never sent to Claude, only shown in Telegram); change note in `docs/SPEC.md`. Small-group recognition waits for a clarification.
- [2026-11-09 17:50 SGT] Owner decided the five 9 Nov privacy findings (all as recommended) and clarified small-group recognition (names out of Telemetry and exports; birth year stored, shown as bands): 5 new known issues, change note in `docs/SPEC.md`.
- [2026-11-09 17:45 SGT] Owner approved archiving: sessions 1 to 6 moved word for word to `docs/archive/PROGRESS-sessions-1-to-6.md`, short summary left below.
- [2026-11-09 18:16 SGT] **B2 Sunday rhythm, group A settled** (owner): the stand-alone connection question at the Wrap Up time, never counted, not while paused, fixed words; **one Pause switch** stops everything. Rules 3.4, 3.12, 5.6, 7.8, 8.4 changed (change note 1.17). Owner chose to remove the Wrap Up switch now: code and setting changed test-first (one test removed with approval, one added; 139 → 139), migration 004 written test-first (database test T42; all database tests pass locally), Experiments value 30 retired. **Migration 004 not yet applied** (owner, after merge).
- [2026-11-09 18:18 SGT] Review agents (H3) ran on the B2 group A changes. Privacy: no high or medium findings; 2 low ones fixed (the `paused` description now also mentions the connection question, in migration 004; a stale comment in `wrap-up.ts`); the third (Telemetry view columns) is already covered by test T6. Spec checker: 3 mismatches fixed (the same comment, two stale lines in `src/variable-rewards/DESIGN.md`, T42 added to rule 8.4's tests).
- [2026-11-09 18:23 SGT] Pull request #22 merged by the owner; branch moved up to `main`. **Migration 004 applied on Supabase** by the owner; the check query matched every expected value; fingerprint recorded in `src/datastore/SPEC.md` (rule B1).
- [2026-11-09 18:26 SGT] **B2 group B settled** (owner): fixed-template Wrap Up, never Claude; "Your streak starts next week" in the joining week; monthly section provisional. Rule 7.8 changed.
- [2026-11-09 19:25 SGT] Low-fidelity preview of B2 group C made as a private Claude artifact ("B2 Sunday rhythm: answering and saving"); the owner found the Code screens not good enough and is taking questions 9 to 11 to Claude Chat. Brief written: `docs/handoffs/2026-11-09-b2-answering-and-saving-brief-for-chat.md`, linked in the `docs/SPEC.md` index.
- [2026-11-09 21:49 SGT] Read the three Chat handoffs (B1 parts 2 and 3, B2) and the owner's answers to the seven points (section 4a). Recorded: rules 5.1, 5.4, 3.12, 7.6, 7.8 changed (old text SUPERSEDED); dated design notes in the Telegram bot, Nudge engine, Variable rewards and Photo check specs; change note 1.18. Drafted the Datastore proposal (`src/datastore/SPEC.md`, "Proposed"). Four typed-text known issues logged. Backlog: grace period after midnight. Nothing built.
### In progress
- [2026-11-09 19:25 SGT] B2 group C (questions 9 to 11): owner designing in Claude Chat. Question 12: waiting, in Claude Code.
- SUPERSEDED [2026-11-09 19:25 SGT] [2026-11-09 18:17 SGT] B2 Sunday rhythm: groups B to D (questions B6 to D12) waiting for the owner's answers.
- SUPERSEDED [2026-11-09 18:17 SGT] [2026-11-09 17:50 SGT] None.
- SUPERSEDED [2026-11-09 17:50 SGT] [2026-11-09 17:45 SGT] The five 9 Nov privacy findings (CATCH-UP 4e) still need the owner's answers.
### Next steps
- [2026-11-09 18:17 SGT] Finish B2 (groups B to D). Owner: merge the pull request, then run migration 004 in Supabase. Then the rest of B1 and group C.
- SUPERSEDED [2026-11-09 18:17 SGT] [2026-11-09 17:45 SGT] B2 (Sunday rhythm) design.
### Blockers
- [2026-11-09 17:45 SGT] None.

## [2026-11-09 00:14 SGT] HANDOFF: session 9 ended (read this first)
- [2026-11-09 00:14 SGT] **Resume tomorrow.** First: decide the privacy-review findings (CATCH-UP section 4e), then B2 (Sunday rhythm) in Claude Chat. Experiment 1 was ignored this session (owner); it stays out until the owner brings it back.
- [2026-11-09 00:14 SGT] State: all of tonight's work is on `claude/festive-einstein-nf623s` and in the end-of-session pull request (habit H9). `npm run check` passes (139 tests, drift clean). Nothing built; specs only, plus the metrics spreadsheet version 2.
- [2026-11-09 00:14 SGT] Review agents (H3) ran before the pull request: spec checker found 3 stale references (fixed: `docs/SPEC.md` metrics paths, the 4-hour wording in `src/variable-rewards/DESIGN.md`); privacy reviewer's 5 findings wait for the owner (CATCH-UP 4e). Known issue "delete a photo" updated (it would now be edit 6 of rule 8.4).
- [2026-11-09 00:14 SGT] `docs/PROGRESS.md` is now over 300 lines: proposed to the owner to summarise the oldest entries into `docs/archive/` (waiting for approval).

## [2026-11-08 22:34 SGT] Session 9: owner's answers to the onboarding questions recorded
### Done
- [2026-11-09 00:10 SGT] Success metrics spreadsheet: version 2 created (metrics 7 and 8, the two window settings, a Change notes sheet); version 1 deprecated and moved to `docs/archive/` with a DEPRECATED banner sheet. References updated.
- [2026-11-09 00:08 SGT] Owner approved (after an old/new preview page): rule 5.2 "prompted = same behaviour nudged earlier the same day" (4-hour window dropped; a different behaviour's nudge does not count) and metric 8's window "same behaviour, same day". Spreadsheet update left to the owner.
- [2026-11-08 23:51 SGT] Owner answered the B1 questions: rule 5.8 Undo (30 seconds) and rule 8.4 edit 5 approved; rule 5.1 changed (a keyboard tap answers a waiting nudge); one-button keyboard fine; two wordings confirmed. New small question on rule 5.2's 4-hour window (CATCH-UP 4b).
- [2026-11-08 23:42 SGT] Opened pull request #21 for the B1 handoff; it failed the drift check (third time), the owner closed it, and habit **H10** was added to `CLAUDE.md`. Recorded the **B1 daily loop** (handoff `docs/handoffs/2026-11-08-telegram-b1-daily-loop.md`): rules 5.1 and 5.7 changed, proposed rule 5.8 (Undo) and the 8.4 edit, Q-B1-1 to Q-B1-3, change note 1.16. Nothing built.
- [2026-11-08 23:08 SGT] Recorded the owner's 8 Nov screen edits (handoff `docs/handoffs/2026-11-08-telegram-onboarding-screen-edits.md`, merged in from branch `design/telegram-screen-edits-2026-11-08`): rules 3.14 and 11.9 changed (one button each), screens 3 and 6 to 11 updated, Q3 partly answered, change note 1.15. Three defaults shown to the owner; [2026-11-08 23:09 SGT] owner confirmed all three. `npm run check` passed (139). Nothing built.
- [2026-11-08 22:34 SGT] Start-of-session routine: drift check passed (22 checks, no warnings); catch-up page and Telegram flow shown. Experiment 1 ignored this session (owner).
- [2026-11-08 22:34 SGT] Owner answered Q1 to Q13 and the privacy-review findings, and approved 9 rule changes (previewed as an old/new table): 5.5, 11.9, 8.10, new 8.13, new 2.5, 3.14, new 5.7, 9.1, 7.8. Written into the module specs (old text marked SUPERSEDED), change note 1.14 in `docs/SPEC.md`, 5 known issues logged, `docs/CATCH-UP.md` section 4 rewritten. `npm run check` passed (139 tests). No code changed.
### In progress
- [2026-11-08 22:34 SGT] None.
### Next steps
- [2026-11-08 22:34 SGT] Owner: design B1, B2 and C in Claude Chat; parked questions (CATCH-UP 4d) unblock 3.4, 5.6, 10.2. Then the thin-slice build, test-first (it now includes rules 2.5, 3.14, 5.7, 8.10's name column and 8.13).
### Blockers
- [2026-11-08 22:34 SGT] None for design. Building waits until groups A to C are designed.

## [2026-11-03 22:42 SGT] HANDOFF: session 8 ended (read this first)
- [2026-11-03 22:42 SGT] **Owner will answer next session:** the 8 proposed rule changes (table in `docs/CATCH-UP.md` section 4a) and Q1 to Q13. **Remind the owner first thing**, before any building.

## [2026-11-03 22:27 SGT] Session 8: Telegram onboarding design recorded
### Done
- [2026-11-03 22:27 SGT] Start-of-session routine (1 Nov): drift check and 139 tests passed. Answered the owner's question on reminders (each behaviour is nudged at most once a day, rule 3.8; nothing changed).
- [2026-11-03 22:27 SGT] Followed section 0 of the [Telegram onboarding handoff](handoffs/2026-11-03-telegram-onboarding-handoff.md) (owner decision, design chat, 2026-11-03): **recorded, not built.** The flow, principles and decisions are in `src/telegram-bot/SPEC.md`. Rules that would change are written as **proposed changes with old and new text**, awaiting owner approval: 8.10, 5.5 (Datastore), 11.9 (Experiments), 9.1 (Web app), 3.4 (Nudge engine), 7.8 (Variable rewards), 10.2 (Telemetry), 5.6 (Telegram bot). No rule text changed. Version 1.13 change note in `docs/SPEC.md`.
- [2026-11-03 22:27 SGT] Open questions Q1 to Q13, the before-build list and the parked list are in `docs/CATCH-UP.md` section 4.
- [2026-11-03 22:27 SGT] Drift fix: pull request #17 added the handoff file without a link (rule D1); it is now in the document index of `docs/SPEC.md`.
### In progress
- [2026-11-03 22:27 SGT] Telegram bot design in Claude Chat: group A done except Q1 to Q13; groups B1, B2, C next.
### Next steps
- [2026-11-03 22:27 SGT] Owner: approve or change the proposed rule changes (CATCH-UP 4a); answer Q1 to Q13 in Claude Chat; design B1, B2, C. Then the thin-slice build (sign-up, one fixed nudge, ✅ Done, receipt), test-first.
### Blockers
- [2026-11-03 22:27 SGT] None for design. Building waits until groups A to C are designed (owner's order). Q1 (PDPA) blocks the photo-consent wording.

## [2026-11-01 16:38 SGT] HANDOFF: session 7 ended (read this first)
### Done
- [2026-11-01 16:38 SGT] Start-of-session routine; PR A leftovers settled (known issue, rule 4.5 clarified); choice-limits test title fixed.
- [2026-11-01 16:38 SGT] **Datastore designed with the owner** over three drafts and a side-chat schema review (preview pages: "Datastore tables, draft 3" and "Datastore spec review", both claude.ai artifacts). Decisions A to M, child birth year, photos that fail the check are kept, five kinds of value (Tuneable, Named style, Named rule, Guardrail, Fixed), 31 values in `src/experiments/EXPERIMENTS.md`.
- [2026-11-01 16:38 SGT] **Built test-first and merged (PR #15):** rules 8.3 to 8.12, 5.6, 6.2, 10.4, 11.13 (1.4, 8.4, 11.10 changed); migration 003 (14 tables, all-or-nothing functions, Telemetry views, lock-down); database tests T1 to T41 plus 7 review-fix tests; `src/datastore/children.ts` and `consents.ts`; decision L (two numbers moved into `src/settings.ts`). App tests 129 → 139. Both review agents ran; 7 fixes applied, 4 known issues logged.
- [2026-11-01 16:38 SGT] **Migration 003 applied on Supabase by the owner;** check query matched; fingerprint recorded (rule B1). Datastore status: "Tables live".
- [2026-11-01 16:56 SGT] Housekeeping (owner): Datastore design pages saved as PDFs in `src/datastore/design/` for the owner only; Claude blocked from reading them (`.claude/settings.json`, habit H8); new habit H9 (end-of-session pull request); H7 handoff files come from the branch just pushed.
### In progress
- [2026-11-01 16:38 SGT] None.
### Next steps
- [2026-11-01 16:38 SGT] Start-of-session routine, then step 3: the **Telegram bot and first deploy** (see `docs/CATCH-UP.md` section 4: sign-up wording, buttons vs designed screens, creating the Telegram bot, Vercel project and Upstash).
- [2026-11-01 16:38 SGT] Database tests need a local PostgreSQL: see `docs/CONTEXT.md`, "How to run and test" (start command for the cloud container).
### Blockers
- [2026-11-01 16:38 SGT] None. Screens (choosing behaviours and times) need the owner's look and feel first (rule 6).

## [2026-11-01 09:56 SGT] Session 7
### Done
- [2026-11-01 09:56 SGT] Start-of-session routine: drift check passed (22 checks, no warnings); catch-up recap shown.
- [2026-11-01 09:56 SGT] Catch-up question 2 (owner: do it): known issue logged ("the database doesn't block the same example twice for one nudge"); "today" stays out of the time-word test, recorded as a dated clarification of rule 4.5 and in the test comment.
- [2026-11-01 09:56 SGT] Catch-up question 3 (owner: do it): the choice-limits test title and header now point to `src/experiments/EXPERIMENTS.md`. Same check, same numbers; test count unchanged at 129.
- [2026-11-01 09:56 SGT] `docs/CATCH-UP.md` section 3 brought up to date (rules 1.4, 1.5, 3.12 to 3.14, 7.7, 7.8, 10.2, 10.3, 11.1 to 11.12 were missing).
### In progress
- [2026-11-01 09:56 SGT] Owner reviewing the planned Datastore tables (catch-up question 1) before Claude drafts the mock-ups.
### Next steps
- [2026-11-01 09:56 SGT] Datastore table mock-ups in plain English, then tests first, then the build. First alpha experiment kept for later (Claude Chat).
### Blockers
- [2026-11-01 09:56 SGT] None.

## [2026-11-09 17:44 SGT] Sessions 1 to 6 (24 to 31 Oct 2026): summary, full text archived
- [2026-11-09 17:44 SGT] The full entries are in [docs/archive/PROGRESS-sessions-1-to-6.md](archive/PROGRESS-sessions-1-to-6.md) (moved word for word, owner approved).
- [2026-11-09 17:44 SGT] **Session 1 (24 Oct):** spec reviewed with the owner (v1.4), tech stack and development order agreed, project skeleton (`/api/health`, GitHub Actions); Batch 1 rules agreed; time log started.
- [2026-11-09 17:44 SGT] **Session 2 (25 Oct):** learner-comment rule; Batch 1 built test-first; Nudge repository as two tables (spec v1.6); Supabase project created (Singapore), migrations 001 and 002 run and locked down. 46 tests.
- [2026-11-09 17:44 SGT] **Session 3 (28 Oct):** owner imported 9 nudges and 45 examples into Supabase; time-agnostic examples; nudge slots decided; Batch 2 built test-first (84 tests); `docs/CATCH-UP.md` created.
- [2026-11-09 17:44 SGT] **Session 4 (29 Oct):** Variable rewards design v0.2 (owner's v0.1 reviewed); MVP rewards chosen; decisions D1 to D4 and D11 (all 9 nudges start unlocked).
- [2026-11-09 17:44 SGT] **Session 5 (31 Oct, morning):** restructure, PRs #1 to #10: `shared/` renamed `src/`, each module's spec next to its code, one diagram (`docs/ARCHITECTURE.md`), drift test, habits H1 to H5; two review agents written (PR #11).
- [2026-11-09 17:44 SGT] **Session 6 (31 Oct):** review agents merged (PR #11); 32 more examples (PR #12, 77 live); Weekly Wrap Up and rewards decisions D1 to D11 (PR #13); Experiments module on paper (PR #14). 129 tests at the end.
