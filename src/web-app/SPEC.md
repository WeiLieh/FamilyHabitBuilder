# Web app: module spec

[2026-11-12 23:24 SGT] Older replaced (superseded) lines were moved word for word to [docs/archive/web-app-SPEC-superseded.md](../../docs/archive/web-app-SPEC-superseded.md) to keep this file short (owner approved).

[2026-10-31 10:12 SGT] The **current rules** of the Web app module: plain web pages a parent opens from a one-tap link. Rule IDs are permanent. The dated history of each decision is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md).

## Purpose
[2026-10-31 10:12 SGT] Show a parent their history, progress, rewards and saved memories (the family memory album and snapshots, from [Variable rewards](../variable-rewards/SPEC.md)), read from the [Datastore](../datastore/SPEC.md). The look comes only from the owner (`CLAUDE.md` rule 6); thin page addresses will live in `api/` (rule S3).

## Code in this folder
- [2026-10-31 10:12 SGT] None yet (development order, step 7).

## Parked questions (decide when designing the Web app)
- [2026-11-01 16:07 SGT] How the Web app reaches the database: through the server with the master key, or with limited per-parent access (rule 11.7 already bars the master key for starting and stopping experiments).
- [2026-11-01 16:07 SGT] Parents' descriptions and Claude: whether descriptions are sent to Claude to write messages, and what sign-up tells parents about it.

## Proposed rule changes (owner decision, design chat, 2026-11-03; awaiting owner approval)
- [2026-11-08 22:34 SGT] **Approved by the owner (8 Nov, start of session 9).** Rule 9.1 changed: My page is the parent's dashboard, and Settings lives inside it. The draft below is kept as history.
[2026-11-03 22:27 SGT] From the Telegram onboarding design ([handoff](../../docs/handoffs/2026-11-03-telegram-onboarding-handoff.md); flow in [src/telegram-bot/SPEC.md](../telegram-bot/SPEC.md)). The current text stays in force until approved.
- [2026-11-03 22:27 SGT] **Proposed change to rule 9.1:** the Web app gains a **settings page** and **"delete a photo"**.
  - Old: "Plain, unstyled pages that show the right data; the look comes from the owner later. 'Delete my data' lives here (WIP until UI design)."
  - New (draft): "... 'Delete my data' and **'delete a photo'** live here, and the **settings page** (choose behaviours and times, reusing the Telegram onboarding conversations; Weekly Wrap Up; **pause**). `/pause` and `/settings` in Telegram link here (the pause speed bump); resume stays in Telegram."
  - Why: the sign-up wording promises "you can delete photos any time in Settings" (rule 5.5 change), and pausing is done here on purpose.
- [2026-11-03 22:27 SGT] For group C: "Open my page" needs a one-tap sign-in tied to the parent (unverified idea: a Telegram Mini App identifies the parent automatically). Until the Web app exists, the link goes to a placeholder.

## Rules at a glance
9.1 plain pages, the owner's look; My page with Settings, "delete my data" and "delete a photo"

## Rules
- **9.1** [2026-11-08 22:34 SGT] Plain, unstyled pages that show the right data; **the look comes from the owner later**. **My page** is the parent's dashboard (`/mypage` in Telegram). **Settings lives inside My page**: behaviours, how often (rule 2.5), times, Weekly Wrap Up and **pause**, reusing the Telegram sign-up conversations; these are the same settings as sign-up screen 8 (rule 3.14). "Delete my data" and **"delete a photo"** live here too. `/pause` and `/settings` in Telegram link here (the pause speed bump); resume stays in Telegram (rule 5.7). *(decided 24 Oct, changed 8 Nov)* Not yet tested (nothing built).
