// =============================================================================
// src/datastore/supabase-store.ts: the real database behind the bot's "menu" (thin slice 1)
//
// What it does: [2026-11-11] carries out each item of store.ts on the real
// Supabase project, using the approved library @supabase/supabase-js. Writes
// go through the database's all-or-nothing functions (save_habit_log,
// record_message_sent, record_settings_version; [2026-11-12] and the sign-up
// functions of migration 007: start_sign_up, save_sign_up_step, finish_sign_up,
// record_start_now_not_now, clean_up_sign_ups) or the one direct insert the
// server is allowed (events), so the database's own rules still hold (rule 8.4).
//
// Why it isn't covered by the app tests: it needs the real Supabase project.
// The database functions it calls have their own tests (T1 to T56), and the
// owner's step-by-step checks (UAT) cover the whole path.
//
// Secrets: the Supabase address and server key come only from Vercel's
// settings. Errors are thrown, never replaced with made-up values (rule 1.3).
// =============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SETTINGS_KEYS_THE_DATABASE_READS, THIN_SLICE_NUDGE, WEEK_ONE_COHORT, WEEK_ONE_VARIANTS, DEFAULT_WEEKLY_WRAP_UP, AGREEMENT_WORDING_VERSION } from "../settings.js";
import { currentConsent, type ConsentRow } from "./consents.js";
import type { Behaviour, DraftAnswers, NudgeCandidate, StartSignUpResult, Store } from "./store.js";
import { addDays, sgtInstant } from "../sgt.js";

// Stop with a clear message if Supabase reports an error.
function check<T>(r: { data: T; error: { message: string } | null }, what: string): T {
  if (r.error) throw new Error(`${what} failed: ${r.error.message}`);
  return r.data;
}

// Like check, but the answer must be there (a single row we know exists).
function need<T>(r: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  const data = check(r, what);
  if (data === null || data === undefined) throw new Error(`${what} failed: nothing found`);
  return data as NonNullable<T>;
}

export function createSupabaseStore(url: string, serverKey: string): Store {
  const db: SupabaseClient = createClient(url, serverKey, { auth: { persistSession: false } });
  const variants = [...WEEK_ONE_VARIANTS];

  // Every event is stamped with the settings version in force (rule 11.2). The
  // database returns the same version for the same values, so this is safe to repeat.
  let version: number | null = null;
  async function settingsVersion(): Promise<number> {
    if (version === null) {
      version = check(
        await db.rpc("record_settings_version", { p_note: "thin slice 1", p_settings: SETTINGS_KEYS_THE_DATABASE_READS }),
        "Recording the settings version",
      ) as number;
    }
    return version;
  }

  return {
    async findParent(telegramId) {
      const row = check(await db.from("parents").select("id, paused, first_name").eq("telegram_id", telegramId).maybeSingle(), "Finding the parent");
      return row ? { id: Number(row.id), paused: Boolean(row.paused), firstName: String(row.first_name) } : null;
    },

    // [2026-11-12] Pull request 2: sign-up on the draft (migration 007).
    async findDraft(telegramId) {
      const row = check(
        await db.from("sign_up_drafts").select("step, answers").eq("telegram_id", telegramId).is("cut_down_at", null).maybeSingle(),
        "Finding the sign-up draft",
      );
      return row ? { step: String(row.step), answers: row.answers as DraftAnswers } : null;
    },

    async startSignUp(a): Promise<StartSignUpResult> {
      const r = await db.rpc("start_sign_up", { p_telegram_id: a.telegramId, p_first_name: a.firstName, p_code: a.code });
      // The database explains a refusal in words (migration 007).
      if (r.error?.message.includes("already signed up")) return { ok: false, reason: "already" };
      if (r.error?.message.includes("unknown, used or held")) return { ok: false, reason: "bad_code" };
      // 23505 (duplicate key): the same /start arrived twice at the same moment; the first started the draft.
      if ((r.error as { code?: string } | null)?.code === "23505") return { ok: true };
      check(r, "Starting the sign-up");
      return { ok: true };
    },

    async saveSignUpStep(telegramId, step, answers) {
      check(await db.rpc("save_sign_up_step", { p_telegram_id: telegramId, p_step: step, p_answers: answers }), "Saving the sign-up step");
    },

    async finishSignUp(a) {
      const id = check(
        await db.rpc("finish_sign_up", {
          p_telegram_id: a.telegramId,
          p_cohort: WEEK_ONE_COHORT,
          p_wrap_up_minute: DEFAULT_WEEKLY_WRAP_UP.minutes,
          p_wording_version: AGREEMENT_WORDING_VERSION,
          p_update: a.updateId,
          p_version: await settingsVersion(),
          p_variants: variants,
        }),
        "Finishing the sign-up",
      );
      return Number(id);
    },

    async behaviours(): Promise<Behaviour[]> {
      const rows = check(
        await db.from("nudges").select("id, name, category, start_now_line").eq("active", true).eq("starts_unlocked", true).order("id"),
        "Reading the behaviours",
      );
      return (rows ?? []).map((r) => ({
        id: Number(r.id),
        name: String(r.name),
        category: r.category === "quick" ? "quick" : "deliberate",
        startNowLine: r.start_now_line === null ? null : String(r.start_now_line),
      }));
    },

    async recordStartNowShown(a) {
      const id = check(
        await db.rpc("record_message_sent", {
          p_parent: a.parentId, p_kind: "start_now", p_nudge: a.nudgeId, p_example: null,
          p_day: a.day, p_slot: null, p_version: await settingsVersion(), p_variants: variants,
        }),
        "Recording Start right now as sent",
      );
      return Number(id);
    },

    async findStartNow(parentId) {
      const msg = check(
        await db.from("messages_sent").select("id, nudge_id, for_day").eq("parent_id", parentId).eq("kind", "start_now").maybeSingle(),
        "Finding the start-now message",
      );
      if (!msg) return null;
      const nudge = need(await db.from("nudges").select("name").eq("id", msg.nudge_id).single(), "Reading the nudge name");
      const logs = check(
        await db.from("habit_logs").select("id").eq("from_message_id", msg.id).is("undone_at", null).limit(1),
        "Checking for a start-now log",
      );
      const type = need(await db.from("event_types").select("id").eq("name", "start_now_not_now").single(), "Reading the event type");
      const notNow = check(
        await db.from("events").select("id").eq("parent_id", parentId).eq("event_type_id", type.id).limit(1),
        "Checking for Not now",
      );
      const answer = (logs ?? []).length > 0 ? "done" : (notNow ?? []).length > 0 ? "not_now" : null;
      return { messageId: Number(msg.id), nudgeId: Number(msg.nudge_id), nudgeName: String(nudge.name), day: String(msg.for_day), answer };
    },

    async saveStartNowLog(a) {
      const r = await db.rpc("save_habit_log", {
        p_parent: a.parentId, p_nudge: a.nudgeId, p_day: a.day, p_from_message: a.messageId, p_via: "start_now",
        p_description: null, p_update: a.updateId, p_version: await settingsVersion(), p_variants: variants,
      });
      // 23505: a log for this message already exists (two taps at the same instant, migration 007).
      if ((r.error as { code?: string } | null)?.code === "23505") return "duplicate";
      const id = check(r, "Saving the start-now log");
      return id === null ? "duplicate" : "saved";
    },

    async recordStartNowNotNow(parentId, updateId) {
      const r = await db.rpc("record_start_now_not_now", {
        p_parent: parentId, p_update: updateId, p_version: await settingsVersion(), p_variants: variants,
      });
      // 23505 = "already saved": Telegram resent the same tap (rule 8.6).
      if (r.error && (r.error as { code?: string }).code !== "23505") throw new Error(`Recording Not now failed: ${r.error.message}`);
    },

    async cleanUpSignUps() {
      check(await db.rpc("clean_up_sign_ups", { p_version: await settingsVersion() }), "Cleaning up sign-ups");
    },

    async fixedNudge(day) {
      const nudge = need(await db.from("nudges").select("id, name").eq("code", THIN_SLICE_NUDGE.code).single(), "Reading the nudge");
      const examples = check(
        await db.from("examples").select("id, example").eq("nudge_code", THIN_SLICE_NUDGE.code).eq("active", true).order("id"),
        "Reading the examples",
      );
      if (!examples || examples.length === 0) throw new Error("The fixed nudge has no active examples");
      // A different example each day, in turn (a simple stand-in for rule 3.13's rotation).
      const dayNumber = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
      const ex = examples[dayNumber % examples.length]!;
      return { nudgeId: Number(nudge.id), name: String(nudge.name), exampleId: Number(ex.id), example: String(ex.example) };
    },

    async nudgeCandidates(day, slotMinute): Promise<NudgeCandidate[]> {
      const parents = check(await db.from("parents").select("id, telegram_id, paused"), "Reading parents");
      const consents = check(await db.from("consents").select("parent_id, topic, answer, created_at").eq("topic", "recording"), "Reading consents");
      const sent = check(
        await db.from("messages_sent").select("parent_id").eq("kind", "nudge").eq("for_day", day).eq("slot_minute", slotMinute),
        "Reading tonight's nudges",
      );
      const sentTo = new Set((sent ?? []).map((s) => Number(s.parent_id)));
      return (parents ?? []).map((p) => {
        const rows: ConsentRow[] = (consents ?? [])
          .filter((c) => Number(c.parent_id) === Number(p.id))
          .map((c) => ({ topic: c.topic, answer: c.answer, createdAt: c.created_at }));
        return {
          parentId: Number(p.id),
          telegramId: Number(p.telegram_id),
          paused: Boolean(p.paused),
          recordingConsent: currentConsent(rows, "recording"),
          alreadySent: sentTo.has(Number(p.id)),
        };
      });
    },

    async recordNudgeSent(a) {
      check(
        await db.rpc("record_message_sent", {
          p_parent: a.parentId, p_kind: "nudge", p_nudge: a.nudgeId, p_example: a.exampleId,
          p_day: a.day, p_slot: a.slotMinute, p_version: await settingsVersion(), p_variants: variants,
        }),
        "Recording the nudge as sent",
      );
    },

    async findNudgeMessage(parentId, day, slotMinute) {
      const msg = check(
        await db.from("messages_sent").select("id, nudge_id").eq("parent_id", parentId).eq("kind", "nudge").eq("for_day", day).eq("slot_minute", slotMinute).maybeSingle(),
        "Finding the nudge message",
      );
      if (!msg) return null;
      const nudge = need(await db.from("nudges").select("name").eq("id", msg.nudge_id).single(), "Reading the nudge name");
      return { messageId: Number(msg.id), nudgeId: Number(msg.nudge_id), nudgeName: String(nudge.name) };
    },

    async logExistsFor(messageId) {
      const rows = check(
        await db.from("habit_logs").select("id").eq("from_message_id", messageId).is("undone_at", null).limit(1),
        "Checking for a saved log",
      );
      return (rows ?? []).length > 0;
    },

    async saveDoneLog(a) {
      const id = check(
        await db.rpc("save_habit_log", {
          p_parent: a.parentId, p_nudge: a.nudgeId, p_day: a.day, p_from_message: a.messageId, p_via: "done_button",
          p_description: null, p_update: a.updateId, p_version: await settingsVersion(), p_variants: variants,
        }),
        "Saving the log",
      );
      return id === null ? "duplicate" : "saved";
    },

    async recordNotToday(parentId, updateId) {
      const type = need(await db.from("event_types").select("id").eq("name", "not_today").single(), "Reading the event type");
      const r = await db.from("events").insert({
        parent_id: parentId, event_type_id: type.id, settings_version: await settingsVersion(), variants, telegram_update_id: updateId,
      });
      // 23505 = "already saved": Telegram resent the same tap (rule 8.6).
      if (r.error && (r.error as { code?: string }).code !== "23505") throw new Error(`Recording Not today failed: ${r.error.message}`);
    },

    // [2026-11-12] Rule 5.10: any "not_today" event for this parent between
    // midnight and the next midnight, Singapore time.
    async notTodayOn(parentId, day) {
      const type = need(await db.from("event_types").select("id").eq("name", "not_today").single(), "Reading the event type");
      const rows = check(
        await db
          .from("events")
          .select("id")
          .eq("parent_id", parentId)
          .eq("event_type_id", type.id)
          .gte("occurred_at", sgtInstant(day, 0).toISOString())
          .lt("occurred_at", sgtInstant(addDays(day, 1), 0).toISOString())
          .limit(1),
        "Checking for Not today",
      );
      return (rows ?? []).length > 0;
    },
  };
}
