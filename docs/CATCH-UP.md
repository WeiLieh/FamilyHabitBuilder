# Catch-up page: read this first after time away

**Last updated: [2026-10-31 21:32 SGT]** (session 6 ended). Claude updates this page at the end of every session and shows it at the start of the next. Unlike the other project files, this page is a **current snapshot**: it is rewritten each time, and older versions stay in Git history. The dated, never-deleted record of each decision is in `docs/SPEC.md` (Change notes).

Contents: 1. Module map · 2. Modules: purpose, files and tests · 3. Rules: where each one lives · 4. Questions to think about before next session · 5. Waiting on you

---

## 1. Module map

The modules from your architecture diagram, coloured by progress (9 since 31 Oct: Experiments added [2026-10-31 19:06 SGT]). Numbers match the table in section 2.

[2026-10-31 09:40 SGT] The module map now lives in one place: **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** (also the source of each module's status, checked by the drift test).

**Colours:** green = built and tested; yellow = partly built; grey = not started.

**Development order (agreed):** (1) Nudge repository, then Nudge engine decisions ✅ done → (2) Datastore with event log ⬅ **next after Batch 3** → (3) Telegram bot, first deploy → (4) Variable rewards, then Nudge engine words → (5) Photo check → (6) Telemetry → (7) Web app.

---

## 2. Modules: purpose, files and tests

[2026-10-31 10:17 SGT] Each module's purpose, its files and what each one does, and which tests check it are in the module's own spec, next to its code. Status is in the diagram ([docs/ARCHITECTURE.md](ARCHITECTURE.md)).

| Module | Spec |
|---|---|
| Telegram bot | [src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md) |
| Nudge engine | [src/nudge-engine/SPEC.md](../src/nudge-engine/SPEC.md) (and its AI personality, [NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)) |
| Nudge repository | [src/nudge-repository/SPEC.md](../src/nudge-repository/SPEC.md) |
| Photo check | [src/photo-check/SPEC.md](../src/photo-check/SPEC.md) |
| Variable rewards | [src/variable-rewards/SPEC.md](../src/variable-rewards/SPEC.md) (and its working design, [DESIGN.md](../src/variable-rewards/DESIGN.md)) |
| Datastore | [src/datastore/SPEC.md](../src/datastore/SPEC.md) |
| Web app | [src/web-app/SPEC.md](../src/web-app/SPEC.md) |
| Telemetry | [src/telemetry/SPEC.md](../src/telemetry/SPEC.md) |
| Experiments | [src/experiments/SPEC.md](../src/experiments/SPEC.md) (added 31 Oct) and its plain-English plans, [EXPERIMENTS.md](../src/experiments/EXPERIMENTS.md) |

Cross-cutting files (`src/settings.ts`, `src/sgt.ts`, `api/health.ts` and the test helpers) are listed in [docs/SPEC.md](SPEC.md), section "Modules and structure".

---

## 3. Rules: where each one lives

[2026-10-31 10:17 SGT] Every rule is written **once**, with its permanent ID, and each module spec starts with a "rules at a glance" list.
- **1.1 to 1.3** (users, Singapore time, no fallbacks): [docs/SPEC.md](SPEC.md), "Cross-cutting rules"
- **2.1 to 2.4, 3.1 to 3.11**: [Nudge engine](../src/nudge-engine/SPEC.md)
- **4.1 to 4.6**: [Nudge repository](../src/nudge-repository/SPEC.md)
- **5.1, 5.3, 5.4**: [Telegram bot](../src/telegram-bot/SPEC.md) · **5.2**: [Telemetry](../src/telemetry/SPEC.md) · **5.5**: [Datastore](../src/datastore/SPEC.md)
- **6.1**: [Photo check](../src/photo-check/SPEC.md)
- **7.1 to 7.6**: [Variable rewards](../src/variable-rewards/SPEC.md)
- **8.1, 8.2**: [Datastore](../src/datastore/SPEC.md)
- **9.1**: [Web app](../src/web-app/SPEC.md)
- **10.1**: [Telemetry](../src/telemetry/SPEC.md)
- Structure rules (S, R, D, B, P) and retired rule IDs: [docs/SPEC.md](SPEC.md), "Modules and structure"

---

## 4. Questions to think about before next session

[2026-10-31 21:32 SGT] "Agree" is enough where there's a suggestion. (Done in session 6: PRs #11 to #14 merged, examples applied, the `-pr-b` branch deleted.)
1. **Datastore table mock-ups (next in code):** anything you want in or out before I draft them? The planned list is in [src/datastore/SPEC.md](../src/datastore/SPEC.md), "Planned for the Datastore build".
2. **PR A review leftovers:** log "the database doesn't block the same example twice for one nudge" as a known issue? Leave "today" out of the time-word test? (Suggested: yes, and yes.)
3. **Test title wording:** may I reword the title of the choice-limits test (`tests/nudge-engine-choices.test.ts`), which still mentions the old `docs/EXPERIMENTS.md`, in a small pull request? It checks the same numbers. (Suggested: yes.)
4. **Claude Chat, not blocking:** the first alpha experiment (suggestion: message style).

---

## 5. Waiting on you (not blocking the next steps)
- [2026-10-31 16:47 SGT] DONE: Run the unlock script (section 4)
- [2026-10-31 18:04 SGT] DONE: all rewards decisions D1 to D11 answered (31 Oct).
- SUPERSEDED [2026-10-31 18:04 SGT] [2026-10-31 17:46 SGT] Rewards decisions D8 to D10 (section 4); D5 to D7 answered on 31 Oct.
- SUPERSEDED [2026-10-31 17:46 SGT] Rewards decisions D5 to D10 (section 4)
- Nudge personality ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)), which now also guides Claude's validation replies (rule 7.5); context collected from parents; how much free chat the bot supports
- Badge graphics and the look of every screen (Web app, setup)
- **Before launch:** upload MOE school holiday and Singapore public holiday dates
- [2026-10-31 19:18 SGT] First alpha experiment (plans in [src/experiments/EXPERIMENTS.md](../src/experiments/EXPERIMENTS.md))
- SUPERSEDED [2026-10-31 19:18 SGT] Experiment mechanics (parked in `docs/EXPERIMENTS.md`)
