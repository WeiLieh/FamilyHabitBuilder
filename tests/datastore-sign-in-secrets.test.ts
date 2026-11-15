// =============================================================================
// tests/datastore-sign-in-secrets.test.ts: the random secrets behind sign-in
//
// What it checks: [2026-11-15] the secrets the bot and the Web app make for a
// sign-in link and a signed-in browser (rule 9.3) are long, random and new
// each time, and their fingerprint is the same SHA-256 the database makes
// itself (migration 011's secret_fingerprint), so the two always agree.
// =============================================================================

import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { fingerprintOf, newSecret } from "../src/datastore/sign-in-secrets.js";

describe("Sign-in secrets (rule 9.3)", () => {
  it("makes a new 43-character random secret each time, and its fingerprint is a SHA-256 the database can repeat", () => {
    const a = newSecret();
    const b = newSecret();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
    expect(fingerprintOf(a)).toBe(createHash("sha256").update(a).digest("hex"));
  });
});
