// =============================================================================
// tests/nudge-engine-examples.test.ts: which example idea a nudge carries (rule 3.13)
//
// [2026-11-13] Each nudge message carries one example idea for its behaviour.
// The rule: pick one this parent hasn't seen yet; repeat only once they have
// seen them all, like dealing cards and reshuffling only when the deck runs
// out. chooseExample only decides; pull request 3c reads the examples and the
// parent's history from the database and sends the message.
// Test behaviour: "Showing affection" with examples 11, 12, 13 (all active
// unless a test says otherwise).
// =============================================================================

import { describe, expect, it } from "vitest";
import { chooseExample, type ExampleRow } from "../src/nudge-engine/examples.js";

const three: ExampleRow[] = [
  { id: 11, active: true },
  { id: 12, active: true },
  { id: 13, active: true },
];

describe("Choosing the example idea (rule 3.13)", () => {
  // E1
  it("uses the first active example for a parent's first nudge about this behaviour", () => {
    expect(chooseExample(three, [])).toBe(11);
  });

  // E2
  it("picks an example this parent hasn't seen yet", () => {
    expect(chooseExample(three, [11, 12])).toBe(13);
    expect(chooseExample(three, [12])).toBe(11);
  });

  // E3
  it("starts again only after every example has been used, with the one used least often", () => {
    expect(chooseExample(three, [11, 12, 13])).toBe(11);
    expect(chooseExample(three, [11, 12, 13, 11])).toBe(12);
  });

  // E4
  it("never chooses an example that is switched off, even if never used", () => {
    const withInactive: ExampleRow[] = [{ id: 10, active: false }, ...three];
    expect(chooseExample(withInactive, [])).toBe(11);
    expect(chooseExample(withInactive, [11, 12, 13])).toBe(11);
  });

  // E5
  it("chooses a newly added example before repeating any of the others", () => {
    const withNew: ExampleRow[] = [...three, { id: 14, active: true }];
    expect(chooseExample(withNew, [11, 12, 13])).toBe(14);
  });

  // E6
  it("refuses, rather than make one up, when the behaviour has no active example (rule 1.3)", () => {
    expect(() => chooseExample([{ id: 10, active: false }], [])).toThrow(/no active example/i);
    expect(() => chooseExample([], [])).toThrow(/no active example/i);
  });
});
