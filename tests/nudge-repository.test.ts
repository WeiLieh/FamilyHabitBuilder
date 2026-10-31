// =============================================================================
// tests/nudge-repository.test.ts: what counts as a valid nudge and example
//
// The Nudge repository is two Supabase tables the owner edits directly
// (spec v1.6): "nudges" (settings, one row per nudge) and "examples" (one row
// per example, linked by the nudge's code). The app checks every row it reads.
// A broken row is left out and reported; the others keep working. A nudge with
// fewer than 3 active examples keeps working but is flagged to the owner.
// Nothing is ever patched with made-up values (CLAUDE.md rule 9).
// =============================================================================

import { describe, expect, it } from "vitest";
import { readNudgeRows } from "../src/nudge-repository/nudge-repository.js";
import { MIN_EXAMPLES_PER_NUDGE } from "../src/settings.js";
import { nineTestTables, threeExamples, validExampleRow, validNudgeRow } from "./helpers/nudge-repository-rows.js";

// Helper: read one nudge (with its 3 examples) after changing some of its fields.
function readOneNudge(overrides: Record<string, unknown>) {
  return readNudgeRows([validNudgeRow(overrides)], threeExamples("TWC", 1));
}

// Helper: all reasons for the first problem, as one sentence to search in.
function firstReasons(result: ReturnType<typeof readNudgeRows>): string {
  return result.problems[0]?.reasons.join(" ") ?? "";
}

describe("Nudge repository: nudge rows", () => {
  it("accepts a complete, correct nudge and attaches its active examples", () => {
    const result = readNudgeRows([validNudgeRow()], threeExamples("TWC", 1));
    expect(result.problems).toEqual([]);
    expect(result.shortages).toEqual([]);
    expect(result.nudges).toEqual([
      {
        id: 1,
        code: "TWC",
        name: "Talking with children",
        category: "quick",
        examples: [
          { id: 1, text: "TWC example 1" },
          { id: 2, text: "TWC example 2" },
          { id: 3, text: "TWC example 3" },
        ],
        selfReportAllowed: true,
        descriptionMaxChars: 280,
        photoUploadAllowed: false,
        photoIdea: null,
        active: true,
        startsUnlocked: true,
      },
    ]);
  });

  it("accepts all 9 nudges laid out like the owner's tables", () => {
    const { nudgeRows, exampleRows } = nineTestTables();
    const result = readNudgeRows(nudgeRows, exampleRows);
    expect(result.problems).toEqual([]);
    expect(result.nudges.filter((n) => n.category === "quick")).toHaveLength(4);
    expect(result.nudges.filter((n) => n.category === "deliberate")).toHaveLength(5);
  });

  it("refuses a category other than 'quick' or 'deliberate'", () => {
    const result = readOneNudge({ category: "medium" });
    expect(result.nudges).toEqual([]); // the nudge is left out
    expect(firstReasons(result)).toMatch(/category/i);
  });

  it("refuses a blank name", () => {
    const result = readOneNudge({ name: "   " }); // only spaces counts as blank
    expect(result.nudges).toEqual([]);
    expect(firstReasons(result)).toMatch(/name/i);
  });

  it("refuses a code that is blank, lower case, or has spaces or symbols", () => {
    // Codes are 2 to 10 capital letters or digits, e.g. TWC or SQT.
    for (const code of ["", "twc", "T W", "TW-C", "T", "ABCDEFGHIJK"]) {
      const result = readOneNudge({ code });
      expect(result.nudges).toEqual([]);
      expect(firstReasons(result)).toMatch(/code/i);
    }
  });

  it("refuses yes/no columns that are not a yes or no", () => {
    // In Supabase, yes/no columns hold true or false. Text or an empty cell is refused.
    expect(readOneNudge({ self_report_allowed: "Yes" }).nudges).toEqual([]);
    expect(readOneNudge({ self_report_allowed: null }).nudges).toEqual([]);
    expect(readOneNudge({ photo_upload_allowed: "maybe" }).nudges).toEqual([]);
    expect(readOneNudge({ active: "Yes" }).nudges).toEqual([]);
    expect(firstReasons(readOneNudge({ starts_unlocked: "no" }))).toMatch(/starts unlocked/i);
  });

  it("refuses a nudge that allows photos but has no photo idea", () => {
    const result = readOneNudge({ photo_upload_allowed: true, photo_idea: " " });
    expect(result.nudges).toEqual([]);
    expect(firstReasons(result)).toMatch(/photo idea/i);
  });

  it("accepts a nudge without a photo idea when photos are not allowed", () => {
    expect(readOneNudge({ photo_upload_allowed: false, photo_idea: null }).nudges).toHaveLength(1);
  });

  it("refuses a nudge that allows neither self-report nor photos", () => {
    const result = readOneNudge({ self_report_allowed: false, photo_upload_allowed: false });
    expect(result.nudges).toEqual([]);
    expect(firstReasons(result)).toMatch(/at least one way to log/i);
  });

  it("refuses a description limit that is not a whole number from 1 to 280", () => {
    expect(readOneNudge({ description_max_chars: 0 }).nudges).toEqual([]);
    expect(readOneNudge({ description_max_chars: 281 }).nudges).toEqual([]);
    expect(readOneNudge({ description_max_chars: 12.5 }).nudges).toEqual([]);
  });

  it("keeps a retired (inactive) nudge, so past history can still show its name", () => {
    // Retired nudges are read normally; the Nudge engine stops parents picking them.
    expect(readOneNudge({ active: false }).nudges[0]?.active).toBe(false);
  });

  it("leaves out every nudge that shares a name with another, and reports it", () => {
    // Same name apart from capital letters and spaces still counts as the same.
    const result = readNudgeRows(
      [
        validNudgeRow({ id: 1, code: "AAA", name: "Showing affection" }),
        validNudgeRow({ id: 2, code: "BBB", name: "  showing AFFECTION " }),
        validNudgeRow({ id: 3, code: "CCC", name: "Giving attention" }),
      ],
      [...threeExamples("AAA", 1), ...threeExamples("BBB", 4), ...threeExamples("CCC", 7)],
    );
    // We can't tell which duplicate is the right one, so both are left out.
    expect(result.nudges.map((n) => n.id)).toEqual([3]);
    expect(result.problems.map((p) => p.rowId)).toEqual([1, 2]);
    expect(firstReasons(result)).toMatch(/same name/i);
  });

  // Backstops: the database already refuses duplicate codes and IDs.
  it("leaves out every nudge that shares a code or an ID with another, and reports it", () => {
    const sameCode = readNudgeRows(
      [validNudgeRow({ id: 1, code: "TWC", name: "A" }), validNudgeRow({ id: 2, code: "TWC", name: "B" })],
      threeExamples("TWC", 1),
    );
    expect(sameCode.nudges).toEqual([]);
    expect(firstReasons(sameCode)).toMatch(/same code/i);

    const sameId = readNudgeRows(
      [validNudgeRow({ id: 4, code: "AAA", name: "A" }), validNudgeRow({ id: 4, code: "BBB", name: "B" })],
      [...threeExamples("AAA", 1), ...threeExamples("BBB", 4)],
    );
    expect(sameId.nudges).toEqual([]);
    expect(firstReasons(sameId)).toMatch(/same id/i);
  });

  it("leaves out only the broken nudge, keeps the rest, and reports which row and why", () => {
    const { nudgeRows, exampleRows } = nineTestTables();
    nudgeRows[2] = { ...nudgeRows[2], category: "sometimes" }; // break the nudge with ID 3
    const result = readNudgeRows(nudgeRows, exampleRows);
    expect(result.nudges).toHaveLength(8); // the other 8 keep working
    expect(result.nudges.map((n) => n.id)).not.toContain(3);
    expect(result.problems).toHaveLength(1); // its examples are not reported again
    expect(result.problems[0]).toMatchObject({ table: "nudges", rowId: 3 });
  });

  it("reports every problem in a nudge row at once, so the owner can fix them in one go", () => {
    const result = readOneNudge({ name: "", category: "x", code: "x" });
    expect(result.problems[0]?.reasons.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Nudge repository: example rows", () => {
  it("refuses a blank example and reports it, keeping the nudge's other examples", () => {
    const examples = [...threeExamples("TWC", 1), validExampleRow({ id: 4, example: "   " })];
    const result = readNudgeRows([validNudgeRow()], examples);
    expect(result.nudges[0]?.examples).toHaveLength(3);
    expect(result.problems).toEqual([
      { table: "examples", rowId: 4, reasons: [expect.stringMatching(/example must not be blank/i)] },
    ]);
  });

  it("refuses an example whose code matches no nudge (backstop: the database also refuses it)", () => {
    const examples = [...threeExamples("TWC", 1), validExampleRow({ id: 4, nudge_code: "TCW" })];
    const result = readNudgeRows([validNudgeRow()], examples);
    expect(result.problems[0]).toMatchObject({ table: "examples", rowId: 4 });
    expect(firstReasons(result)).toMatch(/no nudge has the code "TCW"/i);
  });

  it("refuses an example whose 'active' is not a yes or no", () => {
    const examples = [...threeExamples("TWC", 1), validExampleRow({ id: 4, active: "yes" })];
    const result = readNudgeRows([validNudgeRow()], examples);
    expect(result.problems[0]).toMatchObject({ table: "examples", rowId: 4 });
  });

  it("leaves retired examples out of the nudge's examples", () => {
    const examples = [...threeExamples("TWC", 1), validExampleRow({ id: 4, example: "Old one", active: false })];
    const result = readNudgeRows([validNudgeRow()], examples);
    expect(result.nudges[0]?.examples.map((e) => e.text)).not.toContain("Old one");
  });

  it("lists a nudge's examples in ID order (the order they were added)", () => {
    const examples = [
      validExampleRow({ id: 9, example: "third" }),
      validExampleRow({ id: 2, example: "first" }),
      validExampleRow({ id: 5, example: "second" }),
    ];
    const result = readNudgeRows([validNudgeRow()], examples);
    expect(result.nudges[0]?.examples.map((e) => e.text)).toEqual(["first", "second", "third"]);
  });
});

describe("Nudge repository: minimum examples per nudge (spec v1.6)", () => {
  it("is 3", () => {
    expect(MIN_EXAMPLES_PER_NUDGE).toBe(3);
  });

  it("keeps a nudge with fewer than 3 active examples working, but flags it to the owner", () => {
    const examples = [
      ...threeExamples("TWC", 1).slice(0, 2), // only 2 active examples
      validExampleRow({ id: 3, active: false }), // a retired one doesn't count
    ];
    const result = readNudgeRows([validNudgeRow()], examples);
    expect(result.nudges).toHaveLength(1); // still working, with reduced variety
    expect(result.nudges[0]?.examples).toHaveLength(2);
    expect(result.shortages).toEqual([
      { code: "TWC", name: "Talking with children", activeExamples: 2, minimum: 3 },
    ]);
  });

  it("does not flag a nudge with exactly 3 active examples", () => {
    expect(readNudgeRows([validNudgeRow()], threeExamples("TWC", 1)).shortages).toEqual([]);
  });
});
