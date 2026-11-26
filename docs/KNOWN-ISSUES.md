# Known Issues

[2026-11-12 23:24 SGT] Older replaced (superseded) lines were moved word for word to [docs/archive/KNOWN-ISSUES-superseded.md](archive/KNOWN-ISSUES-superseded.md) to keep this file short (owner approved).

## Open

[2026-11-26 23:06 SGT] The 13 oldest **open** entries (logged 24 to 31 Oct) were moved word for word to [docs/archive/KNOWN-ISSUES-open-to-2026-10-31.md](archive/KNOWN-ISSUES-open-to-2026-10-31.md) to keep this file short (owner approved). They are still open.

### [2026-11-26 22:38 SGT] DEF-4: no reminder arrived in the 9:30 pm slot added at 9:32 pm (UAT U45, BLOCKED)
- **Issue:** [2026-11-26 22:38 SGT] The run added a 9:30 pm school-day time at 9:32 pm with reminders on; nothing came by 10:00 pm. **Probably by design, to check:** each behaviour is nudged at most once a day (rule 3.8), the owner had 2 quick behaviours and 7:00 am and 7:00 pm reminders today, and a behaviour logged today gets no reminder (rule 3.6). If both were already nudged or logged, 9:30 pm had nothing due. Needs today's rows in `messages_sent` and `logs` (Supabase) to confirm.
- **Impact:** [2026-11-26 22:38 SGT] U45 (a keyboard tap answering a waiting reminder) is still untested on the live bot; app tests cover it.
- **Workaround:** [2026-11-26 22:38 SGT] Run U45 at the next reminder that arrives (owner taps the keyboard, not ✅ Done).

### [2026-11-25 23:10 SGT] On a shared phone, "Saved." can show for the next parent within a minute
- **Issue:** [2026-11-25 23:10 SGT] The "✅ Saved." notice lives in a 60-second cookie that sign-out and "delete my data" don't clear (privacy review, Low).
- **Impact:** [2026-11-25 23:10 SGT] If one parent saves, signs out, and another signs in on the same phone within 60 seconds, the second may see "Saved." once. Nothing personal is shown.
- **Workaround:** [2026-11-25 23:10 SGT] None needed (owner, 25 Nov: "leave it").

### [2026-11-25 22:50 SGT] The Web app now holds the bot's Telegram token (privacy review, Settings)
- **Issue:** [2026-11-25 22:50 SGT] `api/web-app.ts` uses `TELEGRAM_BOT_TOKEN` to send the bot's line after a pause or Behaviours change in Settings. Before, only the bot held it.
- **Impact:** [2026-11-25 22:50 SGT] If the Web app were ever broken into, someone could message parents as the bot. The token is never in a page, an address or a log.
- **Workaround:** [2026-11-25 22:50 SGT] Accepted by the owner (25 Nov). Alternative if needed later: Settings leaves a note for the bot to send at its next alarm run (up to 10 minutes later).

### [2026-11-25 22:50 SGT] "Delete my data" can stop halfway, after the photo files are gone
- **Issue:** [2026-11-25 22:50 SGT] The photo files are removed first (rule 8.5); if the records' delete then fails, the photos are gone while the records stay.
- **Impact:** [2026-11-25 22:50 SGT] The parent is told it didn't work; Week so far shows broken photos until they try again, which finishes the delete.
- **Workaround:** [2026-11-25 22:50 SGT] Try "Delete my data" again (accepted by the owner, 25 Nov).

### [2026-11-25 22:50 SGT] After "delete my data", a paused parent's Telegram Menu still shows /resume
- **Issue:** [2026-11-25 22:50 SGT] The Menu isn't put back after the delete.
- **Impact:** [2026-11-25 22:50 SGT] Harmless: the data is gone; tapping /resume gets the reply for someone not signed up.
- **Workaround:** [2026-11-25 22:50 SGT] None needed (accepted by the owner, 25 Nov).

### [2026-11-25 22:32 SGT] Settings' switch, tick boxes and row sizes are not yet the owner's decisions
- **Issue:** [2026-11-25 22:32 SGT] Settings (rule 9.9) uses sizes and the accent green for its switch, tick boxes, rows and Back link that aren't in the UI decisions (docs/ERROR-LOG.md, 25 Nov).
- **Impact:** [2026-11-25 22:32 SGT] The look may differ from what the owner wants; nothing is wrong with how it works.
- **Workaround:** [2026-11-25 22:32 SGT] The owner decides them in step 2 (the look of My page); until then they follow L1 to L13 as closely as possible.

### [2026-11-25 22:32 SGT] Saving several children at once is not all or nothing
- **Issue:** [2026-11-25 22:32 SGT] On the Children page, a rename and an add are saved one after another. If the second fails, the first stays saved and the page says it didn't work.
- **Impact:** [2026-11-25 22:32 SGT] Low: the parent sees the failure and the list shows what was saved.
- **Workaround:** [2026-11-25 22:32 SGT] Try again; nothing is duplicated (an unchanged name is not saved twice).

### [2026-11-25 22:32 SGT] A running demo's photo files are not removed by "delete my data"
- **Issue:** [2026-11-25 22:32 SGT] If the owner deletes their own data while a demo is running, the demo's rows go (migration 016) but the delete is refused until the demo's photo files are listed too, and the page can only list the parent's own.
- **Impact:** [2026-11-25 22:32 SGT] Owner only: the delete says it didn't work while a demo with photos runs.
- **Workaround:** [2026-11-25 22:32 SGT] Send `/demo stop` first (it removes the demo's photos), then delete.

### [2026-11-24 23:10 SGT] A failed "Question expired" edit is not retried
- **Issue:** [2026-11-24 23:10 SGT] After 24 hours the alarm marks the 1 to 5 question as closed, then edits the message to "Question expired". If that edit fails, it is logged as a failure but not tried again, so the old 1 to 5 buttons stay on screen (privacy review of #60, Low; owner added it, 24 Nov).
- **Impact:** [2026-11-24 23:10 SGT] Low: a tap on the old buttons is still refused with "This question has closed.", so nothing wrong is saved.
- **Workaround:** [2026-11-24 23:10 SGT] None needed for now; a retry can be added if Vercel's logs show failed edits.

### [2026-11-24 23:10 SGT] A moment line does not re-check recording consent
- **Issue:** [2026-11-24 23:10 SGT] Saving a moment's line (and the "Add a moment" tap) does not check the parent's recording consent again (privacy review of #60, Low; owner added it, 24 Nov).
- **Impact:** [2026-11-24 23:10 SGT] None today: withdrawing consent is not built, so every parent who can tap the button has agreed. It matters once withdrawing consent exists.
- **Workaround:** [2026-11-24 23:10 SGT] Add the check when withdrawing consent is built (Settings).

### [2026-11-24 22:16 SGT] The photo consent wording is a draft
- **Issue:** [2026-11-24 22:16 SGT] The first-photo consent uses Claude Code's draft ("We save your photos so you can see them on My page. Only you can see them, and you can delete any photo there."), accepted by the owner on 24 Nov to ship photos tonight.
- **Impact:** [2026-11-24 22:16 SGT] It has not been checked by the PDPA reviewer; consent for children's photos must be clear and lawful before any real family.
- **Workaround:** [2026-11-24 22:16 SGT] The owner is the only user; the PDPA reviewer's list already includes the photo consent wording. Replace it before real families.

### [2026-11-15 21:59 SGT] (a) The per-parent pass must stay on our server
- **Issue:** [2026-11-15 21:59 SGT] The 10-minute pass can call the four delete functions directly (migration 011). Our server deletes a photo's files first, then its record (rule 8.5 order); a pass used from elsewhere could delete the record first and leave the files behind. It can also write experiment labels into events unchecked (privacy review of #51).
- **Impact:** [2026-11-15 21:59 SGT] None today: the pass is made and used only on our server and never sent to the browser (tests P1, P2, W9). If that ever changed, photos could be orphaned where "delete my data" can't find them (PDPA risk), and telemetry could be polluted.
- **Workaround:** [2026-11-15 21:59 SGT] Never send the pass to the browser; a security review checks this whenever the Web app changes.

### [2026-11-15 21:59 SGT] (b) Old sign-in rows are tidied only when that parent signs in again
- **Issue:** [2026-11-15 21:59 SGT] Used or expired links and ended or expired sign-ins are deleted only when the same parent makes a new link or signs in again (rule 8.4, edit 14). A parent who stops using My page leaves a few rows behind (privacy review of #51).
- **Impact:** [2026-11-15 21:59 SGT] Low: the rows hold only fingerprints that open nothing; they go with "delete my data".
- **Workaround:** [2026-11-15 21:59 SGT] None needed now; a periodic clean-up could be added with the alarm run later.

### [2026-11-15 21:59 SGT] (c) Sign-in depends on two Supabase settings staying as they are
- **Issue:** [2026-11-15 21:59 SGT] The pass is signed with Supabase's legacy JWT secret, which Supabase says is "still used… only to verify". Rows stay safe only while that secret stays secret and Supabase's own sign-up stays off (privacy review of #52; checked at go-live, UAT G3 and G3b).
- **Impact:** [2026-11-15 21:59 SGT] If the legacy secret is revoked, My page sign-in stops at once. If Supabase's own sign-up were switched on, an outsider could get a pass (it opens no family's rows, but it is one lock fewer). Whoever holds the secret could make a pass for any parent.
- **Workaround:** [2026-11-15 21:59 SGT] Don't revoke the legacy secret; keep Supabase sign-up and anonymous sign-ins off; the secret lives only in Vercel. Backlog: our own signing key.

### [2026-11-15 21:59 SGT] (d) The sign-up's last message still links to the old placeholder page
- **Issue:** [2026-11-15 21:59 SGT] At the end of sign-up the bot says "Your page is here…" with a button to the old, empty `my-page.html`, not the new sign-in (spec checker of #52).
- **Impact:** [2026-11-15 21:59 SGT] Low: a new parent sees an empty page; `/mypage` works correctly.
- **Workaround:** [2026-11-15 21:59 SGT] Use `/mypage`. Fix when the sign-up's words are next changed (a 5-minute link there would expire before most parents tap it, so the wording needs the owner's choice).

### [2026-11-15 11:29 SGT] The Terms & Conditions page is empty
- **Update:** [2026-11-15 12:13 SGT] Owner (15 Nov): **parked**, also in the backlog; not to be raised again until the owner brings it up. Still true: no real family signs up until it is filled in.
- **Issue:** [2026-11-15 11:29 SGT] The agreement (sign-up screen 9) now links to a Terms & Conditions page (rule 5.15), but the page says only its title (public/terms.html).
- **Impact:** [2026-11-15 11:29 SGT] A real family would be agreeing to terms that aren't written yet (a PDPA reviewer would stop this).
- **Workaround:** [2026-11-15 11:29 SGT] The owner fills in the page before any real family signs up (owner, 15 Nov); until then only test accounts sign up.

### [2026-11-14 22:24 SGT] This week's logs read newest first, an older week's oldest first
- **Issue:** [2026-11-14 22:24 SGT] Week so far lists this week's log rows newest first (rule 9.4); an older week's page reads day by day, oldest first (rule 9.7). The owner said "leave it for now".
- **Impact:** [2026-11-14 22:24 SGT] Low: a parent may notice the two pages read in opposite directions.
- **Workaround:** [2026-11-14 22:24 SGT] Build as designed; revisit after UAT.

### [2026-11-14 14:20 SGT] Failure logs name the parent's internal number
- **Issue:** [2026-11-14 14:20 SGT] When the alarm run fails for one parent, Vercel's log line names that parent's internal database number (for example "Nudge not sent to parent 12"). It is not a Telegram ID or a name, but it points to one person (privacy review of B1; the lines date from pull request 3c, `src/telegram-bot/scheduler.ts`).
- **Impact:** [2026-11-14 14:20 SGT] Low: only someone with Vercel access and database access could link it to a person. A PDPA reviewer may still ask.
- **Workaround:** [2026-11-14 14:20 SGT] Owner's choice (14 Nov): leave it for now. Later options: drop the number, or log a short one-way code instead.

### [2026-11-13 23:34 SGT] The alarm run handles about 50 parents
- **Issue:** [2026-11-13 23:34 SGT] Each 10-minute run reads every parent's last 14 days in one answer per table. Supabase answers at most about 1,000 rows, so past roughly 50 active parents the run stops with an error rather than plan from missing data (rule 1.3; pull request 3c review).
- **Impact:** [2026-11-13 23:34 SGT] None for the trial (a handful of families). Before alpha, nudges would stop until the design changes.
- **Workaround:** [2026-11-13 23:34 SGT] The design for 1,000 to 5,000 parents is in `docs/PRODUCT-BACKLOG.md` (only parents whose slot is now, pages of about 200, sending spread over the slot). Vercel's Logs show the error if it ever happens.

### [2026-11-13 22:38 SGT] The sign-up reminder goes to someone who has not agreed yet
- **Issue:** [2026-11-13 22:38 SGT] Someone who stops part-way through sign-up gets one "You're almost there!" message 24 hours later, before they have tapped "I agree" (rule 8.13, Q11b, migration 009). The only way to avoid it is to finish, or delete the draft.
- **Impact:** [2026-11-13 22:38 SGT] Low for the trial (invite-only, a few known parents); a PDPA reviewer may ask about messaging people before consent.
- **Workaround:** [2026-11-13 22:38 SGT] Owner's choice: pull request 3c adds to the `/start` notice that we may send one reminder to finish. Take it to the owner's PDPA reviewer with the "draft before agreement" item below.

### [2026-11-13 22:38 SGT] "Never two reminders at once" is not tested
- **Issue:** [2026-11-13 22:38 SGT] Two alarm runs at the same moment can't both take the same person's reminder: the database locks the rows it takes (`for update skip locked`, migration 009). The database tests run one claim after another, so this protection is in the code but no test proves it (spec review, 13 Nov).
- **Impact:** [2026-11-13 22:38 SGT] Low: at worst, someone gets two identical reminders in the same minute.
- **Workaround:** [2026-11-13 22:38 SGT] Accepted by the owner (13 Nov). A real test needs two database connections at once, which our test set-up doesn't have.

### [2026-11-12 23:16 SGT] The /start line mentions 7 days, not the 90-day record (K1)
- **Issue:** [2026-11-12 23:16 SGT] After 7 quiet days a sign-up draft is cut down, but its Telegram ID and last step are kept for 90 days (rule 8.13, Q11d). The `/start` line only says "We'll keep your answers for 7 days… Nothing is saved for good until you agree." (privacy review of pull request 2, Medium).
- **Impact:** [2026-11-12 23:16 SGT] Low for the trial; people are not told about the 90-day record.
- **Workaround:** [2026-11-12 23:16 SGT] Owner decided (12 Nov): take it to the PDPA reviewer together with the agreement wording (Q8), which stays a placeholder for now.

### [2026-11-12 23:16 SGT] "7 days" can be about 8, and a failed clean-up is not retried (K2)
- **Issue:** [2026-11-12 23:16 SGT] Until pull request 3, the sign-up clean-up runs once a day with the 7:00 pm job (decision D4), so a draft can last up to about 8 days; if the clean-up fails, the failure is only logged (privacy review of pull request 2, Medium).
- **Impact:** [2026-11-12 23:16 SGT] Low; the 7-day promise can slip by a day, or longer if the clean-up keeps failing unnoticed.
- **Workaround:** [2026-11-12 23:16 SGT] Pull request 3 moves the clean-up to Supabase Cron (every 30 minutes), which also retries it at the next run. Until then, the owner can check Vercel's logs for "The sign-up clean-up failed".

### [2026-11-12 23:16 SGT] No "delete my data" for someone halfway through sign-up (K3)
- **Issue:** [2026-11-12 23:16 SGT] The database function `delete_sign_up_draft` exists (migration 007), but nothing in the bot calls it yet, so a person part-way through sign-up can't delete the children's names they typed (rule 1.5; privacy review of pull request 2, Medium).
- **Impact:** [2026-11-12 23:16 SGT] Low for the trial; their draft is cut down after 7 days anyway (K2).
- **Workaround:** [2026-11-12 23:16 SGT] Comes with the Menu (`/delete` or Settings, rule 5.7). Until then, the owner can delete a draft in Supabase on request.

### [2026-11-12 23:16 SGT] Sign-up steps are kept in order only by the bot's code (K5)
- **Issue:** [2026-11-12 23:16 SGT] The database doesn't check that sign-up steps happen in order, and `finish_sign_up` doesn't check the step is "agreement"; only `onboarding.ts` stops the agreement being skipped. Two taps handled at the very same moment can also overwrite each other's saved answers (privacy review of pull request 2, Low).
- **Impact:** [2026-11-12 23:16 SGT] Low: forged taps are refused by the webhook secret (rule 5.9), the Telegram ID comes from Telegram itself, and `finish_sign_up` still checks the answers are complete (rules 2.1, 3.1, Q7b).
- **Workaround:** [2026-11-12 23:16 SGT] None needed for the trial. A later migration could make `finish_sign_up` require the agreement step.

### [2026-11-12 22:27 SGT] A sign-up draft holds personal data before the agreement
- **Issue:** [2026-11-12 22:27 SGT] While someone signs up, their first name, children's names and picks are held in a draft for up to 7 days before they tap "I agree" (rule 8.13, migration 007). Singapore's Personal Data Protection Act (PDPA) normally expects consent at or before collection (privacy review of migration 007, finding P1, High; owner decided 12 Nov).
- **Impact:** [2026-11-12 22:27 SGT] Low for the trial (invite-only, a few known parents); matters before real families join.
- **Workaround:** [2026-11-12 22:27 SGT] Owner's choice (a): the first message at `/start` says "We'll keep your answers for 7 days while you set up. Nothing is saved for good until you agree." Take the wording and the 7 days to the owner's PDPA reviewer.
### [2026-11-12 22:27 SGT] Many accounts could each hold an invite for 7 days
- **Issue:** [2026-11-12 22:27 SGT] Each Telegram account holds at most one code, but many accounts (or bots) with forwarded links could each hold one for 7 days; there is no cap on holds (privacy review of migration 007, finding P8; owner agreed to log it, 12 Nov).
- **Impact:** [2026-11-12 22:27 SGT] Low: the trial is invite-only and small; the owner can see holds in Supabase.
- **Workaround:** [2026-11-12 22:27 SGT] Watch `invites.held_by_telegram_id` during the trial; add a cap before a wider launch.
### [2026-11-12 22:27 SGT] Two child inserts at the same instant could pass the limit of 3
- **Issue:** [2026-11-12 22:27 SGT] The "up to 3 children" check counts existing children before each insert, so two inserts at the same moment could both pass (privacy review of migration 007, finding P9; owner agreed to log it, 12 Nov).
- **Impact:** [2026-11-12 22:27 SGT] Very low: children are added one at a time, in sign-up and later in Settings.
- **Workaround:** [2026-11-12 22:27 SGT] If it matters later, lock the parent's row while adding a child.
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
- **Status:** [2026-11-24 22:57 SGT] The agreed mitigations are built and tested (W9): other prompts win; keyboard buttons, commands and forwarded messages are never a moment; the window closes after one photo and one line, or at the next Wrap Up. The 24-hour length itself stays; review it after the trial.
- **Issue:** [2026-11-09 21:49 SGT] After "Add a moment", the bot waits 24 hours for a photo or line (B2 handoff, D-e). A later, unrelated message could be saved as a moment. This widens the 9 Nov finding "ignore this to skip has no time limit" (privacy review of the typed-text design, 9 Nov; owner agreed to log it, handoff of 9 Nov section 4a item 6).
- **Impact:** [2026-11-09 21:49 SGT] Low to medium: an unrelated, possibly private message would show in the album. Moments are not sent to Claude.
- **Workaround:** [2026-11-09 21:49 SGT] The agreed mitigations, each with a test at build time: other prompts win; keyboard labels, commands and button taps are never saved as moments; the window closes after one photo and one line, or at the next Wrap Up. Review the window length after the trial.

### [2026-11-09 21:49 SGT] No cap on Claude matching calls per parent
- **Update:** [2026-11-15 12:13 SGT] Owner decided (15 Nov): **20 matching calls per parent per day** (a Guardrail for `src/settings.ts`); after that the bot asks for a keyboard tap. Stays open until built and tested.
- **Issue:** [2026-11-09 21:49 SGT] Every typed message that is a log attempt calls Claude (B1 part 3 handoff, open question). There is no daily cap per parent.
- **Impact:** [2026-11-09 21:49 SGT] None yet (not built). Cost and abuse risk once live.
- **Workaround:** [2026-11-09 21:49 SGT] Design a cap with a starting number in `src/settings.ts` (rule 1.4) before building typed messages.

### [2026-11-09 17:50 SGT] Telegram keeps the chat history outside Singapore
- **Issue:** [2026-11-12 23:16 SGT] (K4, privacy review of pull request 2) Children's names are now also in the bot's own messages: the greeting on screen 4, the taking-turns note on screen 3 and Start right now on screen 10. Same workaround: the PDPA note.
- **Issue:** [2026-11-09 17:50 SGT] Keyboard taps and messages leave behaviour names (and possibly children's names) in Telegram's own chat history, stored outside Singapore and beyond the reach of "delete my data" (privacy review of the B1 daily loop design, 9 Nov; owner agreed to log it on 9 Nov).
- **Impact:** [2026-11-09 17:50 SGT] Low. Parents may assume "delete my data" removes everything.
- **Workaround:** [2026-11-09 17:50 SGT] Owner decided (9 Nov): mention it in the PDPA (Personal Data Protection Act) note for parents and the owner's PDPA reviewer (the note is not written yet).

### [2026-11-08 22:34 SGT] A child's name reaches more places than the database
- [2026-11-12 22:17 SGT] Progress: migration 007 adds the name column and keeps it out of the Telemetry view of children, with a test (T76). Still open: the chat memory and the Telegram chat (not built yet).
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
- [2026-11-12 22:27 SGT] Wider since migration 007 (review finding P3): the same server role can also read `sign_up_drafts.answers` and `children.first_name` (children's names). Telemetry's own role must not be able to read either.
- **Issue:** [2026-11-01 16:32 SGT] Rule 8.11: the Telemetry views hide names, Telegram IDs, descriptions and photo links, but Telemetry currently reads through our server's role, which can also read the full tables (privacy review of the Datastore build; owner agreed to log it).
- **Impact:** [2026-11-01 16:32 SGT] Low now (nothing reads Telemetry yet). If Telemetry code queried the full tables, the database would not stop it.
- **Workaround:** [2026-11-01 16:32 SGT] When building Telemetry, give it its own database role that can read only the `telemetry_` views, with a test.

### [2026-11-01 16:32 SGT] Migration 001 repeats a number from settings.ts
- **Issue:** [2026-11-01 16:32 SGT] `001_create_nudge_repository.sql` repeats "at least 3 examples per nudge" (`MIN_EXAMPLES_PER_NUDGE`) and its comment points to the old path `shared/settings.ts` (spec review). Applied migrations can't be edited (rule B1).
- **Impact:** [2026-11-01 16:32 SGT] If the number changes in `src/settings.ts`, the database keeps the old one until a new migration changes it.
- **Workaround:** [2026-11-01 16:32 SGT] Change both together, as the comment in `src/settings.ts` already says; a future migration can move the check into code if wanted.

### [2026-11-01 09:56 SGT] The database doesn't block the same example twice for one nudge
- **Issue:** [2026-11-01 09:56 SGT] The examples table has no database rule against the same example text appearing twice for one nudge. Only the content scripts check for this before adding rows (low note from the PR A review, #12; owner agreed to log it).
- **Impact:** [2026-11-01 09:56 SGT] If the owner adds an example by hand in the Supabase dashboard that already exists, a parent could see the same idea twice before all examples are used (rule 3.13 rotation would treat them as two examples).
- **Workaround:** [2026-11-01 09:56 SGT] Check the list before adding by hand, or add examples through a content script. Option later: a database "unique" rule on nudge plus text (ask the owner first; it is a migration).

## Resolved

### [2026-11-26 22:38 SGT] DEF-1: a 3rd quick tick in Settings says "✅ Saved." instead of "Choose up to 2 quick behaviours." (UAT U87, FAIL)
- [2026-11-26 23:15 SGT] **Resolved** in the Settings fixes pull request (rule 9.9): DEF-1 fixed: the other quick boxes grey out once 2 are ticked, and the server still refuses a 3rd (tests SE18, SE19, SB1).
- **Issue:** [2026-11-26 22:38 SGT] On Behaviours, three quick boxes could be ticked; Save showed "✅ Saved." and Telegram "✅ Your habits are updated.", and the stored behaviours stayed as before. The server's own check does refuse three (`src/web-app/settings-page.ts` line 310, test SE5 passes), so the third tick most likely never reached the server: the save that arrived held the old two. **Cause not found yet**; to reproduce in a real browser (Playwright, already installed) before fixing.
- **Impact:** [2026-11-26 22:38 SGT] No wrong data is saved, but the parent is told "Saved." when their choice was not saved (rule 1.3 spirit: never a misleading success).
- **Workaround:** [2026-11-26 22:38 SGT] None; to fix (owner, 26 Nov: "fix them here"). The page could also stop a 3rd tick in the browser, which needs no new library.

### [2026-11-26 22:38 SGT] DEF-2: "✅ Your habits are updated." is sent after a Behaviours save that changes nothing (seen in UAT U98)
- [2026-11-26 23:15 SGT] **Resolved** in the Settings fixes pull request (rule 9.9): DEF-2 fixed: a Behaviours save with the same picks sends nothing to the database or Telegram (test SE24).
- **Issue:** [2026-11-26 22:38 SGT] `settingsSave` in `src/web-app/handler.ts` tells Telegram after **every** Behaviours save, without checking whether the picks changed. Seen 4 times at 21:39 to 21:40 and twice for one change (22:02 and 22:04, most likely two saves). The run also reported it after Wrap Up saves; the code sends it only for Behaviours, so that report still needs checking.
- **Impact:** [2026-11-26 22:38 SGT] Extra bot messages; a parent may think something changed when it didn't.
- **Workaround:** [2026-11-26 22:38 SGT] None; to fix: tell Telegram only when the saved picks differ from the ones before.

### [2026-11-26 22:38 SGT] DEF-3: repeated taps on the pause switch send one Telegram message per tap (UAT U90)
- [2026-11-26 23:15 SGT] **Resolved** in the Settings fixes pull request (rule 9.9): DEF-3 fixed: the switch ignores repeat taps, and a pause that is already so sends nothing (tests SE25, SB2).
- **Issue:** [2026-11-26 22:38 SGT] The pause page's switch is a form button that sends the value the page was drawn with (`src/web-app/settings-page.ts` lines 193 to 195). Tapping it several times before the page reloads sends "pause" again each time, and `settingsSave` tells Telegram every time, even when nothing changed. 17 messages arrived in one minute (16 "paused", 1 "back on").
- **Impact:** [2026-11-26 22:38 SGT] A burst of bot messages; Telegram may slow the bot down if it sends too many too fast.
- **Workaround:** [2026-11-26 22:38 SGT] None; to fix: tell Telegram only when the pause state actually changes (the same fix as DEF-2), and possibly make the switch ignore a second tap until the page reloads.

### [2026-11-26 22:38 SGT] A child can't be removed in Settings (UAT U86)
- [2026-11-26 23:15 SGT] **Resolved** in the Settings fixes pull request (rule 9.9): Fixed: a 🗑 beside each name asks first, then removes the child and every earlier name (migration 018, applied; tests SE20 to SE22, T147 to T150).
- **Issue:** [2026-11-26 22:38 SGT] Rule 9.9 says "removing is not designed yet"; emptying a child's box gives "Each child needs a name." The UAT run left a test child, "UAT Child", on the owner's account.
- **Impact:** [2026-11-26 22:38 SGT] The owner's real account names a child who doesn't exist, in messages that take turns naming children (rule 3.16) and on My page. A parent who adds a child by mistake can't undo it.
- **Workaround:** [2026-11-26 22:38 SGT] Claude Code can remove "UAT Child" in Supabase with the owner's approval; designing "remove a child" goes to the backlog.


[2026-11-25 23:20 SGT] Three entries resolved by Settings (25 Nov) were moved word for word to [docs/archive/KNOWN-ISSUES-resolved-to-2026-11-25.md](archive/KNOWN-ISSUES-resolved-to-2026-11-25.md) (owner approved).

[2026-11-24 23:13 SGT] Resolved entries up to 24 Nov were moved word for word to [docs/archive/KNOWN-ISSUES-resolved-to-2026-11-24.md](archive/KNOWN-ISSUES-resolved-to-2026-11-24.md) (owner approved). Earlier ones are in [docs/archive/KNOWN-ISSUES-resolved-to-2026-11-12.md](archive/KNOWN-ISSUES-resolved-to-2026-11-12.md).
