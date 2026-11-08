# Handoff to Claude Code: B1 daily loop design (8 Nov 2026)

Date: 2026-11-08, about 23:45 Singapore Time. Source: design chat in Claude Chat, Project "Family Habit App". Follows [2026-11-08-telegram-onboarding-screen-edits.md](2026-11-08-telegram-onboarding-screen-edits.md). The previews are on the private canvas "Onboarding: Telegram previews (low fidelity)", row 4 (boards B1-1 to B1-5).

## 0. What to do

1. Record section 2 as **dated notes** in `src/telegram-bot/SPEC.md` (rules 3.4, 3.5, 5.1, 5.3, 5.7, 7.5) and `src/datastore/SPEC.md` (rule 8.4), format `[YYYY-MM-DD HH:MM SGT]` (run `TZ=Asia/Singapore date`). Keep replaced wording as `SUPERSEDED [timestamp]`.
2. Add a change note to `docs/SPEC.md` and link this handoff from the document index (rule D1).
3. Update `docs/CATCH-UP.md` (new open questions in section 4 below).
4. Do not build anything. Recording only.
5. Items marked "owner confirmed" were approved by the owner on 8 Nov. Items marked "default chosen" were my defaults where the owner had no preference.

## 1. What the owner confirmed (8 Nov, 23:36)

The owner reviewed boards B1-1 to B1-5 and said they look ok, and accepted the proposals in the four notes on the canvas. In plain terms:

| # | Decision | Status |
|---|---|---|
| 1 | The nudge message (B1-1) has two buttons: **✅ Done** and **😴 Not today** (rules 3.4, 3.5, 3.13) | owner confirmed |
| 2 | Tapping ✅ Done **edits the nudge in place into the receipt**; Claude's warm reply arrives as a **new message** (rule 7.5; Telegram principle 4) | owner confirmed |
| 3 | Under the warm reply: **"Add how you felt"** (every behaviour). The owner changed this from my "Add a line"; it is the optional free-text line (rule 5.3, up to 280 characters) | owner confirmed (his wording) |
| 4 | **"Add a photo"** shows only for behaviours that allow photos (all 5 deliberate ones today), next to "Add how you felt" (B1-3). Photo consent is asked at the first photo (rule 5.5); the photo check follows (rules 6.1, 6.2). **Not designed yet** | owner confirmed |
| 5 | **Self-logging (a log with no nudge): a persistent reply keyboard** with one button per behaviour the parent chose (up to 3), e.g. "✅ Showing affection". One tap logs it (rule 5.1, "one-tap logging" in rule 7.1) | owner confirmed |
| 6 | A keyboard tap sends the label as a visible message, then the bot replies with the receipt and the special **unprompted-log reply** (rule 7.2) | owner confirmed |
| 7 | **/log stays in the Menu as a backup** (it opens the same behaviour choice) | owner confirmed |
| 8 | **Undo button** under the receipt of a keyboard log (B1-5), to fix an accidental tap | owner confirmed as a proposal; **needs a new rule and a database change** (section 2.2) |

## 2. Rules to record

### 2.1 Persistent keyboard (rule 5.1 and rule 5.7)
- The bot sets a persistent reply keyboard (Telegram `ReplyKeyboardMarkup` with `is_persistent` and `resize_keyboard`) showing one button per chosen behaviour, up to 3 (rule 2.1).
- Button label = "✅ " + the behaviour's display name. A tap arrives as a normal text message; the bot matches it **exactly** against the labels it set, so no Claude call is needed to understand it.
- A tapped log is an **unprompted log** (rule 5.2) unless a nudge for that behaviour is still waiting for an answer (to define, see Q-B1-1).
- Keyboard follows the parent's picks: when picks change, the keyboard is re-sent.
- Not verified: how it looks on small phones, and whether accidental taps are common. Check in the thin slice. A parent can hide the keyboard in Telegram itself.

### 2.2 Undo (new rule, and a fifth narrow edit to rule 8.4)
- Rule 8.4 says logs are add-only, with four narrow edits. Undo is a **fifth narrow edit**: within a short window after the log (proposed: 5 minutes; **owner to confirm**), the parent may mark that one log as **undone**. The log row is **kept, flagged** (never deleted), and an event is written.
- An undone log does not count toward days, targets, streaks, steady weeks or the Weekly Wrap Up, and the message says so ("Undone. It won't count.").
- The Undo button disappears after the window (the bot edits the message to remove it).
- Telemetry (rule 10.2): new event for an undone log. Metrics that count logs must exclude undone ones.

### 2.3 Wording of the three prompts (default chosen)
- The "Add how you felt" prompt: "How did it feel? Type a line (up to 280 characters), or ignore this to skip." (my default; the owner has not seen it yet). The earlier preview GIF said "What happened?" and is now out of date.
- Confirmation after the line: "✅ Added to today's log." (default).

## 3. Not changed
- Rules 3.4 (cap and slots), 5.4 (unchosen, late and repeat logs), 7.5 (receipt first, then Claude's reply), 7.6 (the week closes at midnight Sunday) are used as they stand.
- The sample words in the previews (nudge idea, warm replies) are **examples**; Claude writes the real ones within the rules in `src/nudge-engine/NUDGE-CONTEXT.md`.

## 4. Open questions after this handoff
- **Q-B1-1:** a keyboard tap when a nudge for the same behaviour is still waiting: is it the answer to that nudge (prompted) or an unprompted log? (Affects rule 5.2, metric 7 and metric 8.) My suggestion: treat it as answering the nudge, and edit the nudge into the receipt.
- **Q-B1-2:** Undo window length (5 minutes proposed).
- **Q-B1-3:** keyboard with only 1 chosen behaviour (a one-button keyboard) is fine?
- **Still to design in B1:** 😴 Not today (reply, and whether it counts); photo consent question at the first photo; photo check pass and fail (self-reported fallback, rules 6.1, 6.2 and 1.3); withdrawing photo consent; logging an unchosen behaviour; logging for yesterday; repeat logs; a line over 280 characters; the "week has closed" receipt; what the parent sees if Claude fails (receipt stands, rule 7.5); free-text logging matched by Claude.
- **Parked (unchanged):** the stand-alone check-in (rules 3.4, 5.6, 10.2), "pause" versus "stop", pausing before the Web app exists, governance, Web app sign-in, the two Web app questions. Q3 from the previous handoff is still open.

## 5. Where I got this
Owner's message in Claude Chat on 8 Nov 2026 at 23:36 SGT, the canvas (version of that time, including his copy edit "Add how you felt" on boards B1-2 and B1-3), and the Telegram guidance in `claude/telegram-bot-design-decisions.md` (Project doc). I did not edit any spec.
