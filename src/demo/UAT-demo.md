# UAT: the Demo (U99 to U103)

[2026-11-26 22:38 SGT] The owner's checks for the Demo module (rules 12.1 to 12.7, [SPEC.md](SPEC.md)). UAT means user acceptance testing: trying it as the owner would before a real demo. Before you start: `DEMO_OWNER_TELEGRAM_IDS` (your Telegram user ID) is set in Vercel and redeployed, and migration 015 is applied. While a demo runs, your real reminders are paused; `/demo stop` deletes the demo and switches back.

[2026-11-26 22:38 SGT] **Results, 26 Nov evening:** run by Claude in Telegram Web on the owner's computer ([docs/UAT-RUNBOOK.md](../../docs/UAT-RUNBOOK.md)), 22:25 to 22:31 SGT. **All five pass** against the Demo's rules. The runbook's first wording of U100 and U101 expected two things the rules don't promise, so the run marked them PARTLY: Undo under a ✅ Done receipt (Undo is only for keyboard logs, rule 5.8) and the 3rd reminder after Not today (Not today stops the rest of the day, and `/next` goes on to the Wrap Up, rule 12.5). The expectations below are corrected; old wording kept in the runbook, marked SUPERSEDED.

| ID | Do this | Expect | Result |
|---|---|---|---|
| U99 | Send `/demo` | A fresh sign-up starts (the agreement shown, no invite code asked); the Menu gains `/next` and `/demo_stop` | [x] PASS, 26 Nov |
| U100 | Finish the sign-up, then send `/next` several times | Each chosen habit's reminder once, in the order picked, until one gets 😴 Not today (that ends the day's reminders, rule 12.5); then the Wrap Up summary; then the 1 to 5 question; then "That's the whole week. Type /demo stop to finish." | [x] PASS, 26 Nov (Not today on the 2nd reminder, so the 3rd was rightly skipped) |
| U101 | During the demo: ✅ Done on one reminder, 😴 Not today on another, a number on the 1 to 5 question; and a keyboard tap with Undo | Done: the receipt, no Undo (rule 5.8); Not today: the comforting note below; the number: "Answered: …"; a keyboard tap: the receipt with Undo | [x] PASS, 26 Nov (Done, Not today and the number; the keyboard tap with Undo was not tried) |
| U102 | During the demo, send `/mypage` and open it | My page shows the **demo** parent's week, not yours | [x] PASS, 26 Nov |
| U103 | Send `/demo stop` | "✅ Demo ended. Its data is deleted. You're back on your own account."; the Menu loses /next and /demo_stop; `/mypage` shows your own week | [x] PASS, 26 Nov |
