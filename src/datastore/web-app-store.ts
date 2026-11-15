// =============================================================================
// src/datastore/web-app-store.ts: what the Web app may ask the database to do
//
// What it does: [2026-11-15] the Web app's own "menu" of database requests
// (like store.ts is the bot's), and the real Supabase behind it. It uses only
// the **public key** (Supabase's anon key), never the master key (rule 9.8):
//   - without a pass: use a sign-in link, check a sign-in, sign out (the three
//     functions a signed-out browser may call, migration 011);
//   - with one parent's pass: read one week (read 1). Row Level Security in
//     the database then shows only that parent's rows.
// The answer from the database is checked for the expected shape before it
// is trusted (approved library zod), so a surprise is a failure, not a
// half-filled page (rule 1.3).
//
// Why a separate menu: the Web app and the bot hold different keys and may
// do different things; keeping them apart means the Web app can't reach the
// bot's master-key connection by mistake (test W9).
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// What one week looks like to our server (read 1). Photo paths stay on our
// server: it turns them into short-lived links before a page shows a photo.
const photoShape = z.object({ photo_id: z.number(), path: z.string(), preview_path: z.string().nullable() });
const weekShape = z.object({
  parent_first_name: z.string(),
  children: z.array(z.string()),
  logs: z.array(z.object({ log_id: z.number(), habit: z.string(), day: z.string(), line: z.string().nullable(), photo: photoShape.nullable() })),
  reflections: z.array(z.object({ reflection_id: z.number(), day: z.string(), text: z.string() })),
  moment: z
    .object({ photo: photoShape.nullable(), line: z.object({ moment_line_id: z.number(), text: z.string() }).nullable() })
    .nullable(),
  older_weeks: z.number(),
});
export type WebWeek = {
  parentFirstName: string;
  children: string[];
  logs: z.infer<typeof weekShape>["logs"];
  reflections: z.infer<typeof weekShape>["reflections"];
  moment: z.infer<typeof weekShape>["moment"];
  olderWeeks: number;
};

export interface WebAppDb {
  // The button press: use the link (once) and start a sign-in. Gives the
  // sign-in's end, or "expired" for a used, expired or unknown link.
  redeemSignInLink(linkSecret: string, signInSecret: string): Promise<Date | "expired">;
  // Which parent a signed-in browser belongs to, or null if it isn't signed in.
  signInParent(signInSecret: string): Promise<number | null>;
  // Sign out: end this sign-in straight away.
  endSignIn(signInSecret: string): Promise<void>;
  // Read 1, one week, with one parent's pass. monday is "YYYY-MM-DD".
  week(pass: string, monday: string): Promise<WebWeek>;
}

// The database's own words for "this link can't be used" and "not signed in"
// (migration 011). Anything else is a real failure (rule 1.3).
const EXPIRED = /This link has expired|Not a sign-in secret/;
const NOT_SIGNED_IN = /Not signed in|Not a sign-in secret/;

export function createWebAppStore(url: string, publicKey: string): WebAppDb {
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const signedOut = createClient(url, publicKey, options);
  // One parent's connection: the same public key, plus their pass in the header.
  const withPass = (pass: string) => createClient(url, publicKey, { ...options, global: { headers: { Authorization: `Bearer ${pass}` } } });

  return {
    async redeemSignInLink(linkSecret, signInSecret) {
      const r = await signedOut.rpc("redeem_sign_in_link", { p_link_secret: linkSecret, p_sign_in_secret: signInSecret });
      if (r.error) {
        if (EXPIRED.test(r.error.message)) return "expired";
        throw new Error(`Using a sign-in link failed: ${r.error.message}`);
      }
      return new Date(z.string().parse(r.data));
    },
    async signInParent(signInSecret) {
      const r = await signedOut.rpc("sign_in_parent", { p_sign_in_secret: signInSecret });
      if (r.error) {
        if (NOT_SIGNED_IN.test(r.error.message)) return null;
        throw new Error(`Checking a sign-in failed: ${r.error.message}`);
      }
      return z.number().parse(r.data);
    },
    async endSignIn(signInSecret) {
      const r = await signedOut.rpc("end_sign_in", { p_sign_in_secret: signInSecret });
      if (r.error && !/Not a sign-in secret/.test(r.error.message)) throw new Error(`Signing out failed: ${r.error.message}`);
    },
    async week(pass, monday) {
      const r = await withPass(pass).rpc("web_week", { p_monday: monday });
      if (r.error) throw new Error(`Reading the week failed: ${r.error.message}`);
      const w = weekShape.parse(r.data);
      return {
        parentFirstName: w.parent_first_name,
        children: w.children,
        logs: w.logs,
        reflections: w.reflections,
        moment: w.moment,
        olderWeeks: w.older_weeks,
      };
    },
  };
}
