# UAT: Settings (U84 to U98)

[2026-11-25 22:32 SGT] The owner's go-live steps and phone tests for My page's Settings tab (rule 9.9) and pausing both ways (rule 5.7). Tick each box as it passes.

[2026-11-26 22:38 SGT] **Results, 26 Nov evening:** Run by Claude in Telegram Web on the owner's computer ([docs/UAT-RUNBOOK.md](../../docs/UAT-RUNBOOK.md)), 26 Nov 21:25 to 22:32 SGT; the owner tapped every My page step. Defects DEF-1 to DEF-4 are in [docs/KNOWN-ISSUES.md](../../docs/KNOWN-ISSUES.md). **Pass:** U84, U85, U88, U89, U90 to U96, U98. **Fail:** U87 (a 3rd quick tick said "✅ Saved." and nothing changed; DEF-1). **Partly:** U86 (a child was added; there was no 3rd child to check the box going, and a child can't be removed: not designed yet, rule 9.9). **Not run:** U97 (no test account). Found while testing: "✅ Your habits are updated." also after a save that changes nothing (DEF-2, seen in U98); repeated taps on the pause switch sent 17 Telegram messages in one minute (DEF-3, seen in U90). By design: Reminder times saves on each Add or Remove, so it has no Save button (rule 9.9). Go-live G1 to G4 were done on 25 Nov (migrations 016 and 017 applied, #64 to #66 merged).

## Go-live (once)
| Step | Do this | Expect | Result |
|---|---|---|---|
| G1 | Supabase > SQL Editor: paste `src/datastore/supabase/migrations/016_web_settings.sql` > Run, **after** merging the Datastore pull request | "Success. No rows returned" | [ ] |
| G2 | Nothing to add in Vercel: the Web app now also uses `TELEGRAM_BOT_TOKEN`, which is already set for the bot in the same project. Check it is listed under Settings > Environment Variables | It is there | [ ] |
| G4 | [2026-11-25 22:43 SGT] Supabase > SQL Editor: paste `src/datastore/supabase/migrations/017_behaviours_tell_telegram.sql` > Run, **before** merging its pull request (the code live tonight ignores what the changed function returns, so this order is safe; the other way round, a Behaviours save would say it didn't work although it saved) | "Success. No rows returned" | [ ] |
| G3 | Merge the Settings pull request (it deploys) | Vercel shows the new deployment as Ready | [ ] |

## Phone tests
| ID | Do this | Expect | Result |
|---|---|---|---|
| U84 | In Telegram send `/settings`, tap **Open Settings ↗**, then the button | Settings opens (not Week so far): About you, Reminders, Privacy, Account, each row with its value | [x] PASS, 26 Nov |
| U85 | Tap **Your name**, change it, **Save** | Back on the list with "✅ Saved." and the new name; the bot uses the new name from now on | [x] PASS, 26 Nov |
| U86 | Tap **Children**, correct a name, add a child in the empty box, **Save** | Both show on the list; with 3 children the empty box is gone | [ ] PARTLY (no 3rd child to check; removing not designed), 26 Nov |
| U87 | Tap **Behaviours**, tick a 3rd quick behaviour, **Save** | "Choose up to 2 quick behaviours." and nothing changes | [ ] FAIL (DEF-1), 26 Nov |
| U88 | Change a behaviour or how often, **Save** | "✅ Saved."; the next reminders use the new choice | [x] PASS, 26 Nov |
| U89 | Tap **Reminder times**, add a time 30 minutes from another | It isn't in the list (only allowed times are offered); add one that is, then **Remove** it | [x] PASS, 26 Nov |
| U90 | Tap **Pause reminders**, tap the switch | "✅ Saved."; in Telegram: "⏸ Your reminders are paused. Send /resume any time to restart them."; the Menu shows /resume | [x] PASS (DEF-3), 26 Nov |
| U91 | Tap the switch again | In Telegram: "✅ Your reminders are back on."; the Menu shows /pause | [x] PASS, 26 Nov |
| U92 | In Telegram send `/pause`, tap **⏸ Pause**; then open Settings | "Your reminders are paused" in Telegram; Settings shows **Pause reminders On** | [x] PASS, 26 Nov |
| U93 | Tap **Weekly Wrap Up**, pick another Sunday time, **Save** | The list shows "Sun [new time]"; there is no on/off switch | [x] PASS, 26 Nov |
| U94 | Tap **What we record** | The wording, "You agreed on [date].", the Terms and Conditions link | [x] PASS, 26 Nov |
| U95 | Tap **Sign out**, then **Cancel**; then **Sign out** and **Yes, sign out** | Cancel goes back to the list; Yes signs you out | [x] PASS, 26 Nov |
| U96 | Tap **Download my memories** and **Help us improve** | Nothing happens (Coming soon) | [x] PASS, 26 Nov |
| U97 | **With a test account only** (not your own): **Delete my data**, **Continue to delete**, try **Yes, delete everything** without ticking, then tick it and press again | First "Please tick the box first."; then "Your data has been deleted"; the bot stops messaging that account; its photos are gone from Supabase Storage | [ ] NOT RUN (no test account), 26 Nov |
| U98 | [2026-11-25 22:43 SGT] After G4: change your **Behaviours** in Settings, **Save**, then open Telegram | "✅ Your habits are updated." with the new habit buttons under the chat; the old ones are gone | [x] PASS (DEF-2), 26 Nov |
