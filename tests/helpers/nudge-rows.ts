// =============================================================================
// tests/helpers/nudge-rows.ts: ready-made test rows for the Nudge repository
//
// The real nudges live in a Supabase table that the owner edits. Tests must not
// depend on that live content, so they use these made-up rows instead. Each row
// has the same columns as the Supabase table (see shared/nudge-repository.ts).
// =============================================================================

import type { Nudge } from "../../shared/nudge-repository.js";
import { readNudgeRows } from "../../shared/nudge-repository.js";

// Builds one complete, valid row. Pass "overrides" to change just the fields a
// test cares about, for example validRow({ category: "medium" }).
export function validRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    name: "Talking with children",
    category: "quick",
    example_1: "Ask about the best part of their day.",
    example_2: "Ask what made them laugh today.",
    example_3: "Ask about their favourite game.",
    example_4: "Share a short story about your own day.",
    example_5: "At bedtime, ask if anything is on their mind.",
    self_report_allowed: true,
    description_max_chars: 280,
    photo_upload_allowed: false,
    photo_idea: null,
    ...overrides, // fields given by the test replace the defaults above
  };
}

// The same layout as the owner's real table: 4 quick nudges (IDs 1 to 4) and
// 5 deliberate nudges (IDs 5 to 9). Deliberate ones allow photos.
export function nineTestRows(): Record<string, unknown>[] {
  const quick = [1, 2, 3, 4].map((id) =>
    validRow({ id, name: `Quick nudge ${id}`, category: "quick" }),
  );
  const deliberate = [5, 6, 7, 8, 9].map((id) =>
    validRow({
      id,
      name: `Deliberate nudge ${id}`,
      category: "deliberate",
      photo_upload_allowed: true,
      photo_idea: `Photo idea for nudge ${id}`,
    }),
  );
  return [...quick, ...deliberate];
}

// The 9 test rows after they pass the Nudge repository's checks, ready for
// Nudge engine tests.
export function nineTestNudges(): Nudge[] {
  return readNudgeRows(nineTestRows()).nudges;
}
