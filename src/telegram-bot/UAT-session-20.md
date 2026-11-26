# UAT: session 20, the look, photos, "Add how you felt" and the Sunday Wrap Up

[2026-11-24 23:10 SGT] One checklist for the owner's phone (owner, 24 Nov: "consolidate them after I've built a few more things"). It also covers the earlier, parked tests U63 to U72 for Week so far ([src/web-app/UAT-week-so-far.md](../web-app/UAT-week-so-far.md)): run those first. Migrations 012, 013 and 014 are applied; #57 to #60 are merged. Tick each box; anything that fails goes to `docs/ERROR-LOG.md`.

[2026-11-26 22:38 SGT] **Results, 26 Nov evening:** Run by Claude in Telegram Web on the owner's computer ([docs/UAT-RUNBOOK.md](../../docs/UAT-RUNBOOK.md)), 26 Nov 21:25 to 22:32 SGT; the owner tapped every My page step. Defects DEF-1 to DEF-4 are in [docs/KNOWN-ISSUES.md](../../docs/KNOWN-ISSUES.md). **Pass:** U73 to U78 (U74: the consent question appeared, the owner tapped OK). **Not run:** U79 to U83 (Sunday 29 and Monday 30 Nov). By design: the photo consent is asked at the first photo even though "What we record" says "You agreed on 14 Nov 2026" (that date is the sign-up agreement, a separate consent); owner to judge whether the wording confuses. U78 on the same receipt said "This log already has a line. You can delete it on My page.", so a new receipt was used.

| ID | Do this | Expect | Result |
|---|---|---|---|
| U73 | Log a deliberate habit (for example Spending quality time) on the keyboard | The receipt with "📷 Send a photo of what you did.", Undo and **Add how you felt** | [x] PASS, 26 Nov |
| U74 | Send a photo within 10 minutes (your first ever) | The consent question with **OK** and **Don't save my photos**; tap OK: "Thanks. Please send the photo again." | [x] PASS, 26 Nov |
| U75 | Send the photo again | "✅ Photo added to today's log."; on My page the photo shows big under that log | [x] PASS, 26 Nov |
| U76 | On My page, tap the photo's 🗑, then **Delete** | "Delete this photo? It will be gone for good. Your log stays."; the photo is gone, the log and its line stay | [x] PASS, 26 Nov |
| U77 | Tap **Add how you felt** under a receipt and type a line | The prompt, then "✅ Added to today's log."; the line shows under the log on My page | [x] PASS, 26 Nov |
| U78 | Type a line of more than 280 characters while it waits | "That line is … characters. Please shorten it to 280 or fewer and send it again." | [x] PASS, 26 Nov |
| U79 | Sunday 29 Nov, at your Wrap Up time (if you logged that week) | "Your week, [name]" with Habits logged, Feelings logged, Photos and two buttons; then the 1 to 5 question | [ ] |
| U80 | Tap a number on the question | The message reads "Answered: 4, quite connected" (your number); a second tap changes nothing; My page shows the bar | [ ] |
| U81 | Tap **Add a moment from this week**, then type a line and send a photo | The prompt; each gets "✅ Saved as this week's moment."; My page shows the moment at the top until midnight | [ ] |
| U82 | Tap **View wrap up** | A fresh "Open my page" link that opens Week so far | [ ] |
| U83 | Monday evening (after 24 hours), look at the question if you didn't answer | "Question expired", no buttons | [ ] |
