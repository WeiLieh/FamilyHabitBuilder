// =============================================================================
// tests/datastore-windows.test.ts: the time windows the database also checks
//
// [2026-11-11] Three waits have a fixed length decided by the owner:
//   - Undo: 30 seconds after a keyboard log (rule 5.8)
//   - the weekly connection question: 24 hours after it is sent (rule 5.6)
//   - "Add a moment": 24 hours after the button is tapped (rule 7.7)
// The numbers live once, in src/settings.ts (rule 1.4). The database reads the
// first two from the settings version each event carries (migration 005), so
// a bug in the app can't quietly stretch them.
// =============================================================================

import { describe, expect, it } from "vitest";
import { CONNECTION_ANSWER_WINDOW_HOURS, MOMENT_WINDOW_HOURS, SETTINGS_KEYS_THE_DATABASE_READS, UNDO_WINDOW_SECONDS } from "../src/settings.js";

describe("Time windows (rules 5.6, 5.8, 7.7)", () => {
  it("gives Undo 30 seconds, and the connection question and a moment 24 hours each", () => {
    expect(UNDO_WINDOW_SECONDS).toBe(30);
    expect(CONNECTION_ANSWER_WINDOW_HOURS).toBe(24);
    expect(MOMENT_WINDOW_HOURS).toBe(24);
  });

  it("names the two windows the database checks, with the values it will find in each settings version", () => {
    expect(SETTINGS_KEYS_THE_DATABASE_READS).toEqual({
      undo_window_seconds: 30,
      connection_answer_window_hours: 24,
    });
  });
});
