# Product Backlog

One entry per item: Item / Why it matters / Priority / Status. Newest first.

## [2026-10-28 20:53 SGT] BEFORE LAUNCH: owner uploads MOE school holiday dates
- [2026-10-28 21:21 SGT] **Update:** also upload **Singapore public holiday dates** (published by the Ministry of Manpower (MOM)). Both lists decide whether a day is a school day or a non-school day (spec v1.7, answer 11).
- **Why it matters:** "To school" nudge messages during school holidays would feel odd and careless. Dates for primary schools (children 7 to 12) are public on the MOE website.
- **Priority:** [2026-10-28 20:53 SGT] High (required before real families use the app)
- **Status:** [2026-10-28 20:53 SGT] Not started. Claude to remind the owner before launch and provide the upload format.

## [2026-10-28 20:53 SGT] Keep school holiday dates up to date automatically
- **Why it matters:** Manual uploads can be forgotten each year. Options include a periodic check of the MOE website. Mechanics not yet thought through (owner).
- **Priority:** [2026-10-28 20:53 SGT] Low
- **Status:** [2026-10-28 20:53 SGT] Not started.

## [2026-10-28 20:37 SGT] WIP: How much open conversation the bot supports
- **Why it matters:** Parents may chat beyond logging (asking for ideas or advice). The architecture allows it (Claude as brain, Upstash Redis for chat context), but the scope, safety limits and cost are not decided. Replies never count toward the 3-a-day cap (spec v1.7).
- **Priority:** [2026-10-28 20:37 SGT] Medium
- **Status:** [2026-10-28 20:37 SGT] In progress (WIP). Decided with the nudge personality work (`docs/NUDGE-CONTEXT.md`).

## [2026-10-24 22:09 SGT] WIP: Tag each example with the moment(s) it fits
- **Why it matters:** So a nudge message sent at dinner uses a dinner example, not a bedtime one. Agreed in spec v1.3.
- **Priority:** [2026-10-24 22:09 SGT] Medium
- **Status:** [2026-10-24 22:09 SGT] In progress (WIP). Best done once the weekend moments are defined. Who drafts the tags (owner or Claude) to be agreed.

## [2026-10-24 18:34 SGT] WIP: Weekend nudge moments
- **Why it matters:** [2026-10-24 18:34 SGT] Weekday nudges follow everyday moments (to school, dinner, bedtime). Weekends need their own set before weekend nudges can be sent.
- **Priority:** [2026-10-24 18:34 SGT] High
- **Status:** [2026-10-24 18:34 SGT] In progress (WIP). Product manager to define. Also tracked in `docs/KNOWN-ISSUES.md`.

## [2026-10-24 18:34 SGT] WIP: Trial length
- **Why it matters:** [2026-10-24 18:34 SGT] Metrics 6 and 7 (success tests Y and Z) use "the final 4 weeks" and "the final 2 weeks", so the trial must be at least 4 weeks long.
- **Priority:** [2026-10-24 18:34 SGT] High
- **Status:** [2026-10-24 18:34 SGT] In progress (WIP). Product manager to decide. Also tracked in `docs/KNOWN-ISSUES.md`.

## [2026-10-24 18:26 SGT] WIP: "Delete my data" on the web page
- **Why it matters:** [2026-10-24 18:26 SGT] Photos are kept until the parent deletes them, so parents need a clear way to delete all their data. Required by the agreed spec (question 1 and 18).
- **Priority:** [2026-10-24 18:26 SGT] High
- **Status:** [2026-10-24 18:26 SGT] In progress (WIP). Built when the product manager designs the UI.

## [2026-10-24 18:26 SGT] WIP: XP values and level thresholds
- **Why it matters:** [2026-10-24 18:26 SGT] XP and levels are reward type 2. The values are not decided yet.
- **Priority:** [2026-10-24 18:26 SGT] High
- **Status:** [2026-10-24 18:26 SGT] In progress (WIP). Decided when the product manager defines the rewards.

## [2026-10-24 18:26 SGT] WIP: Context collected from parents for AI-written nudges
- **Why it matters:** [2026-10-24 18:26 SGT] Nudges are AI-written from day one, using context from the parent (for example, child's interests). What we ask for, and how, is not decided yet.
- **Priority:** [2026-10-24 18:26 SGT] High
- **Status:** [2026-10-24 18:26 SGT] In progress (WIP). Defined together with the rewards.

## [2026-10-25 06:59 SGT] WIP: How a parent earns an unlock (bigger menu)
- **Why it matters:** [2026-10-25 06:59 SGT] Some nudges start locked (3 deliberate today). A parent can pick them only after unlocking them. The code already refuses locked nudges and accepts ones a parent has unlocked; what earns an unlock is not decided yet (spec v1.5).
- **Priority:** [2026-10-25 06:59 SGT] Medium
- **Status:** [2026-10-25 06:59 SGT] In progress (WIP). Defined together with the rewards. Replaces the item below.

## [2026-10-24 18:26 SGT] WIP: Rule for unlocking more behaviours
- [2026-10-25 06:59 SGT] SUPERSEDED by the item above: an unlock now opens more nudges, it does not allow choosing more at once.
- **Why it matters:** [2026-10-24 18:26 SGT] Parents start with 2 quick and 1 deliberate behaviour. Choosing more is an unlock they earn; the earning rule is not decided yet.
- **Priority:** [2026-10-24 18:26 SGT] Medium
- **Status:** [2026-10-24 18:26 SGT] In progress (WIP). Defined together with the rewards.

## [2026-10-24 17:39 SGT] Social validation: co-parent high-five
- **Why it matters:** [2026-10-24 17:39 SGT] Lets two parents in one household encourage each other, which may raise engagement.
- **Priority:** [2026-10-24 17:39 SGT] Medium
- **Status:** [2026-10-24 17:39 SGT] Not started (parked from the MVP spec)

## [2026-10-24 17:39 SGT] Social validation: leaderboard of local families
- **Why it matters:** [2026-10-24 17:39 SGT] Social comparison can motivate, but it needs care so it does not feel pushy or shaming.
- **Priority:** [2026-10-24 17:39 SGT] Low
- **Status:** [2026-10-24 17:39 SGT] Not started (parked from the MVP spec)
