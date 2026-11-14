// =============================================================================
// tests/helpers/datastore-fake-store.ts: a pretend database for the bot's tests
//
// What it does: [2026-11-11] keeps parents, invites, consents, sent nudges,
// logs and events in plain lists, and follows the same rules as the real
// database functions (one sign-up per account, each invite once, one nudge per
// day and slot, a resent Telegram message saved once). [2026-11-12] It also
// keeps sign-up drafts, invite holds, children, picks, times and start-now
// messages, with migration 007's rules (codes matched ignoring capitals and
// end spaces, a held code is nobody else's, "I agree" all or nothing). It has the same "menu"
// as the real one (src/datastore/store.ts). Set failWrites to pretend the
// database is down, so tests can check the bot never pretends a failure worked
// (rule 1.3).
// [2026-11-13] Pull request 3c: it also answers the planner's questions
// (planningData), keeps example ideas, holidays and the people due their
// sign-up reminder; the thin-slice fixedNudge and nudgeCandidates are gone.
// [2026-11-14] B1: keyboard and /log logs, Undo by the database's own clock
// ("clock", the Undo window from src/settings.ts, as the real database reads
// it from the settings version), /resume, and migration 010's Telegram
// message numbers (on sent nudges and a draft's latest screen).
// =============================================================================

import type { Behaviour, Draft, DraftAnswers, ExampleIdea, PlanParent, StartNowMessage, StartSignUpResult, Store } from "../../src/datastore/store.js";
import { UNDO_WINDOW_SECONDS } from "../../src/settings.js";
// [2026-11-13] The planner's types, taken from the store's menu (so this helper
// stays a Datastore helper, rule S5).
type Holidays = Awaited<ReturnType<Store["planningData"]>>["holidays"];
type Frequency = PlanParent["targets"][number]["frequency"];

// [2026-11-12] The nine behaviours as first loaded (src/datastore/supabase/seed/nudges-first-load.csv).
const line = (rest: string) => `Start right now, and get on the scoreboard straight away by ${rest}`;
export const QUICK: Behaviour[] = [
  { id: 1, name: "Talking with children", category: "quick", startNowLine: line('talking with {child}. Ask, "What made you laugh today?" and listen to the full answer.') },
  { id: 2, name: "Showing affection", category: "quick", startNowLine: line("showing {child} some affection. Give {child} a hug!") },
  { id: 3, name: "Descriptive praise", category: "quick", startNowLine: line("praising {child}. Tell {child} one thing they did well today, and say exactly what they did.") },
  { id: 4, name: "Giving attention", category: "quick", startNowLine: line("giving {child} your full attention. Put down your phone and listen to {child} for one minute.") },
];
export const DELIBERATE: Behaviour[] = ["Spending quality time", "Interesting activities", "Setting a good example", "Incidental teaching", "Ask-say-do"].map(
  (name, i) => ({ id: 5 + i, name, category: "deliberate" as const, startNowLine: null }),
);

type Parent = { id: number; telegramId: number; firstName: string; paused: boolean };
type SentNudge = { id: number; parentId: number; nudgeId: number; exampleId: number; day: string; slotMinute: number; telegramMessageId: number | null };
// [2026-11-14] B1: messageId is empty for a log that answered no nudge; undoneAt is set by Undo.
type Log = {
  id: number;
  parentId: number;
  nudgeId: number;
  day: string;
  messageId: number | null;
  updateId: number;
  via: "done_button" | "start_now" | "keyboard" | "log_command";
  loggedAt?: Date; // older tests add logs by hand without these two
  undoneAt?: Date | null;
};

export class FakeStore implements Store {
  parents: Parent[] = [];
  invites = new Map<string, number | null>(); // code -> parent who used it, or null if unused
  // [2026-11-12] Sign-up (migration 007): code -> the Telegram account it is held for,
  // one draft per Telegram account, and the real records "I agree" creates.
  holds = new Map<string, number>();
  drafts = new Map<number, Draft>();
  private draftCode = new Map<number, string>(); // the code each draft holds
  children: { parentId: number; firstName: string }[] = [];
  picks: { parentId: number; nudgeId: number; frequency: string }[] = [];
  slots: { parentId: number; school: number[]; nonSchool: number[]; changedAt?: Date }[] = [];
  // [2026-11-13] Pull request 3c: example ideas per behaviour (each behaviour
  // gets one active idea unless a test sets its own), holidays, and the
  // people the database would say are due their sign-up reminder.
  examples = new Map<number, ExampleIdea[]>();
  holidays: { day: string; kind: "public_holiday" | "school_holiday" }[] = [];
  dueForReminder = new Set<number>();
  reminderClaims = 0; // how many times "who is due a reminder?" was asked
  failRecordNudge = false; // make only recording a sent nudge fail
  // Runs once, right after planningData answers: lets a test change the
  // database between the first look and the re-check before sending (rule 3.6).
  afterPlanningRead: (() => void) | null = null;
  startNow: { id: number; parentId: number; nudgeId: number; day: string }[] = [];
  cleanUps = 0; // how many times the sign-up clean-up ran
  failStartNow = false; // make only recording the start-now message fail
  failCleanUp = false; // make only the clean-up fail
  consents: { parentId: number; topic: string; answer: string }[] = [];
  sentNudges: SentNudge[] = [];
  logs: Log[] = [];
  // [2026-11-12] "day" is the Singapore day an event happened (used by notTodayOn).
  events: { parentId: number; type: string; updateId: number | null; day?: string }[] = [];
  // [2026-11-12] The pretend "today" in Singapore; the real database uses its own clock.
  today = "2026-11-11";
  // [2026-11-14] The pretend database's clock, for when a log was saved and Undo's 10 minutes.
  clock = new Date();
  // Set to true to make every write fail, like a database outage.
  failWrites = false;
  // [2026-11-12] Set failReads to pretend the database can't answer any question
  // ("who is this?", "which nudge?", "already logged?", "already said Not today?").
  failReads = false;
  // [2026-11-12] Or name just the questions that fail, e.g. failReadsOf.add("logExistsFor").
  failReadsOf = new Set<string>();
  // [2026-11-12] The words of a failed read, so a test can check what reaches the logs.
  readErrorText = "database unavailable (read)";
  private failReadIfAsked(question: string): void {
    if (this.failReads || this.failReadsOf.has(question)) throw new Error(this.readErrorText);
  }

  private nextId = 1;
  private failIfAsked(): void {
    if (this.failWrites) throw new Error("database unavailable");
  }

  async findParent(telegramId: number): Promise<{ id: number; paused: boolean; firstName: string } | null> {
    this.failReadIfAsked("findParent");
    const p = this.parents.find((x) => x.telegramId === telegramId);
    return p ? { id: p.id, paused: p.paused, firstName: p.firstName } : null;
  }
  // [2026-11-12] A test shortcut, not on the menu: a parent as "I agree" (or
  // thin slice 1) left them, without walking through sign-up.
  addParent(a: { telegramId: number; firstName: string; agreed: boolean; paused?: boolean }): number {
    const parent = { id: this.nextId++, telegramId: a.telegramId, firstName: a.firstName, paused: a.paused ?? false };
    this.parents.push(parent);
    if (a.agreed) this.consents.push({ parentId: parent.id, topic: "recording", answer: "agreed" });
    return parent.id;
  }

  async findDraft(telegramId: number): Promise<Draft | null> {
    this.failReadIfAsked("findDraft");
    const d = this.drafts.get(telegramId);
    return d ? { step: d.step, answers: structuredClone(d.answers), screenMessageId: d.screenMessageId } : null;
  }
  async startSignUp(a: { telegramId: number; firstName: string; code: string }): Promise<StartSignUpResult> {
    this.failIfAsked();
    if (this.parents.some((x) => x.telegramId === a.telegramId)) return { ok: false, reason: "already" };
    if (this.drafts.has(a.telegramId)) return { ok: true }; // carry on (Q10e, 10f)
    // Codes match ignoring capitals and spaces at the ends (Q10g).
    const code = [...this.invites.keys()].find((c) => c.trim().toUpperCase() === a.code.trim().toUpperCase());
    if (code === undefined || this.invites.get(code) !== null || this.holds.has(code)) return { ok: false, reason: "bad_code" };
    this.holds.set(code, a.telegramId);
    this.drafts.set(a.telegramId, { step: "name", answers: { first_name: a.firstName }, screenMessageId: null });
    this.draftCode.set(a.telegramId, code);
    return { ok: true };
  }
  async saveSignUpStep(telegramId: number, step: string, answers: DraftAnswers): Promise<void> {
    this.failIfAsked();
    const d = this.drafts.get(telegramId);
    if (!d) throw new Error("No sign-up in progress for this Telegram account.");
    // [2026-11-14] A new step means a new screen: the old screen's number is cleared (migration 010).
    this.drafts.set(telegramId, { step, answers: structuredClone(answers), screenMessageId: d.step === step ? d.screenMessageId : null });
  }
  failRecordScreen = false; // [2026-11-14] make only noting a screen number fail
  async recordSignUpScreen(telegramId: number, messageId: number): Promise<void> {
    this.failIfAsked();
    if (this.failRecordScreen) throw new Error("database unavailable (screen number)");
    const d = this.drafts.get(telegramId);
    if (!d) throw new Error("No sign-up in progress for this Telegram account.");
    d.screenMessageId = messageId;
  }
  async finishSignUp(a: { telegramId: number; updateId: number }): Promise<number> {
    this.failIfAsked();
    const d = this.drafts.get(a.telegramId);
    if (!d) throw new Error("No sign-up in progress for this Telegram account.");
    const { first_name, children = [], picks = [], slots } = d.answers;
    // The same checks as finish_sign_up (rules 2.1, 3.1, Q7b).
    if (!first_name || children.length < 1 || children.length > 3 || picks.length < 1 || !slots) throw new Error("This sign-up is not complete.");
    const id = this.addParent({ telegramId: a.telegramId, firstName: first_name, agreed: true });
    for (const name of children) this.children.push({ parentId: id, firstName: name });
    for (const p of picks) this.picks.push({ parentId: id, nudgeId: p.nudge_id, frequency: p.frequency });
    this.slots.push({ parentId: id, school: slots.school, nonSchool: slots.non_school });
    const code = this.draftCode.get(a.telegramId)!;
    this.invites.set(code, id);
    this.holds.delete(code);
    this.drafts.delete(a.telegramId);
    this.draftCode.delete(a.telegramId);
    this.events.push({ parentId: id, type: "signed_up", updateId: a.updateId });
    return id;
  }
  async behaviours(): Promise<Behaviour[]> {
    this.failReadIfAsked("behaviours");
    return [...QUICK, ...DELIBERATE];
  }
  async recordStartNowShown(a: { parentId: number; nudgeId: number; day: string }): Promise<number> {
    this.failIfAsked();
    if (this.failStartNow) throw new Error("database unavailable (start now)");
    if (this.startNow.some((m) => m.parentId === a.parentId)) throw new Error("one start-now message per parent");
    const m = { id: this.nextId++, ...a };
    this.startNow.push(m);
    this.events.push({ parentId: a.parentId, type: "start_now_shown", updateId: null });
    return m.id;
  }
  async findStartNow(parentId: number): Promise<StartNowMessage | null> {
    this.failReadIfAsked("findStartNow");
    const m = this.startNow.find((x) => x.parentId === parentId);
    if (!m) return null;
    const nudge = [...QUICK, ...DELIBERATE].find((b) => b.id === m.nudgeId)!;
    const answer = this.logs.some((l) => l.messageId === m.id && !l.undoneAt)
      ? "done"
      : this.events.some((e) => e.parentId === parentId && e.type === "start_now_not_now")
        ? "not_now"
        : null;
    return { messageId: m.id, nudgeId: m.nudgeId, nudgeName: nudge.name, day: m.day, answer };
  }
  async saveStartNowLog(a: { parentId: number; nudgeId: number; day: string; messageId: number; updateId: number }): Promise<"saved" | "duplicate"> {
    this.failIfAsked();
    if (this.logs.some((l) => l.updateId === a.updateId || l.messageId === a.messageId)) return "duplicate";
    this.logs.push({ id: this.nextId++, ...a, via: "start_now", loggedAt: this.clock, undoneAt: null });
    this.events.push({ parentId: a.parentId, type: "habit_logged", updateId: a.updateId }, { parentId: a.parentId, type: "start_now_done", updateId: null });
    return "saved";
  }
  async recordStartNowNotNow(parentId: number, updateId: number): Promise<void> {
    this.failIfAsked();
    if (this.events.some((e) => e.updateId === updateId)) return; // a resent tap is saved once
    this.events.push({ parentId, type: "start_now_not_now", updateId });
  }
  async cleanUpSignUps(): Promise<void> {
    if (this.failCleanUp) throw new Error("database unavailable (clean-up)");
    this.cleanUps++;
  }
  // [2026-11-13] The planner's view of one parent, from the lists above.
  private planParent(p: Parent): PlanParent {
    const all = [...QUICK, ...DELIBERATE];
    const slots = this.slots.find((x) => x.parentId === p.id);
    return {
      parentId: p.id,
      telegramId: p.telegramId,
      paused: p.paused,
      agreed: this.consents.some((c) => c.parentId === p.id && c.topic === "recording" && c.answer === "agreed"),
      targets: this.picks
        .filter((x) => x.parentId === p.id)
        .map((x) => ({ nudgeId: x.nudgeId, category: all.find((b) => b.id === x.nudgeId)!.category, frequency: x.frequency as Frequency })),
      schedules: { school: slots?.school ?? [], nonSchool: slots?.nonSchool ?? [] },
      slotsChangedAt: slots?.changedAt ?? null,
      logs: this.logs.filter((l) => l.parentId === p.id && !l.undoneAt).map((l) => ({ nudgeId: l.nudgeId, date: l.day })),
      messagesSent: this.sentNudges
        .filter((n) => n.parentId === p.id)
        .map((n) => ({ kind: "nudge" as const, date: n.day, slotStart: n.slotMinute, nudgeId: n.nudgeId })),
      notTodayDate: this.events.some((e) => e.parentId === p.id && e.type === "not_today" && e.day === this.today) ? this.today : null,
      children: this.children.filter((c) => c.parentId === p.id).map((c) => c.firstName),
      childMessagesBefore:
        this.sentNudges.filter((n) => n.parentId === p.id).length + this.startNow.filter((m) => m.parentId === p.id).length,
      examplesUsed: this.sentNudges.filter((n) => n.parentId === p.id).map((n) => ({ nudgeId: n.nudgeId, exampleId: n.exampleId })),
    };
  }
  private holidayLists(): Holidays {
    return {
      publicHolidays: this.holidays.filter((h) => h.kind === "public_holiday").map((h) => h.day),
      schoolHolidays: this.holidays.filter((h) => h.kind === "school_holiday").map((h) => h.day),
    };
  }
  async planningData(): Promise<{ holidays: Holidays; parents: PlanParent[] }> {
    this.failReadIfAsked("planningData");
    // [2026-11-13] As the real store: no children's names or full history here (planningDataFor has them).
    const answer = {
      holidays: this.holidayLists(),
      parents: this.parents.map((p) => ({ ...this.planParent(p), children: [], childMessagesBefore: 0, examplesUsed: [] })),
    };
    const after = this.afterPlanningRead;
    this.afterPlanningRead = null;
    after?.();
    return answer;
  }
  async planningDataFor(parentId: number): Promise<{ holidays: Holidays; parent: PlanParent | null }> {
    this.failReadIfAsked("planningDataFor");
    const p = this.parents.find((x) => x.id === parentId);
    return { holidays: this.holidayLists(), parent: p ? this.planParent(p) : null };
  }
  async nudgeExamples(nudgeId: number): Promise<ExampleIdea[]> {
    this.failReadIfAsked("nudgeExamples");
    return this.examples.get(nudgeId) ?? [{ id: nudgeId * 10 + 1, active: true, example: `Idea for behaviour ${nudgeId}.` }];
  }
  async claimSignUpReminders(): Promise<{ telegramId: number; step: string }[]> {
    this.failIfAsked();
    this.reminderClaims++;
    const due = [...this.dueForReminder].map((telegramId) => ({ telegramId, step: this.drafts.get(telegramId)?.step ?? "name" }));
    this.dueForReminder.clear(); // claimed: never returned again (migration 009)
    return due;
  }
  // [2026-11-14] Older tests record a nudge without Telegram's number (as before migration 010).
  async recordNudgeSent(a: { parentId: number; nudgeId: number; exampleId: number; day: string; slotMinute: number; telegramMessageId?: number | null }): Promise<void> {
    this.failIfAsked();
    if (this.failRecordNudge) throw new Error("database unavailable (record nudge)");
    if (this.sentNudges.some((n) => n.parentId === a.parentId && n.day === a.day && n.slotMinute === a.slotMinute)) {
      throw new Error("one nudge message per parent, day and slot");
    }
    this.sentNudges.push({ id: this.nextId++, ...a, telegramMessageId: a.telegramMessageId ?? null });
  }
  async findNudgeMessage(parentId: number, day: string, slotMinute: number): Promise<{ messageId: number; nudgeId: number; nudgeName: string } | null> {
    this.failReadIfAsked("findNudgeMessage");
    const n = this.sentNudges.find((x) => x.parentId === parentId && x.day === day && x.slotMinute === slotMinute);
    // [2026-11-13] The real behaviour's name (was always "Showing affection" in thin slice 1).
    return n ? { messageId: n.id, nudgeId: n.nudgeId, nudgeName: [...QUICK, ...DELIBERATE].find((b) => b.id === n.nudgeId)!.name } : null;
  }
  async logExistsFor(messageId: number): Promise<boolean> {
    this.failReadIfAsked("logExistsFor");
    return this.logs.some((l) => l.messageId === messageId && !l.undoneAt);
  }
  async saveDoneLog(a: { parentId: number; nudgeId: number; day: string; messageId: number; updateId: number }): Promise<"saved" | "duplicate"> {
    this.failIfAsked();
    if (this.logs.some((l) => l.updateId === a.updateId)) return "duplicate";
    this.logs.push({ id: this.nextId++, ...a, via: "done_button", loggedAt: this.clock, undoneAt: null });
    this.events.push({ parentId: a.parentId, type: "habit_logged", updateId: a.updateId });
    return "saved";
  }
  async recordNotToday(parentId: number, updateId: number): Promise<void> {
    this.failIfAsked();
    if (this.events.some((e) => e.updateId === updateId)) return; // a resent message is saved once
    this.events.push({ parentId, type: "not_today", updateId, day: this.today });
  }
  async notTodayOn(parentId: number, day: string): Promise<boolean> {
    this.failReadIfAsked("notTodayOn");
    return this.events.some((e) => e.parentId === parentId && e.type === "not_today" && e.day === day);
  }

  // ---- [2026-11-14] B1, log any time ----
  async chosenBehaviours(parentId: number): Promise<{ id: number; name: string }[]> {
    this.failReadIfAsked("chosenBehaviours");
    const all = [...QUICK, ...DELIBERATE];
    return this.picks.filter((p) => p.parentId === parentId).map((p) => ({ id: p.nudgeId, name: all.find((b) => b.id === p.nudgeId)!.name }));
  }
  async waitingNudge(parentId: number, day: string, nudgeId: number): Promise<{ messageId: number; telegramMessageId: number | null } | null> {
    this.failReadIfAsked("waitingNudge");
    if (await this.notTodayOn(parentId, day)) return null; // Not today answers every nudge of the day (rule 5.10)
    const n = this.sentNudges.find(
      (x) => x.parentId === parentId && x.day === day && x.nudgeId === nudgeId && !this.logs.some((l) => l.messageId === x.id && !l.undoneAt),
    );
    return n ? { messageId: n.id, telegramMessageId: n.telegramMessageId } : null;
  }
  async loggedToday(parentId: number, nudgeId: number, day: string): Promise<boolean> {
    this.failReadIfAsked("loggedToday");
    return this.logs.some((l) => l.parentId === parentId && l.nudgeId === nudgeId && l.day === day && !l.undoneAt);
  }
  async saveLog(a: { parentId: number; nudgeId: number; day: string; messageId: number | null; via: "keyboard" | "log_command"; updateId: number }): Promise<{ logId: number } | "duplicate"> {
    this.failIfAsked();
    // A resent Telegram message, or a second log from the same nudge, is saved once (rule 8.6, migration 007).
    if (this.logs.some((l) => l.updateId === a.updateId || (a.messageId !== null && l.messageId === a.messageId && !l.undoneAt))) return "duplicate";
    const id = this.nextId++;
    this.logs.push({ id, ...a, loggedAt: this.clock, undoneAt: null });
    this.events.push({ parentId: a.parentId, type: "habit_logged", updateId: a.updateId });
    return { logId: id };
  }
  async undoLog(parentId: number, logId: number): Promise<"undone" | "expired" | "not_allowed"> {
    this.failIfAsked();
    const l = this.logs.find((x) => x.id === logId);
    // The same refusals as undo_log (migration 005).
    if (!l || l.parentId !== parentId || l.via !== "keyboard" || !!l.undoneAt) return "not_allowed";
    if (this.clock.getTime() > (l.loggedAt ?? this.clock).getTime() + UNDO_WINDOW_SECONDS * 1000) return "expired";
    l.undoneAt = this.clock;
    this.events.push({ parentId, type: "log_undone", updateId: null });
    return "undone";
  }
  async resumeReminders(parentId: number): Promise<void> {
    this.failIfAsked();
    const p = this.parents.find((x) => x.id === parentId);
    if (!p) throw new Error(`No parent ${parentId}`);
    p.paused = false;
    this.events.push({ parentId, type: "settings_changed", updateId: null });
  }
}

