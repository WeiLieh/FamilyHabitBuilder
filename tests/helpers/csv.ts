// =============================================================================
// tests/helpers/csv.ts: a small CSV (comma-separated values) reader for tests
//
// CSV is the plain spreadsheet format Supabase imports. Text containing commas
// or quotes is wrapped in double quotes, and a quote inside such text is
// written twice (""). This reader handles exactly that. Used only by tests, so
// no library is needed.
// =============================================================================

// Turns CSV text into a list of rows, each a list of cell texts.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false; // are we inside "..."?

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'; // "" inside quotes means one real quote character
        i++;
      } else if (ch === '"') {
        inQuotes = false; // closing quote
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell); // end of a cell
      cell = "";
    } else if (ch === "\n") {
      row.push(cell); // end of a row
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// Turns CSV text with a header row into objects, e.g. { name: "...", ... }.
export function csvToObjects(text: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(text);
  if (header === undefined) return [];
  return rows.map((cells) => Object.fromEntries(header.map((column, i) => [column, cells[i] ?? ""])));
}
