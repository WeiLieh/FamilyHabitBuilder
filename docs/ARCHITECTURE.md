# Architecture

[2026-10-31 09:40 SGT] The **only** architecture diagram. Box labels: the official module name, then its status. Names and statuses must match the Module table in [docs/SPEC.md](SPEC.md) (section "Modules and structure"); the drift test (`tests/docs-drift.test.ts`) checks this, and checks that code only uses another module where an arrow connects them (rule S7). Telemetry's dotted lines: it listens to events from every module. The owner's original picture is kept as history in `docs/archive/architecture-diagram.png`.

```mermaid
flowchart LR
    telegram["Telegram bot<br/>Not started"]:::todo
    engine["Nudge engine<br/>Decisions built"]:::part
    repository["Nudge repository<br/>Built and live"]:::done
    photo["Photo check<br/>Not started"]:::todo
    rewards["Variable rewards<br/>Design in progress"]:::part
    datastore["Datastore<br/>Nudge tables live"]:::part
    webapp["Web app<br/>Not started"]:::todo
    telemetry["Telemetry<br/>Not started"]:::todo
    experiments["Experiments<br/>Not started"]:::todo

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
    telemetry -.- telegram
    telemetry -.- engine
    telemetry -.- repository
    telemetry -.- photo
    telemetry -.- rewards
    telemetry -.- datastore
    telemetry -.- webapp
    telemetry -.- experiments

    classDef done fill:#2e7d32,color:#ffffff
    classDef part fill:#f9a825,color:#000000
    classDef todo fill:#9e9e9e,color:#000000
```

**Colours:** green = built and tested; yellow = partly built or in design; grey = not started.
