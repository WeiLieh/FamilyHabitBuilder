# Brief for Claude Chat: B2 Sunday rhythm, answering and saving (questions 9, 10, 11)

[2026-11-09 19:25 SGT] Written by Claude Code for the owner to take into Claude Chat, where the owner designs the screens. **This is a brief going TO Chat, not a decision.** Nothing here is agreed until the owner decides; decisions come back as a design handoff (see "What to bring back"). The rules quoted below live in the specs; if this brief and a spec ever differ, the spec wins.

## 1. Where B2 stands
- [2026-11-09 19:25 SGT] **Group A, settled 9 Nov:** the weekly connection question ("How connected did you feel with your child?", 1 to 5) is sent on Sunday **at the parent's Wrap Up time** (default 8:00 pm). If the parent logged that week it is the **last item of the Weekly Wrap Up**; if not, it goes **on its own**. **The same fixed words every week, never written by Claude**, with no mention of a quiet week. It never counts toward the 3-a-day cap. **One Pause switch** stops every message the bot starts (nudges, Wrap Up, connection question); the Wrap Up has no switch of its own. Rules 3.4, 3.12, 5.6, 7.8.
- [2026-11-09 19:25 SGT] **Group B, settled 9 Nov:** the Wrap Up is a **fixed template with real numbers, never written by Claude**. In the joining week it says "Your streak starts next week". The monthly section (first Wrap Up of each month) is provisional: last month's days logged, steady weeks and moments saved, no comparison with other parents. Rule 7.8.
- [2026-11-09 19:25 SGT] **What the Wrap Up shows** (rule 7.8): (1) days logged this week so far; (2) steady weeks so far, in total and in a row; (3) photos and lines saved this week; (4) a one-tap link to the Web app; (5) "Want to save one moment from this week?"; (6) the connection question.
- [2026-11-09 19:25 SGT] **Still open, for Chat:** questions 9, 10 and 11 below. **Question 12 stays in Claude Code** (a tracking rule, 10.2, and the order of a Sunday nudge and the Wrap Up).

## 2. Rules the screens must respect
- [2026-11-09 19:25 SGT] **5.6** The parent taps 1 to 5 once. The bot then removes the buttons and shows "Thanks, you answered 4". An extra tap is ignored; the first answer counts (the database also refuses a second one). The answer can't be changed that week.
- [2026-11-09 19:25 SGT] **7.7** "Save a moment": **one photo and/or one line** about any moment that week, even outside the 9 nudges, **until the next Wrap Up**. It is an **album entry, not a log**: it never changes targets, streaks or steady weeks (it does count toward the "First Memory" badge).
- [2026-11-09 19:25 SGT] **5.5** Photo consent is asked **at the first photo**, not at sign-up. Its wording waits for the owner's PDPA (Personal Data Protection Act) reviewer, so Chat should use a placeholder.
- [2026-11-09 19:25 SGT] **Privacy decisions of 9 Nov:** after asking for a photo or line, the bot **stops waiting after a set time** (number to decide); a photo the parent deletes leaves **no copy anywhere**; the child's name is **never sent to Claude**.
- [2026-11-09 19:25 SGT] **1.3 No fallbacks:** numbers and receipts come only from real data; a failure is shown as a failure.
- [2026-11-09 19:25 SGT] **6.1 and 6.2** (Photo check) apply to **logs**: Claude checks a log's photo, and if the check fails the log is self-reported. Question 11 asks whether this applies to saved moments.
- [2026-11-09 19:25 SGT] **Look and feel** comes only from the owner (rule 6 in `CLAUDE.md`). Claude Code's low-fidelity preview was set aside by the owner; Chat starts fresh.

## 3. The three questions, with Claude Code's recommendations
- [2026-11-09 19:25 SGT] **Q9. How long can the connection question be answered?** Recommended: **until next Sunday's question is sent**, with **no reminder**. When the new question goes out, the bot removes last week's buttons. If a late tap still arrives (for example, the phone was offline), it is **not saved**, and the bot replies with fixed words, draft: "This week's question has closed. You can answer this week's question in the latest message." Why not midnight Sunday: a Wrap Up at 9:30 pm would leave only two and a half hours.
- [2026-11-09 19:25 SGT] **Q10. Which week does an answer count for?** Recommended: **the week it was asked**, even if tapped on Monday. Draft: the bot names the week in the thank-you, "Thanks, you answered 4 (week of Mon 2 Nov)", so the parent isn't confused after midnight.
- [2026-11-09 19:25 SGT] **Q11. Do saved moments go through the AI photo check?** Recommended: **no**. A saved moment is an album entry, not a log, so there is nothing to verify. Flow, draft: tap "Save a moment" → "Send a photo, or type one line about a moment from this week." → (first photo ever: the photo consent question first) → "✅ Saved to your album." If the parent says no to photo consent, the photo is not stored anywhere.

## 4. Details the preview surfaced (please confirm in Chat)
- [2026-11-09 19:25 SGT] **D-a** After the 1 to 5 tap, the bot edits the Wrap Up: the 1 to 5 buttons go, but **"Save a moment" stays** (it works until the next Wrap Up).
- [2026-11-09 19:25 SGT] **D-b** A late answer **names its week** (Q10).
- [2026-11-09 19:25 SGT] **D-c** The saved-moment receipt is **fixed text with no Claude reply**, like the rest of the Sunday message. (Daily logs do get a Claude reply, rule 7.5; this would be different.)
- [2026-11-09 19:25 SGT] **D-d** What the bot says when the parent says **no** to photo consent here, and whether they can then send a line instead.
- [2026-11-09 19:25 SGT] **D-e** The "stops waiting" time for the photo or line (a number, kept in `src/settings.ts`).

## 5. What to bring back to Claude Code
- [2026-11-09 19:25 SGT] A **design handoff file** in `docs/handoffs/` named `2026-MM-DD-telegram-b2-answering-and-saving.md`, with the owner's answers to Q9, Q10, Q11 and D-a to D-e, any screens (as a link or description) and the exact wordings chosen.
- [2026-11-09 19:25 SGT] **Habit H10:** the same commit must add the file's link to the document index in `docs/SPEC.md` ("Design handoffs from Claude Chat"), or its pull request fails the drift check.
- [2026-11-09 19:25 SGT] Leave out full names and private links (known issue of 8 Nov about the 3 Nov handoff).
- [2026-11-09 19:25 SGT] Claude Code then writes the decisions into rules 5.6 and 7.7 (old text kept as SUPERSEDED), and takes question 12 next.
