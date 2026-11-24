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
//   - [2026-11-15] Week so far: also the older weeks (read 2), the connection
//     history (read 3) and the three line deletes (rule 8.4 edits 11 to 13),
//     each with that parent's pass.
// The answer from the database is checked for the expected shape before it
// is trusted (approved library zod), so a surprise is a failure, not a
// half-filled page (rule 1.3).
//
// [2026-11-24] Photos (owner-approved tests PH11, PH12; migration 012): a
// short-lived link to one photo file for My page, and for the dustbin the
// photo's file names and removing those files, all with that parent's pass:
// the store's locks let a pass reach only its own parent's folder.
//
// Why a separate menu: the Web app and the bot hold different keys and may
// do different things; keeping them apart means the Web app can't reach the
// bot's master-key connection by mistake (test W9).
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { PHOTO_LINK_SECONDS, WEEK_ONE_VARIANTS } from "../settings.js";

// [2026-11-24] The private photo store (migration 012).
const PHOTO_BUCKET = "photos";

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

// Read 2, older weeks: one page of weeks, newest first, and what the next tap loads.
const tileShape = z.object({
  kind: z.enum(["moment", "log", "reflection"]),
  preview_path: z.string().optional(),
  habit: z.string().optional(),
  text: z.string().optional(),
});
const olderShape = z.object({
  weeks: z.array(
    z.object({
      monday: z.string(),
      days_logged: z.number(),
      habit_logs: z.number(),
      reflections: z.number(),
      moment: z.boolean(),
      tiles: z.array(tileShape),
    }),
  ),
  weeks_remaining: z.number(),
  next_oldest_monday: z.string().nullable(),
});
export type OlderTile = { kind: "moment" | "log" | "reflection"; previewPath?: string; habit?: string; text?: string };
export type OlderWeek = { monday: string; daysLogged: number; habitLogs: number; reflections: number; moment: boolean; tiles: OlderTile[] };
export type OlderWeeksPage = { weeks: OlderWeek[]; weeksRemaining: number; nextOldestMonday: string | null };
// Read 3: a week's Monday and its 1 to 5 answer, or null for no answer.
const connectionShape = z.array(z.object({ monday: z.string(), rating: z.number().nullable() }));
export type ConnectionWeek = z.infer<typeof connectionShape>[number];
// The things a dustbin on Week so far can delete (rule 9.6): a log's
// line (edit 11), a reflection (edit 12), a moment's line (edit 13), and
// [2026-11-24] a log's photo or a moment's photo (edit 6; its files go first).
export type DeleteKind = "line" | "reflection" | "moment-line" | "photo" | "moment-photo";
const DELETE_FUNCTIONS: Record<DeleteKind, { fn: string; idName: string }> = {
  line: { fn: "web_wipe_log_line", idName: "p_log" },
  reflection: { fn: "web_remove_reflection", idName: "p_reflection" },
  "moment-line": { fn: "web_remove_moment_line", idName: "p_moment_line" },
  photo: { fn: "web_delete_photo", idName: "p_photo" },
  "moment-photo": { fn: "web_delete_photo", idName: "p_photo" },
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
  // Read 2: the next page of older weeks before a Monday.
  olderWeeks(pass: string, before: string): Promise<OlderWeeksPage>;
  // Read 3: the connection answers around a Monday (rule 9.5).
  connectionHistory(pass: string, monday: string): Promise<ConnectionWeek[]>;
  // One dustbin tap (rule 9.6). Throws if it isn't this parent's or is already gone.
  deleteEntry(pass: string, kind: DeleteKind, id: number): Promise<void>;
  // [2026-11-24] A link to one photo file that stops working after PHOTO_LINK_SECONDS (PH11).
  photoLink(pass: string, path: string): Promise<string>;
  // [2026-11-24] The file names of one of this parent's photos (the photo and
  // its small preview, if any). Throws if it isn't theirs or is gone.
  photoFiles(pass: string, photoId: number): Promise<string[]>;
  // [2026-11-24] Remove photo files from the store, before the record (rule 8.5, PH12).
  removePhotoFiles(pass: string, paths: string[]): Promise<void>;
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
    async olderWeeks(pass, before) {
      const r = await withPass(pass).rpc("web_older_weeks", { p_before: before });
      if (r.error) throw new Error(`Reading older weeks failed: ${r.error.message}`);
      const o = olderShape.parse(r.data);
      return {
        weeks: o.weeks.map((w) => ({
          monday: w.monday,
          daysLogged: w.days_logged,
          habitLogs: w.habit_logs,
          reflections: w.reflections,
          moment: w.moment,
          tiles: w.tiles.map((t) => ({ kind: t.kind, previewPath: t.preview_path, habit: t.habit, text: t.text })),
        })),
        weeksRemaining: o.weeks_remaining,
        nextOldestMonday: o.next_oldest_monday,
      };
    },
    async connectionHistory(pass, monday) {
      const r = await withPass(pass).rpc("web_connection_history", { p_monday: monday });
      if (r.error) throw new Error(`Reading the connection history failed: ${r.error.message}`);
      return connectionShape.parse(r.data);
    },
    async deleteEntry(pass, kind, id) {
      const db = withPass(pass);
      // Each event is stamped with the settings version in force (rule 11.2).
      const v = await db.rpc("current_settings_version");
      if (v.error) throw new Error(`Reading the settings version failed: ${v.error.message}`);
      const { fn, idName } = DELETE_FUNCTIONS[kind];
      const r = await db.rpc(fn, { [idName]: id, p_version: z.number().parse(v.data), p_variants: [...WEEK_ONE_VARIANTS] });
      if (r.error) throw new Error(`Deleting failed: ${r.error.message}`);
    },
    async photoLink(pass, path) {
      const r = await withPass(pass).storage.from(PHOTO_BUCKET).createSignedUrl(path, PHOTO_LINK_SECONDS);
      if (r.error) throw new Error(`Making a photo link failed: ${r.error.message}`);
      return z.string().url().parse(r.data?.signedUrl);
    },
    async photoFiles(pass, photoId) {
      const r = await withPass(pass).from("photos").select("storage_path, preview_path").eq("id", photoId);
      if (r.error) throw new Error(`Reading a photo failed: ${r.error.message}`);
      const row = z.array(z.object({ storage_path: z.string(), preview_path: z.string().nullable() })).parse(r.data)[0];
      if (!row) throw new Error("That photo was not found.");
      return [row.storage_path, ...(row.preview_path ? [row.preview_path] : [])];
    },
    async removePhotoFiles(pass, paths) {
      const r = await withPass(pass).storage.from(PHOTO_BUCKET).remove(paths);
      if (r.error) throw new Error(`Removing photo files failed: ${r.error.message}`);
      // A file already gone (an earlier try removed it, then the record failed)
      // is not an error, so a retry can finish the delete. The files are the
      // parent's own (photoFiles reads them with the same pass), and the
      // store's locks match (one folder per parent, migration 012).
    },
  };
}
