// =============================================================================
// src/nudge-repository/nudge-repository.ts: the Nudge repository's row checks
//
// What it does: takes the raw rows read from the two Supabase tables the owner
// edits by hand (spec v1.6):
//   nudges   - one row per nudge: its settings and a short code (e.g. TWC)
//   examples - one row per example, naming its nudge by that code
// and turns them into tidy Nudge objects, each carrying its active examples.
//
// Rules:
//   - Any row that breaks a rule is LEFT OUT and REPORTED, with every reason,
//     so the owner can fix it. The other rows keep working (spec v1.4).
//   - A nudge with fewer than 3 active examples KEEPS WORKING but is reported
//     as a "shortage" so the owner can top it up (spec v1.6).
//
// Why: edits in the Supabase dashboard go live straight away with no review,
// so the app double-checks (the database checks too: "defence in depth"). It
// never guesses or patches a broken row with made-up values (CLAUDE.md rule 9).
//
// This file has no web calls and no secrets, so it can be fully tested.
// =============================================================================

// zod is our approved checking library: we describe what a valid value looks
// like, and zod tells us exactly what is wrong when it doesn't match.
import { z } from "zod";
import { MIN_EXAMPLES_PER_NUDGE } from "../settings.js";

// ---- What a valid nudge looks like inside the app --------------------------

export type NudgeCategory = "quick" | "deliberate";

export type NudgeExample = {
  id: number; // never changes, so metrics can tell which example worked
  text: string;
};

export type Nudge = {
  id: number; // what parents' choices, history and metrics point to
  code: string; // short code the owner types when adding examples, e.g. TWC
  name: string;
  category: NudgeCategory;
  examples: NudgeExample[]; // active examples only, oldest first
  selfReportAllowed: boolean;
  descriptionMaxChars: number; // limit for the parent's optional description
  photoUploadAllowed: boolean;
  photoIdea: string | null; // required when photos are allowed
  active: boolean; // false = retired: kept for history, but parents can't pick it
  startsUnlocked: boolean; // false = a parent must unlock it before picking it
};

// One broken row: which table, which row, and every reason it was refused.
export type RowProblem = {
  table: "nudges" | "examples";
  rowId: number | string; // the row's ID, or its position if the ID is unusable
  reasons: string[];
};

// A nudge that works but has too few active examples.
export type ExampleShortage = {
  code: string;
  name: string;
  activeExamples: number;
  minimum: number;
};

export type ReadResult = {
  nudges: Nudge[]; // valid nudges, in the order they were read
  problems: RowProblem[]; // broken rows, for the owner's alert
  shortages: ExampleShortage[]; // nudges below the minimum, for the owner's alert
};

// ---- Rules for each column (column names match the Supabase tables) -------

// Text that must not be blank: trim() removes spaces at either end first, so a
// cell holding only spaces counts as blank.
const nonBlankText = (message: string) => z.string({ error: message }).trim().min(1, message);

const yesNoMessage = (column: string) => `${column} must be yes or no (true or false).`;
const idMessage = "ID must be a whole number above 0.";
const descriptionLimitMessage = "Description limit must be a whole number from 1 to 280.";
const codeMessage = "Code must be 2 to 10 capital letters or digits, e.g. TWC.";

const idSchema = z.number({ error: idMessage }).int(idMessage).positive(idMessage);

const nudgeRowSchema = z.object({
  id: idSchema,
  // ^ and $ mean "the whole value"; [A-Z0-9]{2,10} means 2 to 10 capital
  // letters or digits, nothing else (no spaces, no symbols).
  code: z.string({ error: codeMessage }).regex(/^[A-Z0-9]{2,10}$/, codeMessage),
  name: nonBlankText("Name must not be blank."),
  category: z.enum(["quick", "deliberate"], { error: 'Category must be "quick" or "deliberate".' }),
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

const exampleRowSchema = z.object({
  id: idSchema,
  nudge_code: z.string({ error: "Nudge code must be text." }),
  example: nonBlankText("Example must not be blank."),
  active: z.boolean({ error: yesNoMessage("Active") }),
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
    if (key === null) continue; // missing values are reported elsewhere
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

// A row's label for a problem report: its ID, or its position if the ID is unusable.
function rowLabel(row: Record<string, unknown>, index: number): number | string {
  return typeof row["id"] === "number" ? row["id"] : `row ${index + 1}`;
}

// Collect zod's messages (without repeats) for a row that failed its schema.
function schemaReasons(result: { success: boolean; error?: z.ZodError }): string[] {
  const reasons: string[] = [];
  for (const issue of result.error?.issues ?? []) {
    if (!reasons.includes(issue.message)) reasons.push(issue.message);
  }
  return reasons;
}

// ---- The main function -----------------------------------------------------

// Reads raw rows from both tables (as returned by Supabase) and sorts them into
// valid nudges (with their examples), reported problems and shortages.
export function readNudgeRows(
  nudgeRows: Record<string, unknown>[],
  exampleRows: Record<string, unknown>[],
): ReadResult {
  const problems: RowProblem[] = [];

  // ---- Step 1: check the nudge rows ----

  // Find names, codes and IDs used by more than one nudge.
  const nameCounts = countOccurrences(nudgeRows.map((row) => normaliseName(row["name"])));
  const codeCounts = countOccurrences(
    nudgeRows.map((row) => (typeof row["code"] === "string" ? row["code"] : null)),
  );
  const idCounts = countOccurrences(
    nudgeRows.map((row) => (typeof row["id"] === "number" ? row["id"] : null)),
  );

  type CheckedNudge = Omit<Nudge, "examples">;
  const goodNudges: CheckedNudge[] = [];
  const allCodes = new Set<string>(); // every code in the table, even on broken rows

  nudgeRows.forEach((row, index) => {
    if (typeof row["code"] === "string") allCodes.add(row["code"]);

    // a. Column-by-column checks. safeParse never crashes: it returns either
    //    success with the cleaned data, or a list of issues.
    const parsed = nudgeRowSchema.safeParse(row);
    const reasons = schemaReasons(parsed);

    // b. Rules that compare two columns (checked even if step a found issues,
    //    so the owner sees every problem at once).
    if (row["photo_upload_allowed"] === true && isBlank(row["photo_idea"])) {
      reasons.push("A nudge that allows photos needs a photo idea.");
    }
    if (row["self_report_allowed"] === false && row["photo_upload_allowed"] === false) {
      reasons.push("A nudge needs at least one way to log (self-report or photo).");
    }

    // c. Duplicates. We can't tell which duplicate is the right one, so every
    //    row involved is left out. (The database already refuses duplicate
    //    names, codes and IDs; these are backstop checks.)
    const name = normaliseName(row["name"]);
    if (name !== null && (nameCounts.get(name) ?? 0) > 1) reasons.push("Another nudge has the same name.");
    const code = row["code"];
    if (typeof code === "string" && (codeCounts.get(code) ?? 0) > 1) reasons.push("Another nudge has the same code.");
    const id = row["id"];
    if (typeof id === "number" && (idCounts.get(id) ?? 0) > 1) reasons.push("Another nudge has the same ID.");

    // d. Keep the nudge, or leave it out and report it.
    if (reasons.length > 0 || !parsed.success) {
      problems.push({ table: "nudges", rowId: rowLabel(row, index), reasons });
      return;
    }
    const data = parsed.data;
    goodNudges.push({
      id: data.id,
      code: data.code,
      name: data.name, // already trimmed by the schema
      category: data.category,
      selfReportAllowed: data.self_report_allowed,
      descriptionMaxChars: data.description_max_chars,
      photoUploadAllowed: data.photo_upload_allowed,
      photoIdea: isBlank(data.photo_idea) ? null : (data.photo_idea as string).trim(),
      active: data.active,
      startsUnlocked: data.starts_unlocked,
    });
  });

  // ---- Step 2: check the example rows and group them by nudge code ----

  const examplesByCode = new Map<string, { id: number; text: string }[]>();
  exampleRows.forEach((row, index) => {
    const parsed = exampleRowSchema.safeParse(row);
    const reasons = schemaReasons(parsed);
    const code = row["nudge_code"];

    // The code must belong to a nudge. (If the nudge exists but is broken,
    // its examples are simply unused: the nudge's own problem is reported.)
    if (typeof code === "string" && !allCodes.has(code)) {
      reasons.push(`No nudge has the code "${code}".`);
    }

    if (reasons.length > 0 || !parsed.success) {
      problems.push({ table: "examples", rowId: rowLabel(row, index), reasons });
      return;
    }
    if (!parsed.data.active) return; // retired examples are not used

    const list = examplesByCode.get(parsed.data.nudge_code) ?? [];
    list.push({ id: parsed.data.id, text: parsed.data.example });
    examplesByCode.set(parsed.data.nudge_code, list);
  });

  // ---- Step 3: attach examples to nudges, and flag shortages ----

  const shortages: ExampleShortage[] = [];
  const nudges: Nudge[] = goodNudges.map((nudge) => {
    // Oldest first: a smaller ID means the example was added earlier.
    const examples = [...(examplesByCode.get(nudge.code) ?? [])].sort((a, b) => a.id - b.id);
    if (examples.length < MIN_EXAMPLES_PER_NUDGE) {
      shortages.push({
        code: nudge.code,
        name: nudge.name,
        activeExamples: examples.length,
        minimum: MIN_EXAMPLES_PER_NUDGE,
      });
    }
    return { ...nudge, examples };
  });

  return { nudges, problems, shortages };
}
