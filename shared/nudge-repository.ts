// =============================================================================
// shared/nudge-repository.ts: the Nudge repository's row checks
//
// What it does: takes the raw rows read from the Supabase "nudges" table (which
// the owner edits by hand) and turns each valid row into a tidy Nudge object.
// Any row that breaks a rule is LEFT OUT and REPORTED, with every reason, so
// the owner can fix it. The other rows keep working (spec v1.4).
//
// Why: edits in the Supabase dashboard go live straight away with no review,
// so the app is the last line of defence. It never guesses or patches a broken
// row with made-up values (CLAUDE.md rule 9).
//
// This file has no web calls and no secrets, so it can be fully tested.
// =============================================================================

// zod is our approved checking library: we describe what a valid value looks
// like, and zod tells us exactly what is wrong when it doesn't match.
import { z } from "zod";

// ---- What a valid nudge looks like inside the app --------------------------

export type NudgeCategory = "quick" | "deliberate";

export type Nudge = {
  id: number;
  name: string;
  category: NudgeCategory;
  examples: string[]; // always exactly 5
  selfReportAllowed: boolean;
  descriptionMaxChars: number; // limit for the parent's optional description
  photoUploadAllowed: boolean;
  photoIdea: string | null; // required when photos are allowed
  active: boolean; // false = retired: kept for history, but parents can't pick it
  startsUnlocked: boolean; // false = a parent must unlock it before picking it
};

// One broken row: which row, and every reason it was refused.
export type RowProblem = {
  rowId: number | string; // the row's ID, or its position if the ID is unusable
  reasons: string[];
};

export type ReadResult = {
  nudges: Nudge[]; // valid rows, in the order they were read
  problems: RowProblem[]; // broken rows, for the owner's alert
};

// ---- Rules for each column (column names match the Supabase table) --------

// Text that must not be blank: trim() removes spaces at either end first, so a
// cell holding only spaces counts as blank. The message is used for both "not
// text at all" and "blank".
const nonBlankText = (message: string) => z.string({ error: message }).trim().min(1, message);

const yesNoMessage = (column: string) => `${column} must be yes or no (true or false).`;
const descriptionLimitMessage = "Description limit must be a whole number from 1 to 280.";

const rowSchema = z.object({
  id: z.number({ error: "ID must be a whole number above 0." }).int("ID must be a whole number above 0.").positive("ID must be a whole number above 0."),
  name: nonBlankText("Name must not be blank."),
  category: z.enum(["quick", "deliberate"], { error: 'Category must be "quick" or "deliberate".' }),
  example_1: nonBlankText("Example 1 must not be blank."),
  example_2: nonBlankText("Example 2 must not be blank."),
  example_3: nonBlankText("Example 3 must not be blank."),
  example_4: nonBlankText("Example 4 must not be blank."),
  example_5: nonBlankText("Example 5 must not be blank."),
  self_report_allowed: z.boolean({ error: yesNoMessage("Self-report allowed") }),
  description_max_chars: z
    .number({ error: descriptionLimitMessage })
    .int(descriptionLimitMessage)
    .min(1, descriptionLimitMessage)
    .max(280, descriptionLimitMessage),
  photo_upload_allowed: z.boolean({ error: yesNoMessage("Photo upload allowed") }),
  // The photo idea may be empty here; whether it is REQUIRED depends on
  // another column, so that rule is checked separately below.
  photo_idea: z.string({ error: "Photo idea must be text." }).nullable().optional(),
  active: z.boolean({ error: yesNoMessage("Active") }),
  starts_unlocked: z.boolean({ error: yesNoMessage("Starts unlocked") }),
});

// ---- Helpers -----------------------------------------------------------------

// Treat "Showing affection" and "  showing  AFFECTION " as the same name.
function normaliseName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ").toLowerCase();
  return cleaned === "" ? null : cleaned;
}

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

// Count how often each key appears, so duplicates can be spotted.
function countOccurrences(keys: (string | number | null)[]): Map<string | number, number> {
  const counts = new Map<string | number, number>();
  for (const key of keys) {
    if (key === null) continue; // missing names/IDs are reported elsewhere
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

// ---- The main function -----------------------------------------------------

// Reads raw rows (as returned by Supabase) and sorts them into valid nudges and
// reported problems.
export function readNudgeRows(rows: Record<string, unknown>[]): ReadResult {
  // First pass: find names and IDs used by more than one row.
  const nameCounts = countOccurrences(rows.map((row) => normaliseName(row["name"])));
  const idCounts = countOccurrences(
    rows.map((row) => (typeof row["id"] === "number" ? row["id"] : null)),
  );

  const nudges: Nudge[] = [];
  const problems: RowProblem[] = [];

  rows.forEach((row, index) => {
    const reasons: string[] = [];

    // 1. Column-by-column checks. safeParse never crashes: it returns either
    //    success with the cleaned data, or a list of issues.
    const parsed = rowSchema.safeParse(row);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        if (!reasons.includes(issue.message)) reasons.push(issue.message);
      }
    }

    // 2. Rules that compare two columns (checked even if step 1 found issues,
    //    so the owner sees every problem at once).
    if (row["photo_upload_allowed"] === true && isBlank(row["photo_idea"])) {
      reasons.push("A nudge that allows photos needs a photo idea.");
    }
    if (row["self_report_allowed"] === false && row["photo_upload_allowed"] === false) {
      reasons.push("A nudge needs at least one way to log (self-report or photo).");
    }

    // 3. Rules across rows: duplicates. We can't tell which duplicate is the
    //    right one, so every row involved is left out. (Supabase generates IDs
    //    automatically, so duplicate IDs are a backstop check only.)
    const name = normaliseName(row["name"]);
    if (name !== null && (nameCounts.get(name) ?? 0) > 1) {
      reasons.push("Another row has the same name.");
    }
    const id = row["id"];
    if (typeof id === "number" && (idCounts.get(id) ?? 0) > 1) {
      reasons.push("Another row has the same ID.");
    }

    // 4. Keep the row, or leave it out and report it.
    if (reasons.length > 0 || !parsed.success) {
      const rowId = typeof id === "number" ? id : `row ${index + 1}`;
      problems.push({ rowId, reasons });
      return;
    }

    const data = parsed.data;
    nudges.push({
      id: data.id,
      name: data.name, // already trimmed by the schema
      category: data.category,
      examples: [data.example_1, data.example_2, data.example_3, data.example_4, data.example_5],
      selfReportAllowed: data.self_report_allowed,
      descriptionMaxChars: data.description_max_chars,
      photoUploadAllowed: data.photo_upload_allowed,
      photoIdea: isBlank(data.photo_idea) ? null : (data.photo_idea as string).trim(),
      active: data.active,
      startsUnlocked: data.starts_unlocked,
    });
  });

  return { nudges, problems };
}
