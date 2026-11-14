# UAT: onboarding screens (pull request 2 of 3)

[2026-11-12 23:16 SGT] What it is: the owner's step-by-step checks of the new sign-up on the **live** bot, after pull request 2 is merged and Vercel has deployed it. UAT means user acceptance testing: you try it yourself, as a parent would, and tick each case. Thin slice 1's checks are in [UAT-thin-slice-1.md](UAT-thin-slice-1.md).

[2026-11-14 10:31 SGT] **Results, 14 Nov morning (owner, with Claude Code step by step):** S1 to S4 done (invite code made for this run; a second Telegram account, with its holder's agreement, renamed "Test Parent" in U18; made-up children's names). U17 to U27 **pass**. U21 was run on screen 6 (the owner had already skipped screen 5); U22 used **Skip for now**; U24 used the old screen 6 **OK** (screen 4's buttons had already gone): a spinner, then nothing. U27 query: one parent, signed up 14 Nov, not paused, 2 children, TWC and SAF every 2 days, 6 slots, 1 log, 0 drafts left. **S5 done:** migration 008 applied (and 009 straight after). Two small observations for the owner to file: after "Welcome back", the old copy of the screen keeps its button (harmless, untidy); the "You can pick up to 2." pop-up is a box with OK, not a fading banner. U28 (optional) not run.

[2026-11-14 10:37 SGT] **Owner's decisions on the results:** U28 skipped (not needed; covered by the automated tests). Fix the leftover buttons after "Welcome back" (Telegram bot spec, 10e addition). Keep the "pick up to 2" pop-up box as it is.

## Setup
- [2026-11-12 23:16 SGT] **S1.** Merge the pull request. Vercel deploys `main` by itself; wait until the deployment shows "Ready".
- [2026-11-12 23:16 SGT] **S2.** In Supabase (Table Editor > `invites` > Insert row), add a new invite with a random code you make up, for example `UAT-7F3K`. Never reuse a code from these notes.
- [2026-11-12 23:16 SGT] **S3.** Your own Telegram account is already signed up, so `/start` only says "You're already signed up." Choose one: **(a, recommended)** a second Telegram account on another phone, used only by you; or **(b)** ask Claude for a script that removes your test parent and everything linked to it, and run it yourself (it deletes data, so it needs your go-ahead).
- [2026-11-12 23:16 SGT] **S4.** Open `t.me/<your bot>?start=<your code>` with the account from S3. Use a made-up child's name (for example "Mia"), not a real child's.
- [2026-11-12 23:16 SGT] **S5.** After U27: run migration 008 (`src/datastore/supabase/migrations/008_remove_thin_slice_sign_up.sql`) in a fresh SQL Editor tab, with nothing highlighted, then tell Claude so its fingerprint is recorded (rule B1).

## Test cases
- [2026-11-12 23:16 SGT] **U17.** `/start` with the code: "Thanks for joining, …!" with the 7-day line and **Change name**, then "What's your child's name? …".
- [2026-11-12 23:16 SGT] **U18.** Tap **Change name**, type a new name: "Thanks, <name>!" and the child question again.
- [2026-11-12 23:16 SGT] **U19.** Type a child's name, tap **+ Add another child**, type a second: "Mia and Leo. Any other children?"; tap **That's all**: the "take turns" message, then "Nice to meet you, <name>!".
- [2026-11-12 23:16 SGT] **U20.** Screen 4: tap two quick behaviours (✓ appears in place), try a third ("You can pick up to 2." pop-up), tap **Next**.
- [2026-11-12 23:16 SGT] **U21.** Halfway (say on screen 5), open your invite link again: "Welcome back! Let's carry on." and the same screen.
- [2026-11-12 23:16 SGT] **U22.** Screen 5: pick one or **Skip for now**; screens 6 and 7: **OK** each, with "You can change these anytime in Settings."
- [2026-11-12 23:16 SGT] **U23.** Screen 8: "From what you chose, your reminders are:" with your picks, the Sunday 8:00 pm line, one **OK**.
- [2026-11-12 23:16 SGT] **U24.** Tap an old button higher up the chat (say **Next** on screen 4): nothing changes.
- [2026-11-12 23:16 SGT] **U25.** **✅ I agree**: "✅ You agreed." is added, then "Start right now…" with your first quick behaviour and first child's name.
- [2026-11-12 23:16 SGT] **U26.** **✅ I've started!**: its buttons go, then "✅ Saved: … today.", "You're all set, <name>. Your next reminder is today at 7:00 pm." (or "tomorrow" after 7 pm) and "Open my page ↗", which opens the page titled **My Page**.
- [2026-11-12 23:16 SGT] **U27.** In Supabase: `parents` has the new parent, `children` your child names, `picks` and `slots` filled in, and `sign_up_drafts` has no row for that account.
- [2026-11-12 23:16 SGT] **U28.** (Optional, a fresh code and account) Tap **Not now** on screen 10: "No problem. Your first reminder is …", then "You're all set…" without a receipt.
- [2026-11-12 23:16 SGT] **Known until pull request 3:** the 7:00 pm reminder is still "Showing affection", whatever you picked.
