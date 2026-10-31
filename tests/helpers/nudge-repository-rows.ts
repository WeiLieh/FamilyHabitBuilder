// =============================================================================
// tests/helpers/nudge-repository-rows.ts: ready-made test rows for the Nudge repository
//
// The real nudges live in two Supabase tables the owner edits (spec v1.6):
//   nudges   - one row per nudge, with its settings and a short code (e.g. TWC)
//   examples - one row per example, naming its nudge by that code
// Tests must not depend on that live content, so they use these made-up rows.
// Column names match the Supabase tables (see src/nudge-repository/nudge-repository.ts).
// =============================================================================

import type { Nudge } from "../../src/nudge-repository/nudge-repository.js";
import { readNudgeRows } from "../../src/nudge-repository/nudge-repository.js";

// One complete, valid nudge row. Pass "overrides" to change just the fields a
// test cares about, for example validNudgeRow({ category: "medium" }).
export function validNudgeRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    code: "TWC",
    name: "Talking with children",
    category: "quick",
    self_report_allowed: true,
    description_max_chars: 280,
    photo_upload_allowed: false,
    photo_idea: null,
    active: true, // false = retired: kept for history, but parents can't pick it
    starts_unlocked: true, // false = parents must unlock it before picking it
    ...overrides, // fields given by the test replace the defaults above
  };
}

// One valid example row, belonging to the nudge with code TWC by default.
export function validExampleRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    nudge_code: "TWC",
    example: "Ask about the best part of their day.",
    active: true, // false = retired example
    ...overrides,
  };
}

// Three valid examples for one nudge code (the minimum, spec v1.6), with IDs
// starting at firstId.
export function threeExamples(code: string, firstId: number): Record<string, unknown>[] {
  return [0, 1, 2].map((i) =>
    validExampleRow({ id: firstId + i, nudge_code: code, example: `${code} example ${i + 1}` }),
  );
}

// The same layout as the owner's real tables: 4 quick nudges (IDs 1 to 4, codes
// QK1 to QK4) and 5 deliberate nudges (IDs 5 to 9, codes DL5 to DL9), each with
// 3 examples. Deliberate ones allow photos. Starts unlocked: all 4 quick, plus
// deliberate 5 and 6 (like "spending quality time" and "interesting
// activities"). Deliberate 7, 8 and 9 start locked.
export function nineTestTables(): {
  nudgeRows: Record<string, unknown>[];
  exampleRows: Record<string, unknown>[];
} {
  const nudgeRows = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) =>
    id <= 4
      ? validNudgeRow({ id, code: `QK${id}`, name: `Quick nudge ${id}`, category: "quick" })
      : validNudgeRow({
          id,
          code: `DL${id}`,
          name: `Deliberate nudge ${id}`,
          category: "deliberate",
          photo_upload_allowed: true,
          photo_idea: `Photo idea for nudge ${id}`,
          starts_unlocked: id === 5 || id === 6,
        }),
  );
  const exampleRows = nudgeRows.flatMap((row, i) => threeExamples(row["code"] as string, i * 3 + 1));
  return { nudgeRows, exampleRows };
}

// The 9 test nudges after they pass the Nudge repository's checks, ready for
// Nudge engine tests.
export function nineTestNudges(): Nudge[] {
  const { nudgeRows, exampleRows } = nineTestTables();
  return readNudgeRows(nudgeRows, exampleRows).nudges;
}

// The same 9 test nudges, with one nudge row changed first (e.g. retired).
// Lets other modules' tests get test nudges without reaching into the Nudge
// repository's code themselves (drift rule S5).
export function nineTestNudgesWith(nudgeId: number, changes: Record<string, unknown>): Nudge[] {
  const { nudgeRows, exampleRows } = nineTestTables();
  const changed = nudgeRows.map((row) => (row["id"] === nudgeId ? { ...row, ...changes } : row));
  return readNudgeRows(changed, exampleRows).nudges;
}
