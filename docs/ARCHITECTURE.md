# Architecture

[2026-10-31 09:40 SGT] The **only** architecture diagram. Box labels: the official module name, then its status. Names and statuses must match the Module table in [docs/SPEC.md](SPEC.md) (section "Modules and structure"); the drift test (`tests/docs-drift.test.ts`) checks this, and checks that code only uses another module where an arrow connects them (rule S7). Telemetry's dotted lines: it listens to events from every module. The owner's original picture is kept as history in `docs/archive/architecture-diagram.png`.

```mermaid
flowchart LR
    telegram["Telegram bot<br/>Daily loop, photos and Wrap Up live"]:::part
    engine["Nudge engine<br/>Decisions built"]:::part
    repository["Nudge repository<br/>Built and live"]:::done
    photo["Photo check<br/>Designed, parked"]:::part
    rewards["Variable rewards<br/>Designed, partly built"]:::part
    datastore["Datastore<br/>Tables live"]:::part
    webapp["Web app<br/>Sign-in, Week so far, look and photos live"]:::part
    telemetry["Telemetry<br/>Designed, not built"]:::part
    experiments["Experiments<br/>Designed, not built"]:::part
    demo["Demo<br/>Design in progress"]:::part

    telegram <--> engine
    repository --> engine
    engine --> rewards
    engine <--> datastore
    telegram --> photo
    photo --> datastore
    telegram --> datastore
    datastore --> webapp
    engine --> experiments
    experiments --> datastore
    telegram <--> demo
    demo --> engine
    demo --> datastore
    telemetry -.- telegram
    telemetry -.- engine
    telemetry -.- repository
    telemetry -.- photo
    telemetry -.- rewards
    telemetry -.- datastore
    telemetry -.- webapp
    telemetry -.- experiments
    telemetry -.- demo

    classDef done fill:#2e7d32,color:#ffffff
    classDef part fill:#f9a825,color:#000000
    classDef todo fill:#9e9e9e,color:#000000
```

**Colours:** [2026-11-11 17:48 SGT] green = built (a status starting with "Built"); yellow = in design or partly built; grey = "Not started" (rule D4).

SUPERSEDED [2026-11-11 17:48 SGT] **Colours:** green = built and tested; yellow = partly built or in design; grey = not started.

[2026-11-24 23:31 SGT] New box **Demo** ("Design in progress", owner, 24 Nov): it uses the Telegram bot (both ways: the bot routes the owner's messages to the demo, and the demo sends through the bot), the Nudge engine and the Datastore; Telemetry ignores demo parents (rule 12.7).

[2026-11-24 23:10 SGT] Statuses (session 20, 24 Nov): Telegram bot "Daily loop, photos and Wrap Up live" (#58 to #60); Web app "Sign-in, Week so far, look and photos live" (#57, #58); Photo check "Designed, parked" (owner, 24 Nov).

[2026-11-15 22:17 SGT] Web app status: "Sign-in and Week so far built" (plain HTML; the look, photos, an older week's own page, Habits so far and Settings still to come).

[2026-11-15 16:42 SGT] Web app status: "Sign-in built, pages to come" (pull request 2 of the foundations: sign-in, the per-parent pass, Sign out; Week so far and the other pages come with the owner's look).

[2026-11-15 11:41 SGT] Telegram bot status: "Planner, B1 and style C live" (#50, 15 Nov).

[2026-11-14 22:24 SGT] Statuses brought up to date: Web app "Design in progress" (the Week so far tab recorded, 14 Nov); Telegram bot "Planner and B1 live" (both went live on 14 Nov).

[2026-11-11 17:44 SGT] Statuses brought up to date (owner, 11 Nov). The drift test now also checks each box's colour fits its status (rule D4 in [docs/SPEC.md](SPEC.md)).
