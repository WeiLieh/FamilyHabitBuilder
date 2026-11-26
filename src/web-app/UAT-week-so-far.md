# UAT: Week so far (U63 to U69 plain HTML; U70 to U72 the owner's look)

[2026-11-15 22:17 SGT] The owner's phone tests for My page's Week so far tab (rules 9.2, 9.4 to 9.7). No setup is needed: merging the pull request deploys it. Sign in with `/mypage` first. The page is plain and unstyled on purpose (CLAUDE.md rule 6).

[2026-11-26 22:38 SGT] **Results, 26 Nov evening:** Run by Claude in Telegram Web on the owner's computer ([docs/UAT-RUNBOOK.md](../../docs/UAT-RUNBOOK.md)), 26 Nov 21:25 to 22:32 SGT; the owner tapped every My page step. Defects DEF-1 to DEF-4 are in [docs/KNOWN-ISSUES.md](../../docs/KNOWN-ISSUES.md). **Pass:** U63 to U69, U71, U72. **Not run:** U70 (dark mode on the phone). Owner to judge: the header says "Hi John Tan" (the saved name; rule 9.4 says "Hi [parent's name]"). By design: a log with a photo shows one 🗑, for the photo; the line's 🗑 comes once the photo is gone (rule 9.6, one layer per tap).

| ID | Do this | Expect | Result |
|---|---|---|---|
| U63 | Sign in with `/mypage` | "Hi [first name]", the week's dates "with [children]", the M to S strip with ✓ on each day you logged, then your logs newest first | [x] PASS, 26 Nov |
| U64 | Look at the reflections and the connection card | "[N] reflection(s) this week" with your words in italics and quotes; "How connected did you feel with your child?" with a bar per answered week and "–" for a week without one (or "Your first answer arrives on Sunday.") | [x] PASS, 26 Nov |
| U65 | Tap the 🗑 next to a log's line | A page: "Delete this line? It will be gone for good. Your log stays." with **Cancel** and **Delete** | [x] PASS, 26 Nov |
| U66 | Tap **Cancel** | Back on Week so far; the line is still there | [x] PASS, 26 Nov |
| U67 | Tap 🗑 again, then **Delete** | Back on Week so far; the line is gone, the log is still listed and still counted | [x] PASS, 26 Nov |
| U68 | Tap the older weeks button (if you joined more than a week ago) | Your older weeks listed below, each with its dates and count line | [x] PASS, 26 Nov |
| U70 | [2026-11-24 21:57 SGT] Open Week so far with your phone in **dark mode** | The page stays white; ticks are filled green circles; boxes have rounded corners; the dustbin is an outline icon | [ ] NOT RUN (phone), 26 Nov |
| U71 | [2026-11-24 21:57 SGT] Look at the connection card and the tab bar | Bars stand upright, "This week" in deep green; the tab bar stays at the bottom while you scroll, with "Week so far" in green | [x] PASS, 26 Nov |
| U72 | [2026-11-24 21:57 SGT] Tap a dustbin | **Cancel** is an outlined button and **Delete** is red | [x] PASS, 26 Nov |
| U69 | Tap each tab | Habits so far says "coming soon"; Rewards can't be tapped; [2026-11-25 22:32 SGT] Settings shows its list (UAT-settings.md) | [x] PASS, 26 Nov |

## [2026-11-26 23:39 SGT] The look of 25 Nov (U111 to U116)
| Step | Do this | Expect | Result |
|---|---|---|---|
| G19 | Supabase > SQL Editor: paste `src/datastore/supabase/migrations/019_older_week_tile_codes.sql` > Run (before or after merging the look's pull request; either order works) | "Success. No rows returned" | [ ] |

| ID | Do this | Expect | Result |
|---|---|---|---|
| U111 | Open **Week so far** | A pale mint page; the boxes are white cards with soft shadows and rounder corners, no grey borders; the text in a softer, rounded font | [ ] |
| U112 | Look at the day strip | Logged days are filled green with a white tick; **today** (if not logged yet) has a green outline; other days are grey rings | [ ] |
| U113 | Look at the tab bar and a dustbin | Week so far is green and bold with a short bar above its icon; the other tabs and the dustbins are faded; Rewards fainter still. **In bright daylight**, can you still read the faded labels? (your 26 Nov choice: keep 40%) | [ ] |
| U114 | Tap **Show 4 older weeks** | The button is a green outlined pill; in each older week, a log without a photo is a coloured tile with its habit's icon (for example a pink heart for Showing affection); a reflection is a pale green tile in italics | [ ] |
| U115 | Open a log with a photo | The photo is big, with rounded corners and a soft shadow, no border | [ ] |
| U116 | Open **Settings**, then **Children** | The same mint page and greens; Settings' boxes keep their thin border | [ ] |
