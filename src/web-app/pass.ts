// =============================================================================
// src/web-app/pass.ts: the per-parent pass our server signs for each page
//
// What it does: [2026-11-15] makes the short "pass" of rule 9.8 (option A, owner
// 15 Nov): a JSON Web Token (JWT), a small signed note that says "this request
// is for parent 7, until 8:10 pm". Supabase checks the signature with the
// project's signing secret and hands the note to the database, whose Row
// Level Security shows only that parent's rows (migration 011).
//
// Analogy: a hotel key card, programmed at the front desk for one room and a
// short time. Anyone can read what is written on the card; only the front
// desk's secret can make one the locks accept.
//
// Why built by hand: the format is three short pieces joined by dots, and
// Node's own crypto tools can sign it, so no new library is needed (rule 8).
// The signing secret lives only in Vercel's settings (SUPABASE_JWT_SECRET),
// never in code or Git.
// =============================================================================

import { createHmac } from "node:crypto";
import { PASS_SECONDS } from "../settings.js";

const piece = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

export function signPass(parentId: number, signingSecret: string, now: Date): string {
  const issued = Math.floor(now.getTime() / 1000);
  const header = piece({ alg: "HS256", typ: "JWT" });
  // role and aud: what Supabase expects of a signed-in request; parent_id: what
  // the database's pass_parent_id() reads; exp: when the pass stops working.
  const payload = piece({ role: "authenticated", aud: "authenticated", parent_id: String(parentId), iat: issued, exp: issued + PASS_SECONDS });
  const signature = createHmac("sha256", signingSecret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}
