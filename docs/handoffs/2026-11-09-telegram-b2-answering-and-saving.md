# Handoff to Claude Code: B2 Sunday rhythm, answering and saving (9 Nov 2026)

Date: 2026-11-09, about 20:30 Singapore Time. Source: design chat in Claude Chat, Project "Family Habit App". This answers your brief [2026-11-09-b2-answering-and-saving-brief-for-chat.md](2026-11-09-b2-answering-and-saving-brief-for-chat.md) (questions 9, 10, 11 and details D-a to D-e). The previews are on the private canvas "Onboarding: Telegram previews (low fidelity)", boards B2-1 to B2-8.

## 0. What to do

1. Record section 2 as **dated notes** in `src/telegram-bot/SPEC.md` (rules 5.6, 7.7 side, 3.12) and `src/variable-rewards/SPEC.md` (rule 7.7 and 7.8), format `[YYYY-MM-DD HH:MM SGT]` (run `TZ=Asia/Singapore date`). Keep replaced wording as `SUPERSEDED [timestamp]`. Rules 5.6 and 7.7 keep their IDs.
2. Add a change note to `docs/SPEC.md`. The link to this file is added to the document index in the same commit as this file (habit H10).
3. Update `docs/CATCH-UP.md` (section 4 below). Take your question 12 next.
4. Do not build anything. Recording only.
5. "owner decided" = the owner's own answer or sketch on 9 Nov. "default chosen" = my default where the owner did not answer; show these to him for a quick confirmation.

## 1. The screens (owner's sketches, all drawn on the canvas)

| Board | What the parent sees | Status |
|---|---|---|
| B2-1 Wrap Up | **Two separate messages.** (1) "Your week, John / Habits logged: 4 / Feelings logged: 3 / Photos: 1" with two buttons side by side, **Add a moment from this week** and **View wrap up**. (2) "How connected did you feel with your child? (1 = not much, 5 = very)", the grey line "Question expires in 24 hrs", and buttons **1 2 3 4 5** | owner decided |
| B2-2 After the tap | The question message is **edited**: buttons removed, grey line becomes "**Answered: 4, connected**". No bubble from the parent (Telegram does not create one for a button tap) | owner decided (Option A, 9 Nov, "looks neater") |
| B2-3 On its own | The same question message alone, for a parent who did not log. Same fixed words every week, never written by Claude, no mention of a quiet week (rule 5.6) | owner decided |
| B2-4 Expired | After 24 hours the bot **edits the question once**: buttons removed, grey line becomes "**Question expired**". No new message | owner decided |
| B2-5 Add a moment | Tapping the button sends: "Send a photo, or type one line about a moment from this week." plus a fixed status line **"Upload within 5 mins"** | owner decided the 5 minutes and the status line on 9 Nov 20:35; wording mine |
| B2-6 First photo | After the parent's first photo ever: "[Photo consent wording, awaiting your PDPA reviewer.] We save your photos so you can see your weekly wrap up." with buttons **OK** and **Don't save my photos** | owner decided (his wording; consent wording is still a placeholder) |
| B2-7 OK | "✅ Saved to your album." (fixed text, no Claude reply) | default chosen |
| B2-8 Don't save | The photo is not stored anywhere. "No problem. That photo wasn't saved. You can type one line instead." | default chosen |

## 2. Decisions to record

### 2.1 Question 9: how long the 1 to 5 question can be answered (owner decided)
- **24 hours from the moment it is sent**, with **no reminder**. This replaces the brief's recommendation ("until next Sunday's question"). It applies to both the question inside the Wrap Up (B2-1) and the one sent alone (B2-3).
- The "expires in 24 hrs" line is **fixed text, not a ticking timer** (a live timer would need many message edits, and a stale one would be a made-up number, rule 1.3).
- At expiry the bot edits the message once, removes the buttons and changes the line to "Question expired". A failed edit is recorded as a failure (rule 1.3); the answer is still refused after 24 hours (the database also refuses a second answer).
- A tap on a stale button (for example the phone was offline) is **not saved**; the bot shows a short pop-up, not a new message. Draft words: "This question has closed." (default chosen). The earlier separate "This week's question has closed..." message is dropped.

### 2.2 Question 10: which week an answer counts for (owner confirmed, 9 Nov 20:35)
- **The week it was asked**, even if tapped after midnight Sunday (within the 24 hours). The owner confirmed: a tap on Monday for the Sunday just past still reads as answered and counts for the **past week**. If tapped after midnight Sunday the line reads "Answered (week of Mon 2 Nov)"; otherwise "Answered: 4, connected".
- The answer **word** shown after the tap is a short label for each number. **Owner decided the labels:** 1 = Disconnected, 2 = Slightly connected, 3 = Moderately connected, 4 = Quite connected, 5 = Strongly connected. So the line after a tap of 4 reads "Answered: 4, quite connected" (the earlier sample "4, connected" is replaced). The stored value is still the number 1 to 5.

### 2.3 Question 11: saved moments and the photo check (owner confirmed, 9 Nov 20:35)
- Reason given by the owner: it could be any photo, not necessarily related to the habit. A saved moment does **not** go through the AI photo check (rules 6.1, 6.2 apply to logs only). It is an album entry, not a log (rule 7.7). Receipt is fixed text with no Claude reply (D-c).

### 2.4 D-a to D-e
- **D-a (default chosen):** after the tap, "Add a moment from this week" stays on the summary message. It works until the next Wrap Up (rule 7.7).
- **D-b:** see 2.2.
- **D-c:** see 2.3.
- **D-d (owner decided):** if the parent taps **Don't save my photos**, the photo is not stored anywhere and the bot offers a line instead (B2-8). **Consent is asked again at the next photo ("keep asking").**
- **D-e (owner decided):** the bot stops waiting for the photo or line after **5 minutes** (a starting number, in `src/settings.ts`), and the prompt shows a fixed status line "Upload within 5 mins". Default chosen: at 5 minutes the bot stays quiet (no edit); a photo that arrives later is not saved and gets "That took too long. Tap Add a moment from this week to try again." (owner to confirm).

### 2.5 The Wrap Up summary changed (owner's sketch; changes rule 7.8)
Rule 7.8 lists items (1) days logged, (2) steady weeks, (3) photos and lines saved, (4) a link to the Web app, (5) "Want to save one moment?", (6) the connection question. The owner's sketch changes this:
- The summary shows **Habits logged, Feelings logged, Photos** only. **Steady weeks are no longer in the message** (they stay on My page, rule 9.1).
- "Open my page" becomes **View wrap up**, and "Want to save one moment?" becomes the **Add a moment from this week** button. The connection question is a **separate second message**, not item 6 inside one message. Rules 3.12 and 7.8 need a dated change (old text kept as SUPERSEDED).
- **Definitions (owner confirmed 9 Nov 20:35):** "Habits logged" = days logged this week so far; "Feelings logged" = lines added with "Add how you felt" plus lines saved as moments; "Photos" = photos saved this week (logs and moments). "View wrap up" opens **My page** on the Web app (owner confirmed).
- The Wrap Up stays a **fixed template with real numbers, never written by Claude** (settled 9 Nov, group B).

## 3. Not changed
Rules 3.4 (the question never counts toward the 3-a-day cap), 5.5 (consent at the first photo), 7.7 (album entry, not a log) and 1.3 (no fallbacks) apply as they stand.

## 4. Open questions after this handoff
- **Q-B2-1 and Q-B2-2: answered by the owner on 9 Nov 20:35** (see sections 2.2 to 2.5). One new small default to confirm: what happens to a photo that arrives after the 5 minutes (section 2.4, D-e).
- **Q-B2-3 (PDPA reviewer):** the consent text says photos are saved "for your weekly wrap up", but photos from a log (B1-3) also exist. **The owner agrees the phrases need settling** with the reviewer; also withdrawing consent (PDPA section 16).
- **Question 12** stays with you (rule 10.2, and the order of a Sunday nudge and the Wrap Up).
- **Telegram detail to check in the thin slice:** two side-by-side buttons with long text ("Add a moment from this week") wrap to two lines on small phones.

## 5. Where I got this
The owner's three sketches and answers in Claude Chat on 9 Nov 2026, 19:29 to 20:35 SGT (24 hours with an "expires" line, two messages, the "Answered: 4, connected" line, the consent buttons), and your brief. I did not edit any spec.
