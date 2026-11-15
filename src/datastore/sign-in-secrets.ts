// =============================================================================
// src/datastore/sign-in-secrets.ts: the random secrets behind sign-in, and their fingerprints
//
// What it does: [2026-11-15] makes the long random secrets used by the Web
// app's sign-in (rule 9.3): one for each /mypage link, one for each signed-in
// browser (the protected cookie). And it makes a secret's "fingerprint": a
// SHA-256 scramble that can't be turned back into the secret.
//
// Why: the database keeps only fingerprints (migration 011), so a copy of its
// tables opens nothing. The bot sends the link's fingerprint when it makes a
// link; the browser's side hands in the secret, and the database makes the
// same fingerprint itself to check it. It lives in the Datastore because both
// the Telegram bot and the Web app use it (rule S7: both have an arrow to the
// Datastore, not to each other).
// =============================================================================

import { createHash, randomBytes } from "node:crypto";

// 32 random bytes, written with letters, digits, "-" and "_" (43 characters).
// Far too many to guess (2 to the power 256).
export function newSecret(): string {
  return randomBytes(32).toString("base64url");
}

// The SHA-256 fingerprint of a secret, as 64 hexadecimal characters (the same
// as the database's secret_fingerprint, migration 011).
export function fingerprintOf(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}
