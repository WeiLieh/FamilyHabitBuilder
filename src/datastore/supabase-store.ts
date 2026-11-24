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
// [2026-11-13] Pull request 3c: the thin-slice fixedNudge and nudgeCandidates
// are replaced by planningData (each parent's picks, slots, logs, sent
// messages, Not today, children, ideas used, and the holidays, read from the
// tables our server may read) and claimSignUpReminders (migration 009).
//
// [2026-11-14] B1, log any time: the keyboard's and /log's logs (saveLog,
// waitingNudge, loggedToday, chosenBehaviours), Undo (undoLog, through the
// database's undo_log), /resume (update_parent_settings), and migration 010's
// Telegram message numbers (recordNudgeSent, findDraft, recordSignUpScreen).
//
// Secrets: the Supabase address and server key come only from Vercel's
// settings. Errors are thrown, never replaced with made-up values (rule 1.3).
// =============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SETTINGS_KEYS_THE_DATABASE_READS, WEEK_ONE_COHORT, WEEK_ONE_VARIANTS, DEFAULT_WEEKLY_WRAP_UP, AGREEMENT_WORDING_VERSION } from "../settings.js";
import { currentConsent, type ConsentRow } from "./consents.js";
import type { Behaviour, DraftAnswers, ExampleIdea, PlanParent, StartSignUpResult, Store } from "./store.js";
import type { Holidays } from "../nudge-engine/schedule.js";
import type { Frequency } from "../nudge-engine/choices.js";
import { addDays, mondayOf, sgtInstant } from "../sgt.js";
import { randomUUID } from "node:crypto";
import { LINE_WAIT_SECONDS, PHOTO_CONSENT_WORDING_VERSION } from "../settings.js";

// [2026-11-24] The private photo store (migration 012): one folder per parent.
const PHOTO_BUCKET = "photos";

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

  // [2026-11-13] How far back the planner looks: 14 days covers the 7-day
  // streak (rule 3.9), the week's deliberate count (rule 3.7) and yesterday.
  const LOOK_BACK_DAYS = 14;
  // [2026-11-13, review] Supabase answers at most this many rows per question
  // (its usual setting). An answer that reaches it may be missing rows, so it
  // is refused with an error rather than planned from (rule 1.3). The design
  // for thousands of parents is in docs/PRODUCT-BACKLOG.md.
  const ROW_CAP = 1000;
  function whole<T>(rows: T[] | null, what: string): T[] {
    const list = rows ?? [];
    if (list.length >= ROW_CAP) throw new Error(`${what}: ${list.length} rows reached Supabase's limit, so some may be missing`);
    return list;
  }

  // [2026-11-13] The planner's view of some parents (all of them, or one).
  async function loadPlan(day: string, onlyParent: number | null): Promise<{ holidays: Holidays; parents: PlanParent[] }> {
    // Adds "only this parent" to a question when reading for one parent.
    const one = <Q>(q: Q, column = "parent_id"): Q => (onlyParent === null ? q : (q as unknown as { eq: (c: string, v: number) => Q }).eq(column, onlyParent));
    const since = addDays(day, -LOOK_BACK_DAYS);
    const full = onlyParent !== null; // one parent: also their children and full history (privacy review)
    // [2026-11-24] Demo parents never get the alarm's messages, and an owner gets none while their demo runs (rules 12.3, 12.7).
    const allParents = whole(check(await one(db.from("parents").select("id, telegram_id, paused, demo_of"), "id"), "Reading parents"), "Reading parents");
    const inDemo = await demoOwners(allParents);
    const parents = allParents.filter((p) => onlyParent !== null ? true : p.demo_of === null && !inDemo.has(Number(p.telegram_id)));
    const consents = whole(check(await one(db.from("consents").select("parent_id, topic, answer, created_at").eq("topic", "recording")), "Reading consents"), "Reading consents");
    const nudges = whole(check(await db.from("nudges").select("id, category"), "Reading the behaviours"), "Reading the behaviours");
    const picks = whole(check(await one(db.from("picks").select("parent_id, nudge_id, frequency").is("stopped_at", null).order("id")), "Reading picks"), "Reading picks");
    const slots = whole(check(await one(db.from("slots").select("parent_id, schedule, start_minute, created_at")), "Reading slots"), "Reading slots");
    const logs = whole(check(await one(db.from("habit_logs").select("parent_id, nudge_id, for_day").is("undone_at", null).gte("for_day", since)), "Reading logs"), "Reading logs");
    // All parents: only the last 14 days of nudges. One parent: their whole history (ideas used, children named).
    const sentQuery = db.from("messages_sent").select("parent_id, kind, nudge_id, example_id, for_day, slot_minute").in("kind", ["nudge", "start_now"]).order("id");
    const sent = whole(check(await one(full ? sentQuery : sentQuery.gte("for_day", since)), "Reading sent messages"), "Reading sent messages");
    const children = full
      ? whole(check(await one(db.from("children").select("id, parent_id, first_name, replaces_id").order("id")), "Reading children"), "Reading children")
      : [];
    const notTodayType = need(await db.from("event_types").select("id").eq("name", "not_today").single(), "Reading the event type");
    const notToday = whole(
      check(
        await one(
          db.from("events").select("parent_id").eq("event_type_id", notTodayType.id)
            .gte("occurred_at", sgtInstant(day, 0).toISOString()).lt("occurred_at", sgtInstant(addDays(day, 1), 0).toISOString()),
        ),
        "Reading Not today",
      ),
      "Reading Not today",
    );
    const holidayRows = whole(check(await db.from("holiday_dates").select("day, kind"), "Reading holidays"), "Reading holidays");

    const category = new Map(nudges.map((n) => [Number(n.id), n.category as "quick" | "deliberate"]));
    const replaced = new Set(children.map((c) => c.replaces_id).filter((x) => x !== null).map(Number));
    const holidays: Holidays = {
      publicHolidays: holidayRows.filter((h) => h.kind === "public_holiday").map((h) => String(h.day)),
      schoolHolidays: holidayRows.filter((h) => h.kind === "school_holiday").map((h) => String(h.day)),
    };
    const of = <T extends { parent_id: unknown }>(rows: T[], id: number) => rows.filter((r) => Number(r.parent_id) === id);
    return {
      holidays,
      parents: parents.map((p): PlanParent => {
        const id = Number(p.id);
        const mySlots = of(slots, id);
        const myConsents: ConsentRow[] = of(consents, id).map((c) => ({ topic: c.topic, answer: c.answer, createdAt: c.created_at }));
        const mySent = of(sent, id);
        const changed = mySlots.map((x) => Date.parse(String(x.created_at))).filter((t) => !Number.isNaN(t));
        return {
          parentId: id,
          telegramId: Number(p.telegram_id),
          paused: Boolean(p.paused),
          agreed: currentConsent(myConsents, "recording") === "agreed",
          targets: of(picks, id).map((x) => {
            const cat = category.get(Number(x.nudge_id));
            if (!cat) throw new Error(`Behaviour ${x.nudge_id} has no category`);
            return { nudgeId: Number(x.nudge_id), category: cat, frequency: x.frequency as Frequency };
          }),
          schedules: {
            school: mySlots.filter((x) => x.schedule === "school").map((x) => Number(x.start_minute)).sort((a, b) => a - b),
            nonSchool: mySlots.filter((x) => x.schedule === "non_school").map((x) => Number(x.start_minute)).sort((a, b) => a - b),
          },
          slotsChangedAt: changed.length > 0 ? new Date(Math.max(...changed)) : null,
          logs: of(logs, id).map((l) => ({ nudgeId: Number(l.nudge_id), date: String(l.for_day) })),
          messagesSent: mySent
            .filter((m) => m.kind === "nudge" && String(m.for_day) >= since)
            .map((m) => ({ kind: "nudge" as const, date: String(m.for_day), slotStart: Number(m.slot_minute), nudgeId: Number(m.nudge_id) })),
          notTodayDate: of(notToday, id).length > 0 ? day : null,
          // Current names only (an edited name replaces its old row), oldest first.
          children: of(children, id).filter((c) => !replaced.has(Number(c.id))).map((c) => String(c.first_name)),
          childMessagesBefore: full ? mySent.length : 0, // every nudge and start-now message names a child (rule 3.16)
          examplesUsed: (full ? mySent : [])
            .filter((m) => m.kind === "nudge" && m.example_id !== null)
            .map((m) => ({ nudgeId: Number(m.nudge_id), exampleId: Number(m.example_id) })),
        };
      }),
    };
  }

  // [2026-11-24] The owners whose demo is running: a demo parent, or a demo sign-up (a negative number).
  async function demoOwners(parents: { telegram_id: unknown; demo_of: unknown }[]): Promise<Set<number>> {
    const owners = new Set(parents.filter((p) => p.demo_of !== null).map((p) => -Number(p.telegram_id)));
    const drafts = check(await db.from("sign_up_drafts").select("telegram_id").lt("telegram_id", 0), "Reading demo sign-ups") ?? [];
    for (const d of drafts) owners.add(-Number(d.telegram_id));
    return owners;
  }

  return {
    async findParent(telegramId) {
      const row = check(await db.from("parents").select("id, paused, first_name").eq("telegram_id", telegramId).maybeSingle(), "Finding the parent");
      return row ? { id: Number(row.id), paused: Boolean(row.paused), firstName: String(row.first_name) } : null;
    },

    // [2026-11-12] Pull request 2: sign-up on the draft (migration 007).
    async findDraft(telegramId) {
      const row = check(
        await db.from("sign_up_drafts").select("step, answers, screen_message_id").eq("telegram_id", telegramId).is("cut_down_at", null).maybeSingle(),
        "Finding the sign-up draft",
      );
      return row
        ? { step: String(row.step), answers: row.answers as DraftAnswers, screenMessageId: row.screen_message_id === null ? null : Number(row.screen_message_id) }
        : null;
    },

    // [2026-11-14] Migration 010 (B1-D10).
    async recordSignUpScreen(telegramId, messageId) {
      check(await db.rpc("record_sign_up_screen", { p_telegram_id: telegramId, p_message_id: messageId }), "Noting the sign-up screen's number");
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

    async planningData(day) {
      return loadPlan(day, null);
    },

    async planningDataFor(parentId, day) {
      const { holidays, parents } = await loadPlan(day, parentId);
      return { holidays, parent: parents[0] ?? null };
    },

    async nudgeExamples(nudgeId): Promise<ExampleIdea[]> {
      const nudge = need(await db.from("nudges").select("code").eq("id", nudgeId).single(), "Reading the behaviour");
      const rows = check(await db.from("examples").select("id, example, active").eq("nudge_code", nudge.code).order("id"), "Reading the ideas") ?? [];
      return rows.map((e) => ({ id: Number(e.id), active: Boolean(e.active), example: String(e.example) }));
    },

    // [2026-11-13] Migration 009: marks and returns, in one step, who is due their one reminder.
    async claimSignUpReminders() {
      const rows = check(await db.rpc("claim_sign_up_reminders", { p_version: await settingsVersion() }), "Claiming sign-up reminders") as
        | { telegram_id: number; step: string }[]
        | null;
      return (rows ?? []).map((r) => ({ telegramId: Number(r.telegram_id), step: String(r.step) }));
    },

    async recordNudgeSent(a) {
      check(
        await db.rpc("record_message_sent", {
          p_parent: a.parentId, p_kind: "nudge", p_nudge: a.nudgeId, p_example: a.exampleId,
          p_day: a.day, p_slot: a.slotMinute, p_version: await settingsVersion(), p_variants: variants,
          p_telegram_message: a.telegramMessageId, // [2026-11-14] migration 010
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
      return id === null ? "duplicate" : { logId: Number(id) };
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

    // ---- [2026-11-14] B1, log any time ----
    async chosenBehaviours(parentId) {
      const picks = check(
        await db.from("picks").select("nudge_id").eq("parent_id", parentId).is("stopped_at", null).order("id"),
        "Reading the chosen behaviours",
      ) ?? [];
      if (picks.length === 0) return [];
      const ids = picks.map((p) => Number(p.nudge_id));
      const names = check(await db.from("nudges").select("id, name").in("id", ids), "Reading the behaviours' names") ?? [];
      return ids.map((id) => {
        const n = names.find((x) => Number(x.id) === id);
        if (!n) throw new Error(`Behaviour ${id} has no name`); // never a made-up name (rule 1.3)
        return { id, name: String(n.name) };
      });
    },

    // Today's nudges for this behaviour, newest first: the first with no log from it,
    // unless Not today was tapped today (it answers every nudge of the day, rule 5.10).
    async waitingNudge(parentId, day, nudgeId) {
      if (await this.notTodayOn(parentId, day)) return null;
      const sent = check(
        await db.from("messages_sent").select("id, telegram_message_id").eq("parent_id", parentId).eq("kind", "nudge")
          .eq("for_day", day).eq("nudge_id", nudgeId).order("id", { ascending: false }),
        "Finding a waiting nudge",
      ) ?? [];
      for (const m of sent) {
        if (!(await this.logExistsFor(Number(m.id)))) {
          return { messageId: Number(m.id), telegramMessageId: m.telegram_message_id === null ? null : Number(m.telegram_message_id) };
        }
      }
      return null;
    },

    async loggedToday(parentId, nudgeId, day) {
      const rows = check(
        await db.from("habit_logs").select("id").eq("parent_id", parentId).eq("nudge_id", nudgeId).eq("for_day", day).is("undone_at", null).limit(1),
        "Checking today's logs",
      );
      return (rows ?? []).length > 0;
    },

    async saveLog(a) {
      const r = await db.rpc("save_habit_log", {
        p_parent: a.parentId, p_nudge: a.nudgeId, p_day: a.day, p_from_message: a.messageId, p_via: a.via,
        p_description: null, p_update: a.updateId, p_version: await settingsVersion(), p_variants: variants,
      });
      // 23505: a log from this nudge already exists (a Done tap at the same instant, migration 007).
      if ((r.error as { code?: string } | null)?.code === "23505") return "duplicate";
      const id = check(r, "Saving the log");
      return id === null ? "duplicate" : { logId: Number(id) };
    },

    // The database decides (its own clock, the window from the settings
    // version) and explains a refusal in words (migration 005).
    async undoLog(parentId, logId) {
      const r = await db.rpc("undo_log", { p_parent: parentId, p_log: logId, p_version: await settingsVersion(), p_variants: variants });
      const message = r.error?.message ?? "";
      if (message.includes("Undo window has passed")) return "expired";
      if (message.includes("does not belong") || message.includes("already undone") || message.includes("Only a keyboard log")) return "not_allowed";
      check(r, "Undoing the log");
      return "undone";
    },

    // Rule 8.4 edit 1 changes paused and the Wrap Up time together, so the
    // Wrap Up time is read first and kept as it is.
    async resumeReminders(parentId) {
      const p = need(await db.from("parents").select("wrap_up_minute").eq("id", parentId).single(), "Reading the parent's settings");
      check(
        await db.rpc("update_parent_settings", {
          p_parent: parentId, p_paused: false, p_wrap_up_minute: Number(p.wrap_up_minute), p_version: await settingsVersion(), p_variants: variants,
        }),
        "Resuming reminders",
      );
    },

    // ---- [2026-11-24] Photos after a log (migration 012) ----
    async photoAllowed(nudgeId) {
      const n = need(await db.from("nudges").select("photo_upload_allowed").eq("id", nudgeId).single(), "Reading whether a behaviour allows photos");
      return n.photo_upload_allowed === true;
    },
    async photoConsent(parentId) {
      const rows = check(await db.from("consents").select("topic, answer, created_at").eq("parent_id", parentId).eq("topic", "photos"), "Reading the photo consent") ?? [];
      return currentConsent(rows.map((r) => ({ topic: r.topic, answer: r.answer, createdAt: r.created_at })), "photos");
    },
    async recordPhotoConsent(parentId, answer) {
      check(
        await db.from("consents").insert({ parent_id: parentId, topic: "photos", answer, wording_version: PHOTO_CONSENT_WORDING_VERSION }),
        "Recording the photo consent",
      );
    },
    // [2026-11-24, review] The newest not-undone log since "since", of a
    // behaviour that allows photos, that has no photo yet (D2). If every such
    // log has one, the newest is given with hasPhoto true (D5); none: null (D4).
    async photoLogSince(parentId, since) {
      const allowed = (check(await db.from("nudges").select("id").eq("photo_upload_allowed", true), "Reading which behaviours allow photos") ?? []).map((n) => Number(n.id));
      if (allowed.length === 0) return null;
      const logs = check(
        await db.from("habit_logs").select("id").eq("parent_id", parentId).is("undone_at", null).in("nudge_id", allowed)
          .gte("logged_at", since.toISOString()).order("logged_at", { ascending: false }).order("id", { ascending: false }).limit(20),
        "Finding the log for a photo",
      ) ?? [];
      if (logs.length === 0) return null;
      const ids = logs.map((l) => Number(l.id));
      const withPhoto = new Set((check(await db.from("photos").select("log_id").in("log_id", ids), "Checking for photos on the logs") ?? []).map((p) => Number(p.log_id)));
      const free = ids.find((id) => !withPhoto.has(id));
      return free !== undefined ? { logId: free, hasPhoto: false } : { logId: ids[0]!, hasPhoto: true };
    },
    async savePhotoFile(parentId, bytes) {
      const path = `${parentId}/${randomUUID()}.jpg`; // a random name: it says nothing about the photo
      // [2026-11-24, privacy review] cacheControl "0": a browser must not keep its
      // own copy once the short link expires (rule 9.6; Supabase's default is an hour).
      check(await db.storage.from(PHOTO_BUCKET).upload(path, bytes, { contentType: "image/jpeg", upsert: false, cacheControl: "0" }), "Saving the photo file");
      return path;
    },
    async removePhotoFile(path) {
      check(await db.storage.from(PHOTO_BUCKET).remove([path]), "Removing the photo file");
    },
    async addLogPhoto(parentId, logId, path) {
      const r = await db.rpc("add_log_photo", {
        p_parent: parentId, p_log: logId, p_path: path, p_check: "not_checked", p_version: await settingsVersion(), p_variants: variants,
      });
      // 23505: the log already has a photo (one per log, migration 005).
      if ((r.error as { code?: string } | null)?.code === "23505") return "has_photo";
      check(r, "Adding the photo to the log");
      return "saved";
    },
    async logForUndo(parentId, logId) {
      const logs = check(await db.from("habit_logs").select("logged_at").eq("id", logId).eq("parent_id", parentId).limit(1), "Reading the log to undo") ?? [];
      const log = logs[0];
      if (!log) return null;
      const photos = check(await db.from("photos").select("storage_path").eq("log_id", logId).limit(1), "Reading the log's photo") ?? [];
      return { loggedAt: new Date(String(log.logged_at)), photoPath: photos[0] ? String(photos[0].storage_path) : null };
    },

    // ---- [2026-11-24] "Add how you felt" (migration 013) ----
    async askForLine(parentId, logId) {
      const r = await db.rpc("ask_for_line", { p_parent: parentId, p_log: logId });
      if (r.error && /does not belong|undone/.test(r.error.message)) return "not_allowed";
      return check(r, "Asking for a line") === "has_line" ? "has_line" : "asked";
    },
    async addLogLine(parentId, text, updateId) {
      const r = check(
        await db.rpc("add_log_line", { p_parent: parentId, p_text: text, p_update: updateId, p_version: await settingsVersion(), p_variants: variants }),
        "Adding a line to a log",
      );
      if (r === "saved" || r === "duplicate" || r === "none") return r;
      throw new Error("Adding a line to a log gave an unexpected answer");
    },
    // The database decides the wait when saving; this only chooses which reply to give.
    async lineWaiting(parentId) {
      const since = new Date(Date.now() - LINE_WAIT_SECONDS * 1000).toISOString();
      const rows = check(
        await db.from("habit_logs").select("id").eq("parent_id", parentId).is("undone_at", null).is("description", null).gte("line_asked_at", since).limit(1),
        "Checking for a log waiting for a line",
      ) ?? [];
      return rows.length > 0;
    },

    // ---- [2026-11-24] Sunday: the Wrap Up, the 1 to 5 question, "Add a moment" (migration 014) ----
    async sundayData(day, onlyParentId) {
      const monday = mondayOf(day);
      const sunday = addDays(monday, 6);
      // [2026-11-24, privacy review] Only parents who aren't paused (a paused parent gets nothing),
      // and never the words of a "how you felt" line: only which logs have one.
      const everyone = onlyParentId === undefined
        ? whole(check(await db.from("parents").select("id, telegram_id, first_name, paused, wrap_up_minute, demo_of").eq("paused", false), "Reading parents"), "Reading parents")
        : whole(check(await db.from("parents").select("id, telegram_id, first_name, paused, wrap_up_minute, demo_of").eq("id", onlyParentId), "Reading the parent"), "Reading the parent");
      // [2026-11-24] Demo parents, and owners while their demo runs, are left out (rules 12.3, 12.7).
      const inDemo = onlyParentId === undefined ? await demoOwners(everyone) : new Set<number>();
      const parents = onlyParentId === undefined ? everyone.filter((p) => p.demo_of === null && !inDemo.has(Number(p.telegram_id))) : everyone;
      const ids = parents.map((p) => Number(p.id));
      if (ids.length === 0) return [];
      const consents = whole(check(await db.from("consents").select("parent_id, topic, answer, created_at").eq("topic", "recording").in("parent_id", ids), "Reading consents"), "Reading consents");
      const logs = whole(
        check(await db.from("habit_logs").select("id, parent_id, nudge_id, for_day").in("parent_id", ids).is("undone_at", null).gte("for_day", monday).lte("for_day", sunday), "Reading this week's logs"),
        "Reading this week's logs",
      );
      const withLine = new Set(
        whole(check(await db.from("habit_logs").select("id").in("parent_id", ids).is("undone_at", null).not("description", "is", null).gte("for_day", monday).lte("for_day", sunday), "Counting this week's lines"), "Counting this week's lines")
          .map((l) => Number(l.id)),
      );
      const sent = whole(
        check(await db.from("messages_sent").select("parent_id, kind, for_day").in("parent_id", ids).in("kind", ["wrap_up", "connection_question"]).gte("for_day", monday).lte("for_day", sunday), "Reading Sunday messages"),
        "Reading Sunday messages",
      );
      const logIds = logs.map((l) => Number(l.id));
      const logPhotos = logIds.length === 0 ? [] : whole(check(await db.from("photos").select("log_id").in("log_id", logIds), "Reading this week's photos"), "Reading this week's photos");
      const momentPhotos = whole(check(await db.from("photos").select("parent_id").in("parent_id", ids).eq("moment_week", monday), "Reading this week's moment photos"), "Reading this week's moment photos");
      const momentLines = whole(check(await db.from("moment_lines").select("parent_id").in("parent_id", ids).eq("week_starting", monday), "Reading this week's moment lines"), "Reading this week's moment lines");
      const reflections = whole(check(await db.from("reflections").select("parent_id").in("parent_id", ids).gte("for_day", monday).lte("for_day", sunday), "Reading this week's reflections"), "Reading this week's reflections");
      const byParent = <T extends { parent_id: unknown }>(rows: T[], id: number) => rows.filter((r) => Number(r.parent_id) === id);
      const photoLogs = new Set(logPhotos.map((p) => Number(p.log_id)));
      return parents.map((p) => {
        const id = Number(p.id);
        const mine = byParent(logs, id);
        const myConsents: ConsentRow[] = byParent(consents, id).map((c) => ({ topic: c.topic, answer: c.answer, createdAt: c.created_at }));
        return {
          parentId: id,
          telegramId: Number(p.telegram_id),
          firstName: String(p.first_name),
          paused: Boolean(p.paused),
          agreed: currentConsent(myConsents, "recording") === "agreed",
          wrapUpMinute: Number(p.wrap_up_minute),
          logs: mine.map((l) => ({ nudgeId: Number(l.nudge_id), date: String(l.for_day) })),
          messagesSent: byParent(sent, id).map((m) => ({ kind: m.kind === "wrap_up" ? ("weekly_wrap_up" as const) : ("connection_question" as const), date: String(m.for_day) })),
          feelings: mine.filter((l) => withLine.has(Number(l.id))).length + byParent(momentLines, id).length + byParent(reflections, id).length,
          photos: mine.filter((l) => photoLogs.has(Number(l.id))).length + byParent(momentPhotos, id).length,
        };
      });
    },
    async recordSundayMessage(a) {
      check(
        await db.rpc("record_message_sent", {
          p_parent: a.parentId, p_kind: a.kind, p_nudge: null, p_example: null, p_day: a.day, p_slot: null,
          p_version: await settingsVersion(), p_variants: variants, p_telegram_message: a.telegramMessageId,
        }),
        "Recording a Sunday message",
      );
    },
    async saveConnectionAnswer(parentId, week, score, updateId) {
      const r = await db.rpc("save_connection_answer", {
        p_parent: parentId, p_week: week, p_score: score, p_update: updateId, p_version: await settingsVersion(), p_variants: variants,
      });
      if (r.error && /has closed|No connection question/.test(r.error.message)) return "closed";
      // 23505: this Telegram message was already saved (a resent tap): the first answer stands.
      if ((r.error as { code?: string } | null)?.code === "23505") return "already";
      return check(r, "Saving the connection answer") === true ? "saved" : "already";
    },
    async claimExpiredQuestions() {
      const rows = check(await db.rpc("claim_expired_questions", { p_version: await settingsVersion(), p_variants: variants }), "Claiming expired questions") as
        { parent_id: number; telegram_id: number; telegram_message_id: number | null; week: string }[] | null;
      return (rows ?? []).map((r) => ({
        parentId: Number(r.parent_id), telegramId: Number(r.telegram_id),
        telegramMessageId: r.telegram_message_id === null ? null : Number(r.telegram_message_id), week: String(r.week),
      }));
    },
    async askForMoment(parentId) {
      const r = await db.rpc("ask_for_moment", { p_parent: parentId });
      if (r.error && /No Wrap Up/.test(r.error.message)) return null;
      return String(check(r, "Starting a moment"));
    },
    async momentState(parentId) {
      const latest = check(
        await db.from("messages_sent").select("for_day").eq("parent_id", parentId).eq("kind", "wrap_up").order("for_day", { ascending: false }).limit(1),
        "Reading the latest Wrap Up",
      ) ?? [];
      if (!latest[0]) return null;
      const week = mondayOf(String(latest[0].for_day));
      const p = need(await db.from("parents").select("moment_asked_at").eq("id", parentId).single(), "Reading the moment's window");
      const photo = check(await db.from("photos").select("id").eq("parent_id", parentId).eq("moment_week", week).limit(1), "Reading the moment's photo") ?? [];
      const line = check(await db.from("moment_lines").select("id").eq("parent_id", parentId).eq("week_starting", week).limit(1), "Reading the moment's line") ?? [];
      return { week, askedAt: p.moment_asked_at ? new Date(String(p.moment_asked_at)) : null, hasPhoto: photo.length > 0, hasLine: line.length > 0 };
    },
    async addMomentPhoto(parentId, week, path) {
      const r = await db.rpc("add_moment_photo", { p_parent: parentId, p_week: week, p_path: path, p_version: await settingsVersion(), p_variants: variants });
      if ((r.error as { code?: string } | null)?.code === "23505") return "has_photo"; // one moment photo a week (migration 005)
      check(r, "Saving the moment's photo");
      return "saved";
    },
    async saveMomentLine(parentId, week, text, updateId) {
      const r = await db.rpc("save_moment_line", { p_parent: parentId, p_week: week, p_text: text, p_update: updateId, p_version: await settingsVersion(), p_variants: variants });
      if ((r.error as { code?: string } | null)?.code === "23505") return "has_line"; // one moment line a week (migration 005)
      const id = check(r, "Saving the moment's line");
      return id === null ? "duplicate" : "saved";
    },

    // ---- [2026-11-24] The Demo module (migration 015) ----
    async demoActive(ownerTelegramId) {
      const parent = check(await db.from("parents").select("id").eq("telegram_id", -ownerTelegramId).limit(1), "Checking for a demo") ?? [];
      if (parent.length > 0) return true;
      const draft = check(await db.from("sign_up_drafts").select("id").eq("telegram_id", -ownerTelegramId).is("cut_down_at", null).limit(1), "Checking for a demo sign-up") ?? [];
      return draft.length > 0;
    },
    async startDemoSignUp(ownerTelegramId, firstName) {
      check(await db.rpc("start_demo_sign_up", { p_owner_telegram_id: ownerTelegramId, p_first_name: firstName }), "Starting a demo");
    },
    async demoPhotoPaths(ownerTelegramId) {
      const rows = check(await db.rpc("demo_photo_paths", { p_owner_telegram_id: ownerTelegramId }), "Listing the demo's photos") as (string | null)[] | null;
      return (rows ?? []).filter((x): x is string => typeof x === "string");
    },
    async deleteDemo(ownerTelegramId) {
      check(await db.rpc("delete_demo", { p_owner_telegram_id: ownerTelegramId }), "Deleting the demo");
    },

    // [2026-11-15] The database adds the 5-minute expiry from the settings version (migration 011).
    async createSignInLink(parentId, fingerprint) {
      check(
        await db.rpc("create_sign_in_link", { p_parent: parentId, p_link_fingerprint: fingerprint, p_version: await settingsVersion() }),
        "Making a sign-in link",
      );
    },
  };
}
