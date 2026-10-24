# Known Issues

## Open

### [2026-10-24 18:26 SGT] Weekend nudge moments not defined
- **Issue:** [2026-10-24 18:26 SGT] Weekday nudges follow everyday moments (to school, dinner, bedtime). Weekends need a separate set, not defined yet.
- **Impact:** [2026-10-24 18:26 SGT] The bot cannot send weekend nudges until these are defined.
- **Workaround:** [2026-10-24 18:26 SGT] None. Product manager to define the weekend moments.

### [2026-10-24 18:26 SGT] Trial length not decided
- **Issue:** [2026-10-24 18:26 SGT] Metrics 6 and 7 (target-hit rate, unprompted log rate) use "the final 4 weeks" and "the final 2 weeks", so they need a trial length of at least 4 weeks.
- **Impact:** [2026-10-24 18:26 SGT] Success tests Y and Z cannot be calculated without it.
- **Workaround:** [2026-10-24 18:26 SGT] None yet. Product manager to decide (see the Settings sheet of the metrics file).

### [2026-10-24 18:26 SGT] Photos kept with no time limit
- **Issue:** [2026-10-24 18:26 SGT] Photos (which may show children) are kept until the parent deletes their data. The PDPA expects organisations to stop keeping personal data once it is no longer needed.
- **Impact:** [2026-10-24 18:26 SGT] Fine for a friends trial with consent; a reviewer would question it before opening to the public.
- **Workaround:** [2026-10-24 18:26 SGT] Consent at sign-up plus the "delete my data" function. Revisit before any public launch.

## Resolved

### [2026-10-24 17:39 SGT] How long photos of children are kept
- [2026-10-24 18:26 SGT] **Resolved:** photos are kept until the parent deletes their data, with consent at sign-up (spec version 1.1). The remaining privacy risk is tracked above under "Photos kept with no time limit".
- **Issue:** [2026-10-24 17:39 SGT] The spec stores photos (which may show children) but does not say how long they are kept or how they are deleted.
- **Impact:** [2026-10-24 17:39 SGT] Must be decided before real families use the app. Personal data of children is sensitive (for example under Singapore's Personal Data Protection Act (PDPA)).
- **Workaround:** [2026-10-24 17:39 SGT] None yet. Do not onboard real families until decided.

- [2026-10-24 17:39 SGT] Nothing resolved yet. SUPERSEDED [2026-10-24 18:26 SGT]
