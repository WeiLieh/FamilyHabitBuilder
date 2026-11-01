// =============================================================================
// tests/datastore-children.test.ts: checking a child's birth year (rule 8.10)
//
// Behaviour checked (owner-approved tests T10 and T11, 1 Nov): a birth year in
// the future, or more than 25 years ago, is refused when saving; a child aged
// 0 to 6 or 13 to 25 is accepted but flagged for Telemetry (rule 10.4); a child
// aged 7 to 12 is accepted with no flag. Ages are worked out to within a year.
// =============================================================================

import { describe, expect, it } from "vitest";
import { checkBirthYear } from "../src/datastore/children.js";

// "Today" in these tests is 1 March 2027 (a Singapore date).
const today = "2027-03-01";

describe("Datastore: checking a child's birth year (rule 8.10)", () => {
  it("accepts a child aged 7 to 12 with no flag", () => {
    expect(checkBirthYear(2017, today)).toEqual({ ok: true, flagged: false, age: 10 });
    expect(checkBirthYear(2020, today)).toEqual({ ok: true, flagged: false, age: 7 });
    expect(checkBirthYear(2015, today)).toEqual({ ok: true, flagged: false, age: 12 });
  });

  it("accepts a child aged 0 to 6, but flags them for Telemetry (rule 10.4)", () => {
    expect(checkBirthYear(2027, today)).toEqual({ ok: true, flagged: true, age: 0 });
    expect(checkBirthYear(2021, today)).toEqual({ ok: true, flagged: true, age: 6 });
  });

  it("accepts a child aged 13 to 25, but flags them for Telemetry (rule 10.4)", () => {
    expect(checkBirthYear(2014, today)).toEqual({ ok: true, flagged: true, age: 13 });
    expect(checkBirthYear(2002, today)).toEqual({ ok: true, flagged: true, age: 25 });
  });

  it("refuses a birth year in the future", () => {
    expect(checkBirthYear(2028, today)).toEqual({ ok: false, reason: "That year is in the future." });
  });

  it("refuses a birth year more than 25 years ago", () => {
    expect(checkBirthYear(2001, today)).toEqual({ ok: false, reason: "Please choose a year from 2002 to 2027." });
  });

  it("refuses something that isn't a whole year", () => {
    expect(checkBirthYear(2017.5, today).ok).toBe(false);
  });
});
