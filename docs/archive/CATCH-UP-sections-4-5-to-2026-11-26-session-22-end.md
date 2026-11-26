# CATCH-UP sections 4 and 5, as they were before [2026-11-26 23:49 SGT]

[2026-11-26 23:49 SGT] Moved word for word from docs/CATCH-UP.md (CLAUDE.md, H2 addition: sections 4 and 5 hold open items only).

## 4. Questions to think about before next session

[2026-11-26 23:03 SGT] Open items only (CLAUDE.md, H2 addition). The previous version is in [docs/archive/CATCH-UP-sections-4-5-to-2026-11-26-session-22.md](archive/CATCH-UP-sections-4-5-to-2026-11-26-session-22.md), word for word.

**4a. Latest decisions (session 22, 26 Nov)**
- [2026-11-26 23:03 SGT] **UAT is automated (option A):** a Claude session on your computer drives Telegram Web with [docs/UAT-RUNBOOK.md](UAT-RUNBOOK.md); results come back here. Coded tests (option B) are in the backlog.
- [2026-11-26 23:03 SGT] **Tonight's UAT:** 31 pass, U87 fail, U45 blocked; defects DEF-1 to DEF-4 in `docs/KNOWN-ISSUES.md` (DEF-4 left for now). Six "surprises" were the rules working (Undo only for keyboard logs, Not today ends the day, one dustbin per layer, and more).
- [2026-11-26 23:03 SGT] **Settings fixes decided ("all as recommended"):** W1 to W7 in [src/web-app/SPEC.md](../src/web-app/SPEC.md) (proposed change to rule 9.9): the Saved pop-up and staying on the page, greyed quick boxes, a dustbin per child (asks first) and per time, the sliding switch (slides, then reloads), Telegram told only on a change. Look values L14 to L16. Playwright approved as a test-only library. The tests were approved.
- [2026-11-26 23:03 SGT] **Pull request 1 of 2 open, [#68](https://github.com/WeiLieh/FamilyHabitBuilder/pull/68):** migration 018, remove a child. The two review items: "ignore both".

**4b. For you to decide**
- [2026-11-26 23:03 SGT] May `docs/KNOWN-ISSUES.md` (318 lines) have its oldest open entries moved word for word to `docs/archive/`?
- [2026-11-25 23:18 SGT] **Step 2, the look:** the Settings switch and tick boxes, row heights, the Back header, text boxes, the ✓ habit tile, the empty states (list in `docs/KNOWN-ISSUES.md`).
- [2026-11-25 23:18 SGT] **Step 3, Habits so far:** layout wireframes first, then a high-fidelity mock-up shown only to you.

**4c. Still for Claude Chat (bring each back as a handoff file, habit H10)**
- [2026-11-15 17:00 SGT] Tab 2 "Habits so far", tab 3 Rewards later; the empty states; the ✓ habit tile.
- [2026-11-24 23:10 SGT] Words still to draft (B1 drafts, Web app drafts, the photo-consent and "Saved." lines), and **the photo consent wording** for your PDPA reviewer.

**4d. Parked (you asked me not to raise these first)**
- [2026-11-14 10:38 SGT] "Pause" versus "stop"; whether stopping is as easy as starting; the first alpha experiment; the Terms & Conditions page; [2026-11-24 23:10 SGT] the photo check (backlog); [2026-11-14 10:38 SGT] Q12 when the birth year is collected; [2026-11-15 11:41 SGT] list order; how the bot records which child a log was with; [2026-11-26 23:03 SGT] DEF-4 (no 9:30 pm reminder, probably rule 3.8).

---

## 5. Waiting on you (not blocking the next steps)

- [2026-11-26 23:03 SGT] **Run migration 018** in Supabase's SQL Editor, then **merge #68**.
- [2026-11-26 23:03 SGT] **Still to test:** U45, U46, U35, U33 at a reminder (tap the keyboard, not ✅ Done); U70 dark mode on your phone; **Sunday 29 Nov** U79 to U82 and Monday U83 ([src/telegram-bot/UAT-session-20.md](../src/telegram-bot/UAT-session-20.md)); U97 with a test account only. "UAT Child" is still on your account: remove it with the new 🗑 once pull request 2 is live.
- [2026-11-14 10:38 SGT] **PDPA reviewer, one combined list:** agreement wording (Q8) and the `/start` notice; the 90-day record line (K1); photo consent wording and withdrawing it ([2026-11-25 23:18 SGT] Settings now says "to withdraw it, delete your data"); reflections and lines that mention the child.
- [2026-11-14 10:38 SGT] **Nudge personality** ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)) before Claude's warm reply (rule 7.5).
- [2026-11-14 10:38 SGT] **Before launch:** upload MOE school holiday and Singapore public holiday dates; fill in the Terms & Conditions page.
