// =============================================================================
// tests/nudge-engine-child-turn.test.ts: which child a message names (rule 3.16)
//
// [2026-11-13] A parent with 2 or 3 children is told once that the bot takes
// turns naming one child in each message (owner, Q4, 12 Nov). Turns follow the
// order the names were typed, across every message that names a child
// ("Start right now", nudges). childForMessage only decides; pull request 3c
// counts the messages already sent.
// =============================================================================

import { describe, expect, it } from "vitest";
import { childForMessage } from "../src/nudge-engine/child-turn.js";

describe("Taking turns naming the children (rule 3.16)", () => {
  // C1
  it("always names the only child", () => {
    expect(childForMessage(["Mia"], 0)).toBe("Mia");
    expect(childForMessage(["Mia"], 7)).toBe("Mia");
  });

  // C2
  it("follows the typed order after Start right now named the first child", () => {
    const children = ["Mia", "Leo", "Ava"];
    // 1 message (Start right now, Mia) already named a child.
    expect(childForMessage(children, 1)).toBe("Leo");
    expect(childForMessage(children, 2)).toBe("Ava");
    expect(childForMessage(children, 3)).toBe("Mia");
    expect(childForMessage(children, 4)).toBe("Leo");
  });

  // C3
  it("wraps round when the turns run out", () => {
    expect(childForMessage(["Mia", "Leo"], 5)).toBe("Leo");
  });

  // C4
  it("names no child when none is recorded (the words then say \"your child\")", () => {
    expect(childForMessage([], 0)).toBeNull();
  });
});
