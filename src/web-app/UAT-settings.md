# UAT: Settings (U84 to U98)

[2026-11-25 22:32 SGT] The owner's go-live steps and phone tests for My page's Settings tab (rule 9.9) and pausing both ways (rule 5.7). Tick each box as it passes.

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
| U84 | In Telegram send `/settings`, tap **Open Settings ↗**, then the button | Settings opens (not Week so far): About you, Reminders, Privacy, Account, each row with its value | [ ] |
| U85 | Tap **Your name**, change it, **Save** | Back on the list with "✅ Saved." and the new name; the bot uses the new name from now on | [ ] |
| U86 | Tap **Children**, correct a name, add a child in the empty box, **Save** | Both show on the list; with 3 children the empty box is gone | [ ] |
| U87 | Tap **Behaviours**, tick a 3rd quick behaviour, **Save** | "Choose up to 2 quick behaviours." and nothing changes | [ ] |
| U88 | Change a behaviour or how often, **Save** | "✅ Saved."; the next reminders use the new choice | [ ] |
| U89 | Tap **Reminder times**, add a time 30 minutes from another | It isn't in the list (only allowed times are offered); add one that is, then **Remove** it | [ ] |
| U90 | Tap **Pause reminders**, tap the switch | "✅ Saved."; in Telegram: "⏸ Your reminders are paused. Send /resume any time to restart them."; the Menu shows /resume | [ ] |
| U91 | Tap the switch again | In Telegram: "✅ Your reminders are back on."; the Menu shows /pause | [ ] |
| U92 | In Telegram send `/pause`, tap **⏸ Pause**; then open Settings | "Your reminders are paused" in Telegram; Settings shows **Pause reminders On** | [ ] |
| U93 | Tap **Weekly Wrap Up**, pick another Sunday time, **Save** | The list shows "Sun [new time]"; there is no on/off switch | [ ] |
| U94 | Tap **What we record** | The wording, "You agreed on [date].", the Terms and Conditions link | [ ] |
| U95 | Tap **Sign out**, then **Cancel**; then **Sign out** and **Yes, sign out** | Cancel goes back to the list; Yes signs you out | [ ] |
| U96 | Tap **Download my memories** and **Help us improve** | Nothing happens (Coming soon) | [ ] |
| U97 | **With a test account only** (not your own): **Delete my data**, **Continue to delete**, try **Yes, delete everything** without ticking, then tick it and press again | First "Please tick the box first."; then "Your data has been deleted"; the bot stops messaging that account; its photos are gone from Supabase Storage | [ ] |
| U98 | [2026-11-25 22:43 SGT] After G4: change your **Behaviours** in Settings, **Save**, then open Telegram | "✅ Your habits are updated." with the new habit buttons under the chat; the old ones are gone | [ ] |
