# Product Backlog

[2026-11-12 23:24 SGT] Older replaced (superseded) lines were moved word for word to [docs/archive/PRODUCT-BACKLOG-superseded.md](archive/PRODUCT-BACKLOG-superseded.md) to keep this file short (owner approved).

One entry per item: Item / Why it matters / Priority / Status. Newest first.

## [2026-11-15 12:13 SGT] Write the Terms & Conditions page
- **Item:** [2026-11-15 12:13 SGT] Fill in `public/terms.html`, the page the sign-up agreement links to (rule 5.15).
- **Why it matters:** [2026-11-15 12:13 SGT] A real family must not agree to terms that aren't written (known issue of 15 Nov).
- **Priority:** [2026-11-15 12:13 SGT] High before any real family; parked for now (owner, 15 Nov: not to be raised again until the owner brings it up)
- **Status:** [2026-11-15 12:13 SGT] Not started

## [2026-11-15 12:13 SGT] Sign-in through Telegram's own login (rule 9.3 fallback)
- **Item:** [2026-11-15 12:13 SGT] The fallback sign-in of rule 9.3: Telegram's own login on the Web app, for when the one-tap link doesn't work.
- **Why it matters:** [2026-11-15 12:13 SGT] Rule 9.3 promises it; it needs the Web app's address set in BotFather (Telegram's tool for managing bots), so it is a separate small step.
- **Priority:** [2026-11-15 12:13 SGT] Medium (owner, 15 Nov: deferred until after the Web app foundations)
- **Status:** [2026-11-15 12:13 SGT] Not started

## [2026-11-15 12:13 SGT] A whole-app daily limit on Claude calls
- **Item:** [2026-11-15 12:13 SGT] One daily limit on Claude calls for the whole app, on top of the 20 matching calls per parent (owner decision of 15 Nov).
- **Why it matters:** [2026-11-15 12:13 SGT] Cost: many parents each under their own limit could still add up to a large bill.
- **Priority:** [2026-11-15 12:13 SGT] Low (before beta)
- **Status:** [2026-11-15 12:13 SGT] Not started

## [2026-11-15 10:09 SGT] Scaling plan: what must be done before each stage
- **Item:** [2026-11-15 10:09 SGT] A checklist of what must be true before the app grows past each stage (owner, 15 Nov, from a side chat; summarised here so it is tracked, not remembered). Cost lines are general: the Supabase and Vercel plans were not checked. Stages above 1,000 are outline only, to be planned when the earlier ones are done.
  - **Stage 1, testing (20 to 30 families):** (a) **privacy first, before any real family:** photo consent, "delete my data", and the Web app's sign-in and delete rules (9.3, 9.6) built and tested (known issues); (b) the **alarm run handles only about 50 parents** (known issue, 13 Nov): fine here, but fix before stage 2 (see "Design for the alarm run at scale" below); (c) confirm **which region Vercel runs in** (known issue "Vercel project settings not yet confirmed"; far from Singapore = every request slower); (d) a **daily cap on Claude calls** per parent (known issue) once typed logging and warm replies exist; (e) the Web app loads **phone-sized photos as you scroll** (rule 9.6's "do not store" means photos are downloaded again on every visit).
  - **Stage 2, 100 families:** (a) the **alarm-run scale fix**: process parents in batches or across several runs; (b) **reads of "all parents" fetch in pages** (Supabase returns at most 1,000 rows; today such a read stops with an error); (c) **alerts** when something fails, instead of reading logs (known issue: broken nudge rows are reported but nobody is alerted); (d) **database tests run automatically** on every pull request (known issue); (e) a **photo retention period** decided (known issue: photos kept with no time limit); (f) **invites**: limit how many open invites one account can hold (known issue).
  - **Stage 3, 1,000 families:** (a) **Telegram's sending limit** (about 30 messages a second): queue and pace sends, retry and record failures (rule 1.3); 1,000 parents with the same 7:00 pm slot already take time to send; (b) **paid plans** for Supabase and Vercel (free tiers are for testing), and a **monthly budget alert** for Claude; (c) **backups and a tested restore**; (d) **support**: a way for parents to reach a person, and a short playbook for common problems; (e) **PDPA governance**: a named Data Protection Officer, a data-breach plan (serious breaches must be reported to the regulator and the people affected), a Data Protection Impact Assessment, and an answer on Telegram keeping chat history outside Singapore.
  - **Stage 4, 10,000 families (outline):** sending spread over time or across several workers; database load reviewed (indexes by parent, Row Level Security cost, connection limits); photo storage and download costs reviewed; an on-call rota for alerts; an external security review.
  - **Stage 5, 100,000 families (outline):** a dedicated queue service for sends; read copies of the database or caching for heavy reads (only where privacy rules allow); formal incident response; capacity tests before each big launch.
  - **Stage 6, 1,000,000 families (outline):** an architecture review (a single Supabase project and one Telegram bot may no longer fit); regional and regulatory review; a full-time operations team.
- **Why it matters:** [2026-11-15 10:09 SGT] Several parts are known to break or get expensive well before 5,000 parents (the alarm run at about 50, Telegram's sending limit, the 1,000-row read limit, Claude and photo costs), and children's photos raise the PDPA bar as numbers grow. Don't build for later stages now; check this list before each step up.
- **Priority:** [2026-11-15 10:09 SGT] High for stage 1 (before the alpha); the rest when the previous stage is reached.
- **Status:** [2026-11-15 10:09 SGT] Not started.

## [2026-11-15 09:03 SGT] End the Web app sign-in on every device
- **Item:** [2026-11-15 09:03 SGT] A way to end every My page sign-in at once (for example from Telegram), for a lost or shared phone.
- **Why it matters:** [2026-11-15 09:03 SGT] A sign-in lasts 30 days (rule 9.3); today only Sign out on that phone or "delete my data" ends it.
- **Priority:** [2026-11-15 09:03 SGT] Low (owner, 14 Nov)
- **Status:** [2026-11-15 09:03 SGT] Not started

## [2026-11-14 22:24 SGT] Design My page tab 2, "Habits so far"
- **Item:** [2026-11-14 22:24 SGT] Design tab 2 of My page (rule 9.2): steady weeks, Wrap Up counts, the monthly view, trends; perhaps where older weeks' connection answers show.
- **Why it matters:** [2026-11-14 22:24 SGT] Its job is "show me we're growing", and rule 7.8 moved steady weeks and the monthly view to My page.
- **Priority:** [2026-11-14 22:24 SGT] High (the owner's second priority tab)
- **Status:** [2026-11-14 22:24 SGT] Not started (Claude Chat)

## [2026-11-14 22:24 SGT] Design My page tabs 3 (Rewards) and 4 (Settings)
- **Item:** [2026-11-14 22:24 SGT] Rewards is greyed out for now; Settings is a placeholder holding pause, delete a photo or line, delete my data, sign out, reminder times, children and consents (rules 9.1, 9.2).
- **Why it matters:** [2026-11-14 22:24 SGT] Settings is where "delete my data" and pause live, which the privacy known issues wait for.
- **Priority:** [2026-11-14 22:24 SGT] Medium (Settings), Low (Rewards)
- **Status:** [2026-11-14 22:24 SGT] Not started (Claude Chat)

## [2026-11-14 22:24 SGT] Week so far: the states not designed yet
- **Item:** [2026-11-14 22:24 SGT] A quiet week, a week with no photo, a first-ever week, a parent with no older weeks (button hidden); monthly grouping of older weeks once there are many; a "With us since [date]" line.
- **Why it matters:** [2026-11-14 22:24 SGT] Every parent meets at least one of these in the first weeks; without a design the page could look broken.
- **Priority:** [2026-11-14 22:24 SGT] Medium (before the Web app goes live)
- **Status:** [2026-11-14 22:24 SGT] Not started (Claude Chat)

## [2026-11-14 10:37 SGT] "Welcome back" removes the old copy's buttons
- **Item:** [2026-11-14 10:37 SGT] When the bot sends a sign-up screen again ("Welcome back", or **Continue** on the one sign-up reminder), remove the buttons from the earlier copy of that screen (Telegram bot spec, 10e addition).
- **Why it matters:** [2026-11-14 10:37 SGT] Found in UAT U21 (14 Nov): two identical OK buttons on screen; the old one does nothing, which is confusing.
- **Priority:** [2026-11-14 10:37 SGT] High (owner: fix it; build with B1 in the next Claude Code session)
- **Status:** [2026-11-14 21:40 SGT] Done: built with B1 (tests W1, W2; migration 010), merged in #47; UAT U54 passed.
- **Status:** SUPERSEDED [2026-11-14 21:40 SGT] [2026-11-14 10:37 SGT] Not started

## [2026-11-13 22:31 SGT] Measure whether the sign-up reminder helps
- **Item:** [2026-11-13 22:31 SGT] Keep a count, with no name or ID, of sign-ups that were reminded (Q11b) and whether they then finished, so we can see if the 24-hour reminder works.
- **Why it matters:** [2026-11-13 22:31 SGT] Today the "reminded" mark lives on the sign-up draft, which disappears when the person finishes or is cleaned up, so the answer is lost.
- **Priority:** [2026-11-13 22:31 SGT] Low
- **Status:** [2026-11-13 22:31 SGT] Not started

## [2026-11-12 22:04 SGT] Family accounts (two parents linked)
- **Item:** [2026-11-12 22:04 SGT] Let two parents of the same family link their accounts, so they share children and see each other's logs (onboarding Q10b, 12 Nov).
- **Why it matters:** [2026-11-12 22:04 SGT] In the MVP each parent signs up alone with their own invite; families with two engaged parents may want one shared view.
- **Priority:** [2026-11-12 22:04 SGT] Low (review after the trial)
- **Status:** [2026-11-12 22:04 SGT] Not started

## [2026-11-09 21:49 SGT] Grace period after midnight for logging
- **Item:** [2026-11-09 21:49 SGT] A short grace period after midnight, for example a log before 3 am still counts as the previous day (B1 part 2 handoff, backlog idea).
- **Why it matters:** [2026-11-09 21:49 SGT] Logging is now for today only (rule 5.4); a parent who logs at 12:30 am about the evening would otherwise lose it.
- **Priority:** [2026-11-09 21:49 SGT] Low (review after the trial)
- **Status:** [2026-11-09 21:49 SGT] Not started

## [2026-11-01 16:07 SGT] "What's running" timeline for experiments
- **Item:** [2026-11-01 16:07 SGT] An owner-only page showing each value as a row and each experiment as a bar over time (Control and Test, start and stop), plus the settings versions. Owned by the Experiments module, with a link from Telemetry's results.
- **Why it matters:** [2026-11-01 16:07 SGT] Lets the owner see at a glance when two or more experiments run at once (Datastore draft, 1 Nov). Week one has no experiments.
- **Priority:** [2026-11-01 16:07 SGT] Medium (before alpha)
- **Status:** [2026-11-01 16:07 SGT] Not started

## [2026-10-31 21:28 SGT] Build "delete my data" once, with a non-personal deletion log
- **Item:** [2026-10-31 21:28 SGT] One app-wide "delete my data" (rule 1.5) that reaches every store (Supabase tables and Storage, Upstash chat memory, experiment records) through one narrow database function, and writes a deletion log with no personal details.
- **Why it matters:** [2026-10-31 21:28 SGT] Required before real families send photos (`docs/KNOWN-ISSUES.md`) and by the Singapore Personal Data Protection Act (PDPA); the log shows deletions happen without keeping who was deleted (privacy review of the Experiments pull request, owner agreed).
- **Priority:** [2026-10-31 21:28 SGT] High (before real families join)
- **Status:** [2026-10-31 21:28 SGT] Not started

## [2026-10-31 19:06 SGT] Alpha and beta stages
- **Item:** [2026-10-31 19:06 SGT] After the week-one trial (about 12 parents, rule 10.3): **alpha**, 50 to 100 parents growing to about 1,000, with the first real experiment (suggestion: message style); then **beta**, limited publicity, up to about 5,000 parents, still experimenting.
- **Why it matters:** [2026-10-31 19:06 SGT] The owner's expected growth path (31 Oct). Experiments need bigger groups than week one can give (rule 11.3).
- **Priority:** [2026-10-31 19:06 SGT] Medium (after the MVP)
- **Status:** [2026-10-31 19:06 SGT] Not started

## [2026-10-31 19:06 SGT] Check the technology stack holds at 1,000 to 5,000 parents, before alpha
- **Item:** [2026-11-13 23:33 SGT] **Design for the alarm run at scale (owner, 13 Nov, after the pull request 3c review).** Today each 10-minute run reads every parent's last 14 days, and stops with an error if any answer reaches Supabase's 1,000-row cap (about 50 parents). At 5,000 parents: about 200,000 rows a run, most parents on the same default 7:00 pm slot, and about 3 minutes to send 5,000 nudges at Telegram's roughly 30 a second, longer than one Vercel run is allowed. Design: (1) ask the database only for parents whose slot is now; (2) read and plan in pages of about 200 parents; (3) spread the sending over the slot's three runs, each sending a share (the one-nudge-per-slot rule 8.6 stops doubles); (4) if still too slow, a sending queue (a new vendor: owner's approval). Test with made-up parents before alpha.
- **Item:** [2026-10-31 19:06 SGT] The stack was chosen for about 50 trial users (Supabase Free plan, Vercel, Upstash). Before alpha, check limits, costs and the scheduler at 1,000 to 5,000 parents.
- **Why it matters:** [2026-10-31 19:06 SGT] Scaling problems are cheaper to find before strangers rely on the app.
- **Priority:** [2026-10-31 19:06 SGT] Medium (before alpha)
- **Status:** [2026-10-31 19:06 SGT] Not started

## [2026-10-31 19:06 SGT] Experiments: live start and stop, and splitting metrics by variant
- **Item:** [2026-10-31 19:06 SGT] Build the owner-only start and stop for experiments (rules 11.7, 11.10), choose the first experiment, and split the 10 metrics by variant in Telemetry (reward experiments also read against metric 10).
- **Why it matters:** [2026-10-31 19:06 SGT] Needed before alpha; week one runs on `baseline` only (rule 11.3).
- **Priority:** [2026-10-31 19:06 SGT] Medium (before alpha)
- **Status:** [2026-10-31 19:06 SGT] Not started

## [2026-10-31 18:04 SGT] See whether the Weekly Wrap Up makes parents mute the bot
- **Item:** [2026-10-31 18:04 SGT] In Telemetry, track mutes and stops within 24 hours of a Weekly Wrap Up, as well as metric 9 (which never counts the Wrap Up as a nudge, rule 10.2).
- **Why it matters:** [2026-10-31 18:04 SGT] Otherwise we can't tell whether the Wrap Up itself drives opt-outs (privacy and security review of PR B, low finding; owner agreed).
- **Priority:** [2026-10-31 18:04 SGT] Medium (with Telemetry, step 6)
- **Status:** [2026-10-31 18:04 SGT] Not started

## [2026-10-31 17:53 SGT] "Another idea" button on nudge messages
- **Item:** [2026-10-31 17:53 SGT] A button on each nudge message that swaps in a different example (v0.1's "Swap"), once per message.
- **Why it matters:** [2026-10-31 17:53 SGT] Gives parents more choice in the moment. Left out of the MVP by the owner (D6): it adds complexity, and parents might tap it repeatedly instead of acting. Nudge messages keep only Done and Not today (rule 3.5).
- **Priority:** [2026-10-31 17:53 SGT] Low (revisit at the trial review)
- **Status:** [2026-10-31 17:53 SGT] Not started

## [2026-10-31 17:44 SGT] Content review of the examples approved "for now"
- **Item:** [2026-10-31 17:44 SGT] The owner reviews the wording of the 25 drafted examples added on 31 Oct (5 each for SAF, DPR, GAT, ITE, ASD), plus the 7 from the v0.1 surprise cards, as part of a wider content design pass. Edits happen in Supabase (retire, never delete, rule 4.6) and are mirrored in the seed file.
- **Why it matters:** [2026-10-31 17:44 SGT] The owner approved them "for now" (decision D6) so the trial has variety; they have not had a full content design review.
- **Priority:** [2026-10-31 17:44 SGT] Medium (before the trial)
- **Status:** [2026-10-31 17:44 SGT] Not started

## [2026-10-29 20:58 SGT] WIP: Design the Variable rewards (all categories)
- **Why it matters:** Rewards are the "Variable Reward" step of the Hooked model, but so far we only have a list of types. Each category needs rules, content and variety before it can be built (owner, session 4). Known so far:
  - **Encouraging phrases:** wording and variety, defined with the nudge personality (`docs/NUDGE-CONTEXT.md`)
  - **Badges:** which badges, criteria, and graphics (the look comes from the owner)
  - **XP:** points per log (quick, deliberate), double XP for unprompted logs (rule 7.2)
  - **Levels:** thresholds and names
  - **Progress bar:** what it measures and when it fills
  - **Streaks:** already decided (rule 7.3), but how they are shown
  - **Snapshots:** weekly and monthly content
  - **Unlocks:** how a locked nudge is earned (rule 2.2)
  - **Celebrating repeat logs and unchosen behaviours** (rule 5.4)
  - **Other categories still to brainstorm,** each with its own variety
  - Where it lives: probably reward content as data (like the nudges) plus a rules module in code
  - [2026-10-29 20:58 SGT] Points to weigh in the session: (a) a predictable reward is a fixed reward, not a "variable" one in the Hooked sense, so variety must come from other categories; (b) double XP for unprompted logs could be gamed (e.g. waiting more than 4 hours after a nudge before logging); consider "logged before that behaviour's first nudge of the day" as the trigger instead.
- **Priority:** [2026-10-29 20:58 SGT] High (needed before step 4 of the development order)
- **Status:** [2026-10-29 20:58 SGT] In progress (WIP). Needs a dedicated design session with the owner.
- [2026-10-29 22:03 SGT] Owner supplied a first spec (`docs/variable-rewards-spec-v0.1-original.md`); Claude adapted it to our rules as `docs/VARIABLE-REWARDS-SPEC.md` (v0.2 draft) with 9 decisions (D1 to D9) for the owner.

## [2026-10-28 22:08 SGT] WIP: Celebrate repeat logs and logs of unchosen behaviours
- **Why it matters:** A parent who hugs their child twice in a day, or does a behaviour they didn't choose, is making extra effort. These count once (or not at all) toward targets and streaks, but the owner does not want that progress discounted.
- **Priority:** [2026-10-28 22:08 SGT] Medium
- **Status:** [2026-10-28 22:08 SGT] In progress (WIP). Design with the Variable rewards (e.g. bonus XP, a special encouraging phrase, or a "bonus moments" count in the snapshot).

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
- **Status:** [2026-10-31 18:00 SGT] Done: 5 full weeks per family from its first full Monday, 5 to 10 families (D9, Telemetry rule 10.3).
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
