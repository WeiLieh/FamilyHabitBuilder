# Catch-up page, section 4 as it stood up to 12 Nov 2026

[2026-11-12 23:29 SGT] Moved word for word from [docs/CATCH-UP.md](../CATCH-UP.md) when section 4 was rewritten to hold only open questions (session 14). Many questions below were answered later; see the specs. Nothing was reworded.

## 4. Questions to think about before next session

[2026-11-08 22:34 SGT] Session 9 recorded your answers to the group A questions. Each changed rule keeps its old text, marked SUPERSEDED, in its spec; the dated summary is change note 1.14 in [docs/SPEC.md](SPEC.md).

**4.0a Decided in session 13 (12 Nov)** ([2026-11-12 23:20 SGT])
- Scheduler for pull request 3: **Supabase Cron** (your 24 Oct choice, confirmed). PDPA wording stays a placeholder until you go live.
- Onboarding build decisions: D1 the true 7:00 pm time until pull request 3 (temporary); D2 no Skip on screen 5 without a quick pick; D3 screen 8 title "From what you chose, your reminders are:"; D4 the clean-up runs daily from now on. Placeholder pages My Page and Settings. Review fixes F1 to F5 done; known issues K1 to K5 recorded.
- **Questions for next time (only if you have a moment; none block the build):** (1) K1: take the 90-day record line to your PDPA reviewer with Q8; (2) the draft wordings in `src/telegram-bot/words.ts` marked "draft" (for example "Picked: …", "Sorry, Start right now couldn't be shown. You're signed up."); (3) ~~`docs/SPEC.md` is over 300 lines: may Claude move the oldest change notes into `docs/archive/`?~~ [2026-11-12 23:27 SGT] Done (session 14): you approved; all long files shortened, history in `docs/archive/`.

**4.0 Decided in session 12 (12 Nov)** ([2026-11-12 22:34 SGT])
- Rule 5.10: a reply to a nudge is a new message; the nudge stays, without buttons. Cases 7 and 8 (the connection question) unchanged.
- Onboarding: the sign-up draft; Change name stays in Telegram; up to 3 children; no Change on screens 6 and 7 (Settings instead); screen 10 uses the first quick behaviour with fixed words, its own kind of message, prompted; one child per message, taking turns, told once; invites held at `/start`, used at agreement; 7-day draft, one reminder, 90-day deletion; the 7-day line at `/start`. Q3, Q4, Q7, Q10, Q11 are answered.
- **Questions to think about for next time:** (1) the scheduler for the planner: Supabase's own scheduler, a service such as Upstash QStash, or Vercel's paid plan (Claude brings the trade-offs before pull request 3); (2) Q8 agreement wording and the 7-day line, for your PDPA reviewer; (3) whether to update the onboarding canvas to match the 12 Nov decisions.

**4a. Rule changes**
- [2026-11-09 21:49 SGT] **Recorded 9 Nov from the Chat handoffs:** 5.1 typed messages · 5.4 today only, unchosen = reflection, repeat celebrated · 3.12 any activity triggers the Wrap Up, two messages · 7.6 Monday receipt retired · 7.8 new summary, steady weeks and monthly view on My page. **Waiting for your go-ahead:** the texts of 5.6 (24 hours, "Answered: 4, quite connected") and 7.7 (24-hour window, consent buttons).
- [2026-11-09 18:16 SGT] **Approved 9 Nov (B2 group A):** 3.4 three kinds of bot message, the stand-alone connection question never counts · 3.12 one Pause switch stops everything, the Wrap Up's own switch removed · 5.6 connection question at the Wrap Up time, fixed words, not while paused · 7.8 a paused parent gets nothing on Sunday but sees everything in the Web app · 8.4 edit 1 without the switch. Still waiting: 10.2 (B2 question D12).
- [2026-11-08 23:08 SGT] **Screen edits, 8 Nov:** 3.14 now has one button (OK); 11.9 now has one button ("✅ I agree"). **Defaults confirmed by you [2026-11-08 23:09 SGT]:** screen 3 "What's your child's name?"; screen 10 uses the child's name, no pronoun; screen 11's receipt "✅ Saved: `<behaviour>` today." is fixed and "You're off to a great start." is Claude's reply.
- **Approved on 8 Nov (9):** 5.5 photo consent at the first photo · 11.9 one checkbox at the end of sign-up, recording only · 8.10 child's name, birth year later · 8.13 *(new)* unfinished sign-up keeps only the Telegram ID and last step · 2.5 *(new)* default frequencies: quick every 2 days, deliberate once a week · 3.14 screen 8 is one plan summary · 5.7 *(new)* the Menu, plain words work too · 9.1 My page is the dashboard, Settings lives inside it · 7.8 the connection question is item 6 of the Wrap Up.
- **Still waiting (3), on the parked questions in 4d:** 3.4 (a third kind of bot message), 5.6 (when the connection question is sent), 10.2 (new tracking events; also needs Q3).

**4b. Open questions, kept as work in progress (WIP)**
- [2026-11-09 21:49 SGT] **B2 group C answered in Chat** (24 hours, the week asked, no photo check on moments); **D12 open:** rule 10.2 events and a Sunday nudge in the same 30 minutes as the Wrap Up.
- [2026-11-09 21:49 SGT] **Default to confirm:** a `/log` tap on an unchosen habit thanks the parent and offers "Add how you felt"; the reflection is saved once a line is added.
- [2026-11-09 21:49 SGT] **Yesterday test:** replacing it means changing 3 more tests that also log yesterday (your approval covered one); see the question in the session.
- [2026-11-09 21:49 SGT] **Datastore proposal (draft):** Option 1 or 2; undo deletes a checked photo too; how long reflection text is kept.
- [2026-11-08 23:08 SGT] **Q3 (partly answered 8 Nov):** screen 10's draft wording is in, and "the scoreboard" means My page and the Weekly Wrap Up (the first action is logged). **Still open:** which behaviour when two were picked; the Not now reply; prompted or unprompted log (rule 5.2, metric 7); whether it counts toward the joining week (rule 7.6) and metric 8; whether it uses a slot or counts in the 3-a-day cap (rule 3.4); its telemetry event (rule 10.2).
- [2026-11-09 17:44 SGT] **Q4 (partly answered 9 Nov):** the child's name is never sent to Claude; it is only shown in Telegram. Still open: nudges for families with 2 or more children.
- **Q5** rename the nine behaviours · **Q7** flows behind the buttons · **Q8** agreement wording · **Q9** bot name and description · **Q10** invite code edge cases · **Q11** stopping halfway (what is kept is now rule 8.13).
- **Q12:** how and when the birth year is collected in the engagement journey.
- [2026-11-11 17:31 SGT] **B1 daily loop:** designed on 8 and 9 Nov (Undo, keyboard, Not today, photos as an add-on, repeat and today-only logs, the 280 limit, typed messages and reflections; [src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md)). Still to design: how long the bot waits for a photo after a log; what the parent sees if Claude fails to write a reply; withdrawing photo consent (group C); a daily cap on matching calls.
- **Rule 8.13 details:** how long before an unfinished sign-up's data is thrown away, and how the re-engagement message works.

**4e. Privacy-review findings from 9 Nov (you decide what goes into `docs/KNOWN-ISSUES.md`)**
- [2026-11-09 17:50 SGT] **DONE:** you decided all five on 9 Nov; they are in [docs/KNOWN-ISSUES.md](KNOWN-ISSUES.md) with your decisions. The 3 Nov findings also have your decisions (names out of Telemetry and exports, birth year shown as bands, name never sent to Claude).
- [2026-11-09 00:14 SGT] **Medium:** Undo (rule 8.4, edit 5) says it is enforced by the database, but nothing says the database itself checks the 30-second window and "keyboard logs only". If only the code checks them, a bug could quietly undo any old log and change streaks or metrics.
- [2026-11-09 00:14 SGT] **Medium:** "Add how you felt" is free text that may contain a child's name or health details and goes to Claude (rule 5.3). When a log is undone, the spec does not say what happens to its line or photo.
- [2026-11-09 00:14 SGT] **Medium:** "ignore this to skip" has no time limit, so a later, unrelated message could be saved as the log's description and sent to Claude.
- [2026-11-09 00:14 SGT] **Medium:** no spec mentions checking Telegram's webhook secret header, so a forged request could create or undo logs for any parent (to add when building the Telegram bot).
- [2026-11-09 00:14 SGT] **Low:** keyboard taps leave behaviour names in Telegram's chat history, outside Singapore and outside "delete my data" (mention in the PDPA note).

**4c. Needed before the build or group B:** where "Open my page" goes before the Web app exists, and how the parent is signed in; Claude's response time and slow first starts on Vercel, tested in the thin slice; create the Telegram bot (BotFather), the Vercel project and Upstash Redis before the thin slice. (Done: the screen 8 settings are the same as the Web app's, rule 3.14.)

**4d. Parked (you asked me not to raise these first):** [2026-11-09 18:16 SGT] (the stand-alone check-in's time, cap and paused behaviour: decided 9 Nov, B2 group A) "pause" versus "stop"; pausing before the Web app exists (you pause the week-one group by hand?); whether stopping is as easy as starting (governance); Web app sign-in; the two Web app questions in [src/web-app/SPEC.md](../src/web-app/SPEC.md); the first alpha experiment (Claude Chat).

**Privacy-review findings (3 Nov):** you decided on 8 Nov. Finding 1 (data from parents who stop halfway) became rule 8.13; findings 2 to 6 are in [docs/KNOWN-ISSUES.md](KNOWN-ISSUES.md).

---

