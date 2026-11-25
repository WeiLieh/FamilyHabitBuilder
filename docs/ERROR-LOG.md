# Error Log

[2026-11-12 23:24 SGT] Older replaced (superseded) lines were moved word for word to [docs/archive/ERROR-LOG-superseded.md](archive/ERROR-LOG-superseded.md) to keep this file short (owner approved).

One entry per error: What broke / Cause / Fix / How to prevent it. Newest first.


## [2026-11-25 22:32 SGT] Timestamps written without running the clock
- **What broke:** [2026-11-25 22:32 SGT] While building Settings, Claude Code wrote date prefixes 22:45, 23:05, 23:30 and 23:40 SGT into four specs and the diagram notes, guessing the time instead of running the date command. The real time was 22:32, so they were in the future.
- **Cause:** [2026-11-25 22:32 SGT] The clock was read once at the start of the build (22:14) and later times were estimated.
- **Fix:** [2026-11-25 22:32 SGT] All of tonight's prefixes were corrected to the real time before any push.
- **How to prevent it:** [2026-11-25 22:32 SGT] Run `TZ=Asia/Singapore date '+%Y-%m-%d %H:%M'` right before writing any prefix, every time (CLAUDE.md date/time rule).

## [2026-11-25 22:32 SGT] Styling used sizes the owner had not approved, again (rule 6; second time)
- **What broke:** [2026-11-25 22:32 SGT] Settings' new classes in `src/web-app/style.ts` use sizes the UI decisions don't list: the switch (52 by 32px, a 26px knob), tick boxes (22px), 48px rows, the Back link (64px wide), 44px text boxes, and the accent green on the switch and tick boxes. The colours, corners, spacing and font sizes are from L1 to L13; warning red is kept for Delete only (test ST7 caught an error line in red, fixed).
- **Cause:** [2026-11-25 22:32 SGT] The owner chose "Settings, then the look" for tonight, and Claude Code filled the gaps to make the pages usable instead of listing them first, as the 24 Nov entry says.
- **Fix:** [2026-11-25 22:32 SGT] Listed for the owner as open choices for step 2 (the look) and in `docs/KNOWN-ISSUES.md`; nothing ships until the owner reviews the pull request.
- **How to prevent it:** [2026-11-25 22:32 SGT] Same as 24 Nov: list every new value against the UI decisions **before** writing styling. If this happens a third time, propose a one-line rule for CLAUDE.md (practice 4).

## [2026-11-24 23:56 SGT] A database test passed for the wrong reason
- **What broke:** [2026-11-24 23:56 SGT] T127's check "a second demo parent for one owner is refused" passed, but because the insert named a column that no longer exists (`wrap_up_on`, removed by migration 004), not because of the one-demo rule. The test accepted either error message.
- **Cause:** [2026-11-24 23:56 SGT] The expected-error pattern was too loose ("parents_one_demo_each|wrap_up_on|column"), so any failure counted as a pass.
- **Fix:** [2026-11-24 23:56 SGT] The insert now uses today's columns and the pattern accepts only the one-demo rule's own error (#63).
- **How to prevent it:** [2026-11-24 23:56 SGT] A "must be refused" test names exactly one expected reason; never widen the pattern to make it pass. Read the PASS line's reason when a new refusal test passes first time.

## [2026-11-24 23:10 SGT] Styling used sizes the owner had not approved (rule 6)
- **What broke:** [2026-11-24 23:10 SGT] The first version of My page's stylesheet used eleven sizes from the owner's layout files that weren't in the approved list (L9 to L11), and four of Claude Code's own picks (17px moment line, 10px tile text, a 1.5px ring, a 104px gap). Rule 6 says the look comes only from the owner.
- **Cause:** [2026-11-24 23:10 SGT] The approved list was written from a quick scan of the main layout file; the details needed while building (circle, tile and button sizes) were filled in without going back to the owner.
- **Fix:** [2026-11-24 23:10 SGT] The spec-compliance review caught it before the pull request; the owner approved the file's sizes as L13 and chose option B for the four picks (#57).
- **How to prevent it:** [2026-11-24 23:10 SGT] Before writing styling, list **every** value the stylesheet will use (sizes, corners, spacing, icons) against the UI decisions, and ask for any that are missing, rather than filling them in.

## [2026-11-15 21:35 SGT] The owner's own sign-in press was refused as a forged form (UAT U58)
- **What broke:** [2026-11-15 21:35 SGT] On the owner's iPhone, pressing **Open my page** showed "Sorry, that didn't work." Vercel's log showed the press answered with 403.
- **Cause:** [2026-11-15 21:35 SGT] The forged-form check (added after the privacy review of #52) treated an Origin of "null" as another website. Our pages ask browsers to send no referrer, and with that setting an iPhone labels a form from our own page with Origin "null", while its Sec-Fetch-Site label correctly says "same-origin". The tests set these labels by hand and never tried that pair.
- **Fix:** [2026-11-15 21:35 SGT] Sec-Fetch-Site decides when the browser sends it; Origin is compared only without it. New test W12 (the iPhone's exact labels); W11 (forged forms refused) still passes.
- **How to prevent it:** [2026-11-15 21:35 SGT] When a check depends on what browsers send, test it once on a real phone before calling it done, and copy the real headers into a test.

## [2026-11-15 16:45 SGT] A commit was pushed while the drift check was failing
- **What broke:** [2026-11-15 16:45 SGT] Commit 015abc6 (Web app sign-in) was committed and pushed with one drift failure: the new UAT file wasn't linked from any spec, so it was "not reachable".
- **Cause:** [2026-11-15 16:45 SGT] The command ran the check, then searched its output for results, and joined the steps with "and then". The search succeeded (it found the failure lines), so the commit went ahead: the check's own result was never looked at (CLAUDE.md rule 7).
- **Fix:** [2026-11-15 16:45 SGT] Linked the file from `src/web-app/SPEC.md` (commit 587af40); the check passed. From then on the check's own exit code decides whether to commit.
- **How to prevent it:** [2026-11-15 16:45 SGT] Run `npm run check` on its own and commit only when its exit code is 0; never decide from a filtered copy of its output.

## [2026-11-15 11:41 SGT] The preview bot found no chat to send to
- **What broke:** [2026-11-15 11:41 SGT] The preview job stopped twice with "No chat found", although the owner had sent /start to the preview bot.
- **Cause:** [2026-11-15 11:41 SGT] First, the token saved in GitHub belonged to another bot; then, with the right token, Telegram had no waiting message for the bot (the earlier /start never reached it under that token).
- **Fix:** [2026-11-15 11:41 SGT] The owner copied the token again from BotFather (/mybots, then API Token), updated the GitHub secret, and sent the bot a fresh "hi"; the job then sent everything. The job's log now names the bot a token belongs to (its public username only).
- **How to prevent it:** [2026-11-15 11:41 SGT] When a bot token is set up, first check which bot it belongs to (getMe) and that a message is waiting, before sending anything.

## [2026-11-11 21:45 SGT] The bot stopped answering after the webhook was set again
- **What broke:** [2026-11-11 21:45 SGT] UAT U5: `/start <code>` got no reply on any device, and Vercel's Logs showed no request at all.
- **Cause:** [2026-11-11 21:45 SGT] setWebhook had been run a second time with a typo in the path (`/ape/telegram-bot`), so Telegram delivered to a page that doesn't exist (getWebhookInfo: "Wrong response from the webhook: 404 Not Found", 2 messages pending). The bot and the database were fine.
- **Fix:** [2026-11-11 21:45 SGT] setWebhook again with `/api/telegram-bot`; getWebhookInfo then showed the right address and 0 pending.
- **How to prevent it:** [2026-11-11 21:45 SGT] UAT S8 now checks the address with getWebhookInfo straight after setting it. When the bot is silent and Vercel shows no request, check getWebhookInfo first: the problem is between Telegram and Vercel, not in our code.

## [2026-11-11 21:03 SGT] Telegram refused the webhook secret
- **What broke:** [2026-11-11 21:03 SGT] UAT step S8 (setWebhook) answered "Bad Request: secret token contains illegal characters".
- **Cause:** [2026-11-11 21:03 SGT] The password generator added symbols. Telegram allows only A–Z, a–z, 0–9, `_` and `-` in the webhook secret; the UAT said "letters and numbers only" but not "turn symbols off".
- **Fix:** [2026-11-11 21:03 SGT] A new letters-and-numbers secret, updated in Vercel (`TELEGRAM_WEBHOOK_SECRET`), a redeploy, then S8 again.
- **How to prevent it:** [2026-11-11 21:03 SGT] The UAT's S4 now says to turn symbols off and names the allowed characters.

## [2026-11-11 20:17 SGT] Migration 006's check said the function didn't exist
- **What broke:** [2026-11-11 20:17 SGT] After running migration 006 in Supabase, the check query failed: "function public.sign_up(...) does not exist" (UAT step S2).
- **Cause:** [2026-11-11 20:17 SGT] The migration had not taken effect in Supabase. The file itself was fine: it ran cleanly on a local copy built from migrations 001 to 005. Likely causes: run in another of several open tabs with an error that went unseen, only part of the file copied, or some text highlighted (Supabase then runs only the highlighted part).
- **Fix:** [2026-11-11 20:17 SGT] The owner re-ran the whole file in a fresh, empty tab, with nothing highlighted; the check then showed true for both.
- **How to prevent it:** [2026-11-11 20:17 SGT] Run each migration in a new, empty SQL tab, copied from the file's Raw view, with nothing highlighted, and confirm "Success" before running the check.

## [2026-11-11 17:44 SGT] The architecture diagram showed the Telegram bot as "Not started" a week into its design
- **What broke:** [2026-11-11 17:44 SGT] The owner noticed the Telegram bot box was still grey ("Not started") on 11 Nov, although its design started on 3 Nov. Photo check, Telemetry and Experiments were also grey although designed.
- **Cause:** [2026-11-11 17:44 SGT] Habit H2 ("update the Module table and the diagram status" at the end of a session) was missed in sessions 8 to 10. The drift test only checked that the diagram and the Module table agree with each other (rule D2), and both were equally out of date.
- **Fix:** [2026-11-11 17:44 SGT] Statuses updated with the owner. New rule D4: the drift test fails if a box's colour doesn't fit its status words (owner chose this, 11 Nov).
- **How to prevent it:** [2026-11-11 17:44 SGT] At every session end, review each module's status against what the session changed (H2), and name any status change in the handoff note. D4 catches words and colour disagreeing; only the habit catches a status that is no longer true.

## [2026-11-09 21:57 SGT] Removing a test dropped the count below the minimum
- **What broke:** [2026-11-09 21:57 SGT] After the owner approved removing the test "not sent when the parent has turned it off", `npm run check` failed: "Only 138 tests; the minimum recorded in docs/SPEC.md is 139" (rule P1, habit H4).
- **Cause:** [2026-11-09 21:57 SGT] A test removed for a good reason still lowers the count, and the minimum must never drop.
- **Fix:** [2026-11-09 21:57 SGT] Added a test for a behaviour nothing checked yet ("sent at any time the parent may choose, and only pausing stops it"), shown to fail on the old code. Count back to 139. The minimum was not lowered.
- **How to prevent it:** [2026-11-09 21:57 SGT] When a test is removed, plan its replacement in the same step, and show the owner both.

## [2026-11-08 23:12 SGT] Design-handoff pull request failed the drift check (second time)
- [2026-11-08 23:42 SGT] **Third time:** pull request #21 (branch `design/telegram-b1-daily-loop-2026-11-08`) had the same gap. The owner closed it unmerged; the handoff and its link came in on `claude/festive-einstein-nf623s`. New rule **H10** added to `CLAUDE.md` (owner approved).
- **What broke:** [2026-11-08 23:12 SGT] Pull request #19 (branch `design/telegram-screen-edits-2026-11-08`) failed `npm run check` in GitHub: "docs/handoffs/2026-11-08-telegram-onboarding-screen-edits.md is not reachable by links from CLAUDE.md or docs/SPEC.md" (rule D1). The same happened with pull request #17 on 3 Nov.
- **Cause:** [2026-11-08 23:12 SGT] A handoff branch adds a new file but not the link to it in the document index of `docs/SPEC.md`. The handoff itself asks Claude Code to add the link later, so the handoff branch on its own is never green.
- **Fix:** [2026-11-08 23:12 SGT] The link was added on `claude/festive-einstein-nf623s` (commit ed9d681), which also contains the handoff commit. Merging that branch's pull request brings both in; pull request #19 can be closed without merging.
- **How to prevent it:** [2026-11-08 23:12 SGT] A handoff branch adds the file **and** its link in the document index of `docs/SPEC.md` (under "Design handoffs from Claude Chat") in the same commit. If this happens a third time, propose a one-line rule for `CLAUDE.md` (practice 4).

## [2026-10-25 08:11 SGT] Our server's role had more than read-only access on the real Supabase
- **What broke:** [2026-10-25 08:11 SGT] The owner's permission check on the live project showed `service_role` with TRUNCATE, TRIGGER and REFERENCES on `nudges`, `examples` and the view, not just SELECT.
- **Cause:** [2026-10-25 08:11 SGT] Supabase's default permissions give `service_role` these on new tables. Our local test database has no such defaults, so the test passed locally while the real project differed.
- **Fix:** [2026-10-25 08:11 SGT] New migration `002_service_role_read_only.sql` removes all of `service_role`'s permissions on the three objects and grants back SELECT on the two tables only. The database test now copies Supabase's defaults first and checks TRUNCATE, TRIGGER and REFERENCES are absent (seen failing without 002, passing with it).
- **How to prevent it:** [2026-10-25 08:11 SGT] After running any migration on Supabase, run the read-only permission check query; make the local test start from Supabase-like defaults; always "revoke all" before "grant" for our roles.

## [2026-10-25 07:17 SGT] Database test expected the next ID to be 10, got 19
- **What broke:** [2026-10-25 07:17 SGT] A database test (my own, just written) failed: a new row got ID 19, not 10.
- **Cause:** [2026-10-25 07:17 SGT] Each refused insert earlier in the test still used up an ID number. Databases never hand back numbers from failed attempts, so IDs can skip. The test's assumption was wrong, not the table.
- **Fix:** [2026-10-25 07:17 SGT] The test now checks what matters: the new ID is above 9 and unique. Recorded in the test's comment.
- **How to prevent it:** [2026-10-25 07:17 SGT] Never assume generated IDs are consecutive; treat them as labels, not a count.

## [2026-10-25 07:17 SGT] Local test database would not start
- **What broke:** [2026-10-25 07:17 SGT] PostgreSQL refused to start in the scratchpad folder.
- **Cause:** [2026-10-25 07:17 SGT] The folder path was longer than the 107-character limit for its connection file, and the scratchpad is private to the root user.
- **Fix:** [2026-10-25 07:17 SGT] Started it with network-only connections in a short throwaway folder (`/var/tmp/fhb-pg`), deleted afterwards.
- **How to prevent it:** [2026-10-25 07:17 SGT] For local PostgreSQL, use a short folder path owned by the `postgres` user and connect via 127.0.0.1.

## [2026-10-24 21:19 SGT] Build failed: TypeScript asked for "rootDir"
- **What broke:** [2026-10-24 21:19 SGT] `npm run build` stopped with error TS5011: "The 'rootDir' setting must be explicitly set".
- **Cause:** [2026-10-24 21:19 SGT] TypeScript 7 no longer guesses which folder is the top of the code when it writes the compiled files. It wants it written down.
- **Fix:** [2026-10-24 21:19 SGT] Added `"rootDir": "."` to `tsconfig.build.json`. The check then passed.
- **How to prevent it:** [2026-10-24 21:19 SGT] When adding a new TypeScript settings file that writes output, always set `rootDir` and `outDir` together.

