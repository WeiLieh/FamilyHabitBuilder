// =============================================================================
// tests/nudge-repository.test.ts: Batch 1a, what counts as a valid nudge
//
// The Nudge repository is a Supabase table the owner edits directly, so the app
// must check every row it reads (spec v1.3 and v1.4). These tests describe
// those checks. A broken row is left out and reported; the other nudges keep
// working. Nothing is ever patched with made-up values (CLAUDE.md rule 9).
// =============================================================================

import { describe, expect, it } from "vitest";
import { readNudgeRows } from "../shared/nudge-repository.js";
import { nineTestRows, validRow } from "./helpers/nudge-rows.js";

// Small helper: read exactly one row and return what happened to it.
function readOne(overrides: Record<string, unknown>) {
  return readNudgeRows([validRow(overrides)]);
}

describe("Nudge repository: reading nudge rows", () => {
  // Test 1
  it("accepts a complete, correct row and turns it into a nudge", () => {
    const result = readNudgeRows([validRow()]);
    expect(result.problems).toEqual([]); // nothing to report
    expect(result.nudges).toEqual([
      {
        id: 1,
        name: "Talking with children",
        category: "quick",
        examples: [
          "Ask about the best part of their day.",
          "Ask what made them laugh today.",
          "Ask about their favourite game.",
          "Share a short story about your own day.",
          "At bedtime, ask if anything is on their mind.",
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

  it("accepts all 9 rows laid out like the owner's table", () => {
    const result = readNudgeRows(nineTestRows());
    expect(result.problems).toEqual([]);
    expect(result.nudges.filter((n) => n.category === "quick")).toHaveLength(4);
    expect(result.nudges.filter((n) => n.category === "deliberate")).toHaveLength(5);
  });

  // Test 2
  it("refuses a category other than 'quick' or 'deliberate'", () => {
    const result = readOne({ category: "medium" });
    expect(result.nudges).toEqual([]); // the row is left out
    expect(result.problems[0]?.reasons.join(" ")).toMatch(/category/i);
  });

  // Test 3
  it("refuses a blank name", () => {
    const result = readOne({ name: "   " }); // only spaces counts as blank
    expect(result.nudges).toEqual([]);
    expect(result.problems[0]?.reasons.join(" ")).toMatch(/name/i);
  });

  it("refuses a blank or missing example", () => {
    expect(readOne({ example_3: "" }).nudges).toEqual([]);
    expect(readOne({ example_5: null }).nudges).toEqual([]);
    expect(readOne({ example_3: "" }).problems[0]?.reasons.join(" ")).toMatch(/example 3/i);
  });

  // Test 4
  it("refuses 'self-report allowed' or 'photo upload allowed' that is not a yes or no", () => {
    // In Supabase, yes/no columns hold true or false. Text like "Yes", or an
    // empty cell, is not accepted.
    expect(readOne({ self_report_allowed: "Yes" }).nudges).toEqual([]);
    expect(readOne({ self_report_allowed: null }).nudges).toEqual([]);
    expect(readOne({ photo_upload_allowed: "maybe" }).nudges).toEqual([]);
  });

  it("refuses 'active' or 'starts unlocked' that is not a yes or no", () => {
    expect(readOne({ active: "Yes" }).nudges).toEqual([]);
    expect(readOne({ active: null }).nudges).toEqual([]);
    expect(readOne({ starts_unlocked: "no" }).nudges).toEqual([]);
    expect(readOne({ starts_unlocked: "no" }).problems[0]?.reasons.join(" ")).toMatch(/starts unlocked/i);
  });

  it("keeps a retired (inactive) nudge, so past history can still show its name", () => {
    // Retired nudges are read normally; the Nudge engine stops parents picking them.
    expect(readOne({ active: false }).nudges[0]?.active).toBe(false);
  });

  // Test 5
  it("refuses a nudge that allows photos but has no photo idea", () => {
    const result = readOne({ photo_upload_allowed: true, photo_idea: " " });
    expect(result.nudges).toEqual([]);
    expect(result.problems[0]?.reasons.join(" ")).toMatch(/photo idea/i);
  });

  it("accepts a nudge without a photo idea when photos are not allowed", () => {
    expect(readOne({ photo_upload_allowed: false, photo_idea: null }).nudges).toHaveLength(1);
  });

  // Test 6
  it("refuses a nudge that allows neither self-report nor photos", () => {
    const result = readOne({ self_report_allowed: false, photo_upload_allowed: false });
    expect(result.nudges).toEqual([]);
    expect(result.problems[0]?.reasons.join(" ")).toMatch(/at least one way to log/i);
  });

  // Addition: the 280-character description limit from the owner's table
  it("refuses a description limit that is not a whole number from 1 to 280", () => {
    expect(readOne({ description_max_chars: 0 }).nudges).toEqual([]);
    expect(readOne({ description_max_chars: 281 }).nudges).toEqual([]);
    expect(readOne({ description_max_chars: 12.5 }).nudges).toEqual([]);
  });

  // Test 7
  it("leaves out every row that shares a name with another row, and reports it", () => {
    // Same name apart from capital letters and spaces still counts as the same.
    const rows = [
      validRow({ id: 1, name: "Showing affection" }),
      validRow({ id: 2, name: "  showing AFFECTION " }),
      validRow({ id: 3, name: "Giving attention" }),
    ];
    const result = readNudgeRows(rows);
    // We can't tell which duplicate is the right one, so both are left out.
    expect(result.nudges.map((n) => n.id)).toEqual([3]);
    expect(result.problems.map((p) => p.rowId)).toEqual([1, 2]);
    expect(result.problems[0]?.reasons.join(" ")).toMatch(/same name/i);
  });

  // Backstop: Supabase generates IDs automatically, so this should never happen.
  it("leaves out every row that shares an ID with another row, and reports it", () => {
    const rows = [
      validRow({ id: 4, name: "A" }),
      validRow({ id: 4, name: "B" }),
      validRow({ id: 5, name: "C" }),
    ];
    const result = readNudgeRows(rows);
    expect(result.nudges.map((n) => n.name)).toEqual(["C"]);
    expect(result.problems[0]?.reasons.join(" ")).toMatch(/same id/i);
  });

  // The agreed rule for broken rows (spec v1.4)
  it("leaves out only the broken row, keeps the rest, and reports which row and why", () => {
    const rows = nineTestRows();
    rows[2] = { ...rows[2], category: "sometimes" }; // break the row with ID 3
    const result = readNudgeRows(rows);
    expect(result.nudges).toHaveLength(8); // the other 8 keep working
    expect(result.nudges.map((n) => n.id)).not.toContain(3);
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]?.rowId).toBe(3); // so the owner knows which row to fix
  });

  it("reports every problem in a row at once, so the owner can fix them in one go", () => {
    const result = readOne({ name: "", category: "x", example_1: "" });
    expect(result.problems[0]?.reasons.length).toBeGreaterThanOrEqual(3);
  });
});
