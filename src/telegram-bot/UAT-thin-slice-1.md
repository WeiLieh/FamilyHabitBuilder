# UAT: thin slice 1 of the Telegram bot

[2026-11-11 18:40 SGT] **User Acceptance Testing (UAT)** checklist for the owner: you set the bot up once, then check on your own phone that it behaves as agreed. Scope and rules: [src/telegram-bot/SPEC.md](SPEC.md), "Build: thin slice 1". Tick each box; if a result differs, note what you saw and tell Claude Code (a failure is reported, never worked around).

The automated tests (161, run on every pull request) already check the logic with a pretend Telegram and database. UAT checks what they can't: the real Telegram, Vercel and Supabase working together.

**Never paste a secret** (bot token, webhook secret, cron secret, Supabase server key) into chat, Git or a document. They go only into Vercel's settings (and your password manager).

---

## Part 1: one-time setup (about 20 minutes)

- [ ] **S1. Merge the pull request** for thin slice 1 into `main`.
- [ ] **S2. Run migration 006 in Supabase.** SQL Editor > paste `src/datastore/supabase/migrations/006_sign_up.sql` > Run ("No rows returned" is normal). Then run this check and send Claude Code the result (it should show `true` for both):
  ```sql
  select has_function_privilege('service_role', 'public.sign_up(bigint, text, text, text, integer, bigint, bigint, jsonb)', 'execute') as server_can_sign_up,
         not has_function_privilege('anon', 'public.sign_up(bigint, text, text, text, integer, bigint, bigint, jsonb)', 'execute') as outsiders_cannot;
  ```
- [ ] **S3. Create the bot in Telegram.** Open Telegram, search **@BotFather** (blue tick), send `/newbot`, give a name (e.g. "Family Habit Builder (test)") and a username ending in `bot`. BotFather replies with a **token**: copy it into your password manager. Note the bot's username.
- [ ] **S4. Make two secrets** in your password manager's generator: a **webhook secret** and a **cron secret**, each about 40 characters, letters and numbers only.
- [ ] **S5. Find two Supabase values:** Project Settings > API: the **Project URL** and the **service_role** key (secret: it can do anything in the database).
- [ ] **S6. Add your invite code** in Supabase, SQL Editor:
  ```sql
  insert into public.invites (code) values ('OWNER-1');
  ```
- [ ] **S7. Create the Vercel project.** Vercel > Add New > Project > import `WeiLieh/FamilyHabitBuilder` > Framework preset: **Other**. Under **Environment Variables** add five, names exactly as in `.env.example`:
  `TELEGRAM_BOT_TOKEN` (S3), `TELEGRAM_WEBHOOK_SECRET` (S4), `CRON_SECRET` (S4), `SUPABASE_URL` (S5), `SUPABASE_SERVICE_ROLE_KEY` (S5). Then **Deploy**.
- [ ] **S8. Tell Telegram where the bot lives.** In your browser's address bar, with your values in place of the `<…>` parts:
  `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-project>.vercel.app/api/telegram-bot&secret_token=<WEBHOOK_SECRET>`
  Expected: `{"ok":true,"result":true,"description":"Webhook was set"}`. (Afterwards, clear that address from your browser history: it contains the token.)

---

## Part 2: test cases

| ID | Do this | You should see | Where to check | Pass |
|---|---|---|---|---|
| U1 | Open `https://<your-project>.vercel.app/api/health` | `{"ok":true,"service":"family-habit-builder"}` | Browser | [ ] |
| U2 | Open `https://<your-project>.vercel.app/api/telegram-bot` in a browser | `{"ok":false}`: a stranger can't start the daily nudge | Browser | [ ] |
| U3 | Open `https://t.me/<bot username>?start=WRONG-CODE` and tap **Start** | "Sorry, that invite code doesn't work. Please check your invite link." | Telegram; `select * from parents;` shows no row | [ ] |
| U4 | Type `hello` to the bot | "Unrecognised text." | Telegram | [ ] |
| U5 | Open `https://t.me/<bot username>?start=OWNER-1` and tap **Start** (or send `/start OWNER-1`) | "Thanks for joining, <your Telegram first name>!" then the agreement with one button **✅ I agree** | Telegram; `select first_name, cohort, paused from parents;` shows you, `cohort-1`, `false`; `select used_by from invites where code = 'OWNER-1';` is filled | [ ] |
| U6 | Send `/start OWNER-1` again | "You're already signed up." and no second row in `parents` | Telegram; Supabase | [ ] |
| U7 | Tap **✅ I agree** | The button disappears and "✅ You agreed." is added; then "You're all set. Your reminder comes every day at 7:00 pm." | Telegram; `select topic, answer from consents;` shows `recording`, `agreed` | [ ] |
| U8 | Wait until 7:00 pm, or run it now: Vercel > your project > Settings > **Cron Jobs** > **Run** | "Showing affection", an idea, and buttons **✅ Done** and **😴 Not today** | Telegram; `select kind, for_day, slot_minute from messages_sent;` shows `nudge`, today, `1140` | [ ] |
| U9 | Run the cron job again the same evening | No second message | Telegram; still one row in `messages_sent` for today | [ ] |
| U10 | Tap **✅ Done** | The nudge turns into "✅ Saved: Showing affection today." and its buttons go | Telegram; `select for_day, logged_via from habit_logs;` shows today, `done_button` | [ ] |
| U11 | Next day: on the new nudge, tap **😴 Not today** | The nudge turns into "😴 Not today. That's completely fine. No more reminders from us today. We'll be back tomorrow." | Telegram; no new row in `habit_logs` | [ ] |
| U12 | Leave one day's nudge untapped; after midnight, tap its **✅ Done** | A pop-up: "Reminder has expired. Tap a behaviour on the keyboard to log today." Nothing saved | Telegram; no new row in `habit_logs` | [ ] |
| U13 | Pause yourself: `update parents set paused = true;` then run the cron job (as U8) on a day you haven't had a nudge | No message. Then undo it: `update parents set paused = false;` | Telegram | [ ] |
| U14 | Note how long the bot takes to answer the first message after a quiet hour (a "cold start") | Under about 3 seconds is fine; tell Claude Code if it is slower | Your phone | [ ] |

**Expected gaps in this slice** (not failures): no child's name, no choice of behaviour or time, no keyboard, no Undo, no photos, no Claude replies, no Wrap Up; typed text always gets "Unrecognised text.".
