# UAT: session 20, the look, photos, "Add how you felt" and the Sunday Wrap Up

[2026-11-24 23:10 SGT] One checklist for the owner's phone (owner, 24 Nov: "consolidate them after I've built a few more things"). It also covers the earlier, parked tests U63 to U72 for Week so far ([src/web-app/UAT-week-so-far.md](../web-app/UAT-week-so-far.md)): run those first. Migrations 012, 013 and 014 are applied; #57 to #60 are merged. Tick each box; anything that fails goes to `docs/ERROR-LOG.md`.

| ID | Do this | Expect | Result |
|---|---|---|---|
| U73 | Log a deliberate habit (for example Spending quality time) on the keyboard | The receipt with "📷 Send a photo of what you did.", Undo and **Add how you felt** | [ ] |
| U74 | Send a photo within 10 minutes (your first ever) | The consent question with **OK** and **Don't save my photos**; tap OK: "Thanks. Please send the photo again." | [ ] |
| U75 | Send the photo again | "✅ Photo added to today's log."; on My page the photo shows big under that log | [ ] |
| U76 | On My page, tap the photo's 🗑, then **Delete** | "Delete this photo? It will be gone for good. Your log stays."; the photo is gone, the log and its line stay | [ ] |
| U77 | Tap **Add how you felt** under a receipt and type a line | The prompt, then "✅ Added to today's log."; the line shows under the log on My page | [ ] |
| U78 | Type a line of more than 280 characters while it waits | "That line is … characters. Please shorten it to 280 or fewer and send it again." | [ ] |
| U79 | Sunday 29 Nov, at your Wrap Up time (if you logged that week) | "Your week, [name]" with Habits logged, Feelings logged, Photos and two buttons; then the 1 to 5 question | [ ] |
| U80 | Tap a number on the question | The message reads "Answered: 4, quite connected" (your number); a second tap changes nothing; My page shows the bar | [ ] |
| U81 | Tap **Add a moment from this week**, then type a line and send a photo | The prompt; each gets "✅ Saved as this week's moment."; My page shows the moment at the top until midnight | [ ] |
| U82 | Tap **View wrap up** | A fresh "Open my page" link that opens Week so far | [ ] |
| U83 | Monday evening (after 24 hours), look at the question if you didn't answer | "Question expired", no buttons | [ ] |
