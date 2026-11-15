// =============================================================================
// src/web-app/html.ts: making text safe to put in a web page
//
// What it does: [2026-11-15] turns the few characters that mean something in
// HTML (& < > ") into their harmless written forms, so a name or a line a
// parent typed is always shown as text, never obeyed as page code (for
// example "<b>" shows as "<b>", not bold). Every page of the Web app uses it.
// =============================================================================

export const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
