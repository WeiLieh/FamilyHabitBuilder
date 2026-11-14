# Handoff to Claude Code: Web app, My page, "Week so far" tab (14 Nov 2026)

Date: 2026-11-14, about 22:20 Singapore Time. Source: design chat in Claude Chat, Project "Family Habit App". Previews: the three layout files in this package (`layouts/`), made from the private canvas "Week so far: three top-of-screen options", boards **1 Week so far**, **2 Older weeks loaded**, **2b Older weeks: ways to show a reflection**, **3 An older week opens as its own page**. Everything on the boards is **layout, not a look**: the look comes only from the owner (CLAUDE.md rule 6). The names (John, Mia, Ethan), the pictures and the sentences are made-up samples.

## Package contents (the three layouts, nothing else)
The layouts sit in `docs/handoffs/2026-11-14-web-app-week-so-far-layouts/`, next to this note.
| File | Layout |
|---|---|
| `2026-11-14-web-app-week-so-far-layouts/1-week-so-far.html` | Layout 1, this week's page (sections 2 and 3) |
| `2026-11-14-web-app-week-so-far-layouts/2-older-weeks-loaded.html` | Layout 2, the same page after tapping "Show 4 older weeks" (section 4) |
| `2026-11-14-web-app-week-so-far-layouts/3-older-week-page.html` | Layout 3, an older week as its own page (section 5) |
There are no picture files (the drift check treats a .png in the docs as a second architecture diagram). Each file is plain HTML with inline styles, 390 px wide, one file per screen (open in any browser). Layout 2 links each week to layout 3. The texts and numbers in the files are the ones quoted in this note. The reflection-tile variants B and C, the parked options A and C, the titles-inside versions and the earlier wireframes are **not** included (discarded or parked). These files are layout, not a look (CLAUDE.md rule 6): do not copy their colours, fonts or sizes into the code as UI decisions.

## 0. What to do
1. Record section 2 onward as **dated notes** in `src/web-app/SPEC.md` (rule 9.1 and new rules for the tab), in `src/datastore/SPEC.md` (section 5) and `src/telegram-bot/SPEC.md` (rules 5.4, 5.6, 7.6, 7.8 where cross-referenced). Format `[YYYY-MM-DD HH:MM SGT]`. Keep replaced wording as `SUPERSEDED [timestamp]`.
2. The link to this file is already in the document index of `docs/SPEC.md` ("Design handoffs from Claude Chat", habit H10), added in the same commit as this file. Add a change note and update `docs/CATCH-UP.md`.
3. **Do not build anything. Recording only.** The build comes later, after the owner asks for it.
4. "owner decided" = the owner's own answer in this chat on 14 Nov. "default" = my proposal, not yet approved.

## 1. My page has four bottom tabs (owner decided)
| Tab | Name | Job to be done | State |
|---|---|---|---|
| 1 | Week so far | "Reassure me, let me relive it" | designed here (priority) |
| 2 | Habits so far | "Show me we're growing" | not designed yet (priority) |
| 3 | Rewards | "Give me my rewards" | **greyed-out, disabled icon**; the layout must scale to add it later |
| 4 | Settings | "Let me adjust it, let me feel safe" | placeholder; holds pause, delete a photo or line, delete my data, sign out, reminder times, children, consents |

Tapping a tab opens its own page. "Days logged this week" belongs in tab 1 (owner correction). The older photos live in tab 1, behind a button near the bottom (not in a separate tab).

## 2. Layout 1: Week so far (this week's page)
Top to bottom:
1. **Header:** "Hi [parent name]" and "[9 to 15 Nov] with [child] and [child]". Dynamic text.
2. **The week's moment** (best photo) first, with the parent's one-line caption and a dustbin beside it. If the week has no moment, the days-logged block moves up to the top.
3. **"[N] days logged this week"**: a seven-day strip (M T W T F S S, ticks for logged days) and the log rows below it, **one group, one box**. Each row: habit name, child, day, the parent's optional line, the photo if any, a dustbin.
4. **"[N] reflection(s) this week"**: each reflection in its own box, text **verbatim, italic, in double quotes**, a dustbin beside it.
5. **Connection card** (section 3).
6. **Button:** "Show 4 older weeks - back to 12 Oct" (section 4).
7. **Bottom bar** with the four tabs (Rewards greyed out).

Rules for the layout (owner decided):
- **Section titles sit outside and above their boxes**, 20 px, same size and font as the screen's titles.
- **Dustbin:** borderless, 40 px square tap area, muted grey, beside every deletable photo, line and moment. One look everywhere.
- **Delete leaves the log in place** (like Undo, rule 5.8): deleting a photo or a line never removes the habit log. A deleted photo leaves **no copy anywhere** (owner decision, 9 Nov).
- **Log rows are newest first** on this page (Sat, Thu, Wed, Tue, Mon in the sample); layout 3 reads oldest first. A row with a photo shows a 72 px thumbnail; a row without one shows text only (the owner may revisit the order).
- Quiet weeks and weeks with no photo need their own states; not designed yet (section 8).

## 3. The connection card (owner decided structure; wording in 3.3 is a default)
### 3.1 Contents, top to bottom
- Question, exactly rule 5.6's wording: "How connected did you feel with your child ?" (the space before "?" is the owner's text edit; check against rule 5.6).
- "4/5 : For week 9 to 15 Nov" (sample: 4 this week).
- **Five large circles**, filling the width, the number 1 to 5 under each, "not much" under 1 and "very" under 5. Circles up to the answer are filled.
- A divider, then "3.3/5: Average over the 3 weeks before" (sample bars: 3, 3, 4).
- **Four bars**, the rating **on top of each bar**, labels under them: three earlier Mondays ("19 Oct", "26 Oct", "2 Nov") and "This week" (darker bar). The average is the plain mean of those three answers.

### 3.2 Which week the answer belongs to
The answer is given on **Sunday at the Wrap Up** and is saved against **that week's Monday** (`week_starting`), one answer per parent per week. The card on "Week so far" therefore shows the week just ending; before Sunday it shows the "not asked yet" title (3.3).

### 3.3 Title (default, awaiting the owner's wording)
The title compares the answer with the **average of the 3 weeks before**:

| Situation | Title |
|---|---|
| Higher | A closer week |
| About the same | A steady week |
| Lower | A week to lean in |
| First answer ever | Your starting point |
| Not asked yet, or skipped | Sunday's question lands here |

Never a grade, never "worse". **Open:** the "about the same" band. Proposed: half a point either way (the sample 4 against 3.3 is 0.7 apart, so "A closer week" fits). The band must live in `src/settings.ts` (rule 1.4) and the owner must pick it.

## 4. Layout 2: older weeks loaded (same page, extended)
- Tapping the button **appends 4 weeks** below this week, on the **same page**. **How many (4) is a setting** in `src/settings.ts` (rule 1.4).
- **The button's label is computed from what the tap will load.** "Show 4 older weeks - back to 12 Oct"; when fewer remain, "Show 1 more week - 5 to 11 Oct". The label and the weeks loaded must always match (owner decided).
- **Each older week is a folded card**: the week's dates as a title **above** the box ("2 to 8 Nov"), a count line under it, the box with **one tile per thing logged**, a right chevron. **The whole card is a link** to that week's own page (layout 3). No dustbins and no captions in the list.
- Count line wording (owner decided on 14 Nov): "**3 days logged, 1 reflection**" for 2 to 8 Nov; weeks without reflections read "3 days logged: 3 photos", "2 days logged: 2 photos", "1 day logged: 1 photo". The count of days is **days with a habit log**.
- **Tiles:** a photo tile for a log with a photo, shown in date order, oldest first within the week. **Open:** a logged day with a line but no photo has no tile in the sample; the owner has not yet decided what it shows (a text tile like the reflection tile is the obvious candidate). Weeks run Monday to Sunday and are listed **newest first**.
- **Reflection tile (owner decided: variant A):** same size as a photo tile, a quote mark and the first few words ("Read two chapters before bed…") in italic. Variants B (speech-bubble icon only) and C (wider tile) are discarded.
- The list is loaded lazily; the tile images load as thumbnails.

## 5. Layout 3: an older week opens as its own page (owner decided: Option B)
- Opens from a card in layout 2. **Only one navigation control: a "Back" button**; the phone's own back also works. **The bottom bar is hidden**, so the parent cannot get lost.
- Header: week dates, "with [child] and [child]", and the count line, identical to layout 2 ("3 days logged, 1 reflection").
- Then the week **day by day, oldest first** (Mon to Sun): a day title (20 px), a small line "[Habit] · [child]" or "Reflection", then the photo with the parent's line and a dustbin, or the reflection in italic quotes in its own box with a dustbin. Days with nothing logged are not shown.
- **No strip, no weekly moment on this page, and no connection card** (owner decided on 14 Nov: dropped). The sample therefore shows no connection answer for older weeks. **Open:** whether an older week's answer should show somewhere (for example in tab 2, "Habits so far").
- Deleting here follows the same rule as layout 1 (the log stays).

## 6. Rules recorded as decisions
1. **A reflection is not a habit log** (rules 5.4 and 7.6 stand). It never counts toward **days logged**, targets, streaks or steady weeks. It is listed next to the count: "3 days logged, 1 reflection". Owner confirmed this on 14 Nov. The layout-1 sample follows this: 5 days logged (5 habit logs on Mon, Tue, Wed, Thu, Sat) beside a separate "1 reflection".
2. **Weeks run Monday to Sunday.** The weekly moment is optional (one line per week, rule 7.7); moments are never sent to Claude.
3. **"Album" is dropped** as a word in the product (the backlog item "Download my memories" replaces it); the rule 7.7 receipt wording needs a new draft (topic 2 of the design chat).
4. Sign-in is a **one-tap link from Telegram (Option A)**, with the Telegram login as a fallback, a 30-day session, no email or phone number.

## 7. What the Datastore must provide (for the owner to approve before any code)
- **Week page read:** for one parent and one Monday: habit logs (with habit, child, day, line), photos (with the log they belong to), reflections (text, `for_day`, matched habit or none), the moment and its line, the connection answer.
- **Older weeks read, paged:** the next N weeks before a given Monday, with thumbnails and counts, and how many weeks remain.
- **Connection history:** the answers of the 3 weeks before a Monday, and their average.
- **Narrow delete functions** (one each, rule 8.4): delete one photo, delete one line (log, reflection or moment), delete one moment. Each leaves the log in place and leaves no copy of a deleted photo.
- Existing tables used: `habit_logs`, `photos`, `reflections`, `moment_lines`, `connection_answers` (1 to 5, one per parent per week, `week_starting` = Monday).

## 8. Not designed yet / open for the owner
- **Layout 1 vs layout 3 order:** layout 1 lists this week's logs newest first, layout 3 lists an older week oldest first; the owner said "leave it for now".
- **Tab 2 "Habits so far"** (steady weeks, Wrap Up counts, the monthly view, trends), **tab 3 Rewards** page, **tab 4 Settings** content.
- States: a quiet week, a week with no photo, a first-ever week, a parent with no older weeks (button hidden).
- Whether older weeks need **monthly grouping** once there are many.
- Whether to show a "With us since [date]" line.
- The "about the same" band for connection titles (section 3.3).
- Parked in `src/web-app/SPEC.md`: how the Web app reaches the database (server with the master key, or limited per-parent access) and whether parents' descriptions go to Claude.
- Topic 2 of the design chat (the readable bot-message house style for `words.ts`) is not started.

## 9. Not changed
Rules 3.4, 5.5, 5.8 and 8.4 apply as they stand. Rule 9.1 (My page, Settings inside it) stands; this handoff adds the tab structure under it. Nothing is built, no test count changes.
