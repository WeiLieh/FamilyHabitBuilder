# UAT: B1, log any time (keyboard, /log, Undo, the Menu)

[2026-11-14 14:06 SGT] What it is: the owner's go-live steps and checks for B1 on the **live** bot. UAT means user acceptance testing: you try it yourself, as a parent would, and tick each case. Scope and rules: [src/telegram-bot/SPEC.md](SPEC.md), "Build: B1" (decisions B1-D1 to B1-D10) and rules 5.1, 5.7, 5.8 and 5.10.

**Before you start:** pull request #45 (the planner) is merged and live (G1 to G5 in [UAT-planner.md](UAT-planner.md)). B1 is built on top of it.

**Never paste a secret** (bot token, Supabase key) into chat, Git or a document.

## Go-live steps
- [ ] **S1. Migration 010.** Supabase > SQL Editor > a fresh tab > paste `src/datastore/supabase/migrations/010_telegram_message_numbers.sql` > Run. Then run this check and tell Claude Code the result, so the fingerprint is recorded (rule B1):
  ```sql
  select
    (select count(*) from information_schema.columns where table_name = 'messages_sent' and column_name = 'telegram_message_id') as nudge_number,
    (select count(*) from information_schema.columns where table_name = 'sign_up_drafts' and column_name = 'screen_message_id') as screen_number,
    (select count(*) from pg_proc where proname = 'record_message_sent') as record_functions,
    has_function_privilege('service_role', 'public.record_sign_up_screen(bigint, bigint)', 'execute') as server_can,
    has_function_privilege('anon', 'public.record_sign_up_screen(bigint, bigint)', 'execute') as outsiders_can;
  ```
  Expected: `1 | 1 | 1 | true | false`.
- [ ] **S2.** Merge B1's pull request. Vercel deploys `main` by itself; wait until it shows "Ready".
- [ ] **S3. Everyone's default Menu, once.** In Telegram, open **@BotFather**, send `/setcommands`, choose your bot, then paste these five lines as one message:
  ```
  log - Log a behaviour for today
  mypage - Your page
  settings - Your times and habits
  pause - Pause your reminders
  help - How this works
  ```
  (These are the drafts in `src/telegram-bot/words.ts`; a test checks the two stay the same.)
- [ ] **S4.** Close and reopen the chat with the bot: the **Menu** button next to the typing box shows the five commands.

[2026-11-14 15:32 SGT] **Results, 14 Nov (owner):** S1 **done** (migration 010 applied; check `1 | 1 | 1 | true | false`, fingerprint recorded). S2 **done** (#47 merged; Vercel Production "Ready"). Also on 14 Nov: the planner's go-live G1 to G5 and U29 **pass** (alarm runs at 3:00, 3:10, 3:20 pm, each answered 200; see [UAT-planner.md](UAT-planner.md)). Still to do: S3, S4, U40 to U55.

[2026-11-14 15:59 SGT] **Results, 14 Nov afternoon (owner):** S3 and S4 **done** (the Menu shows the five commands). The owner's thin-slice account (parent 1, no habits) was deleted with `delete_my_data` (test data only) and signed up again with a fresh code, so it has habits; on the old account `/help` showed no keyboard and `/log` said "You haven't chosen any habits yet…", as designed (note for the readability work: the help text still says "keyboard below"). **Pass:** U54 (the earlier copy lost its buttons), U55 (the keyboard: Showing affection, Talking with children), U42 ("again today", because Start right now had logged Showing affection), U43 (Undo within 10 minutes), U47 and U48 (/log, no Undo), U49 (all three links open the right page), U50, U51. **Still to run:** U40 and U41 on a day with nothing logged yet, U44 (late Undo), U45 (tonight's 7:00 pm reminder), U46, U52 and U53 (optional, need a paused account).

[2026-11-14 21:40 SGT] **Results, 14 Nov evening (owner):** U44 **pass** (logged 5:05 pm, Undo tapped 5:19 pm: pop-up "Undo expired.", the button gone). U45 not yet: ✅ Done was tapped on the 7:00 pm reminder (that is planner U31); next time tap the keyboard. Still to run: U40, U41 (a morning with nothing logged yet), U45, U46; optional U52, U53.

## Test cases
Use your test account (it has picks, times and a child's name). An account that signed up before B1 has no keyboard yet: send `/help` to get it (U40).

| ID | Do this | You should see | Where to check | Pass |
|---|---|---|---|---|
| U40 | Send `/help` | The help text, and the **keyboard** under the chat: one "✅ <behaviour>" button per behaviour you picked, in the order you picked them | Telegram | [ ] |
| U41 | Tap a keyboard button when no reminder is waiting | Your tap shows as "✅ <behaviour>"; the bot replies "✅ Saved: <behaviour> today." with **Undo** | Telegram; `select logged_via, from_message_id from habit_logs order by id desc limit 1;` shows `keyboard`, empty | [ ] |
| U42 | Tap the same button again | "✅ Saved: <behaviour>, again today. It counts once for your week." with **Undo** | Telegram | [ ] |
| U43 | Within 10 minutes, tap **Undo** on one receipt | The Undo button goes; "Undone. It won't count." | Telegram; that row's `undone_at` is filled | [ ] |
| U44 | Wait more than 10 minutes, then tap **Undo** on the other receipt | The button disappears; a pop-up "Undo expired."; nothing is undone | Telegram; `undone_at` still empty | [ ] |
| U45 | When a reminder arrives, tap that behaviour on the keyboard instead of ✅ Done | The reminder keeps its words and **loses its buttons**; the receipt arrives below with Undo | Telegram; the new log's `from_message_id` is the nudge's number in `messages_sent` | [ ] |
| U46 | Tap 😴 Not today on a reminder, then tap a behaviour on the keyboard | The receipt arrives as normal (logging still works after Not today) | Telegram | [ ] |
| U47 | Send `/log` | "Which one did you do today?" with one button per behaviour you picked | Telegram | [ ] |
| U48 | Tap one of them | The /log message loses its buttons; "✅ Saved: <behaviour> today." **without** Undo | Telegram; `logged_via` is `log_command` | [ ] |
| U49 | Send `/mypage`, then `/settings`, then `/pause` | Each replies with a link button; the first opens "My Page", the other two "Settings" (placeholder pages) | Telegram, then the browser | [ ] |
| U50 | Type `Help` (no slash, a capital H), then `/log hug` | The help text; then "Unrecognised text." | Telegram | [ ] |
| U51 | Send `/resume` (you are not paused) | "Your reminders are already on." | Telegram | [ ] |
| U52 | (Optional, with Claude's help in Supabase) pause the test account, then send `/pause` | "Your reminders are already paused." and, after reopening the chat, the Menu shows **/resume** instead of /pause | Telegram | [ ] |
| U53 | (Paused) send `/resume`, tap **✅ Resume** | "✅ Your reminders are back on."; the Menu shows /pause again | Telegram; `parents.paused` is false | [ ] |
| U54 | With a fresh invite code and another account, start sign-up, stop on the children screen, then open your invite link again | The earlier "Any other children?" message **loses its buttons**, then "Welcome back! Let's carry on." and the screen again, with buttons | Telegram | [ ] |
| U55 | Finish that sign-up | "You're all set …" brings the keyboard with that account's behaviours | Telegram | [ ] |
