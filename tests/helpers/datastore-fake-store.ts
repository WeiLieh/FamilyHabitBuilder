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
// =============================================================================

import type { Behaviour, Draft, DraftAnswers, NudgeCandidate, StartNowMessage, StartSignUpResult, Store } from "../../src/datastore/store.js";

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
type SentNudge = { id: number; parentId: number; nudgeId: number; exampleId: number; day: string; slotMinute: number };
type Log = { id: number; parentId: number; nudgeId: number; day: string; messageId: number; updateId: number; via: "done_button" | "start_now" };

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
  slots: { parentId: number; school: number[]; nonSchool: number[] }[] = [];
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
    return d ? { step: d.step, answers: structuredClone(d.answers) } : null;
  }
  async startSignUp(a: { telegramId: number; firstName: string; code: string }): Promise<StartSignUpResult> {
    this.failIfAsked();
    if (this.parents.some((x) => x.telegramId === a.telegramId)) return { ok: false, reason: "already" };
    if (this.drafts.has(a.telegramId)) return { ok: true }; // carry on (Q10e, 10f)
    // Codes match ignoring capitals and spaces at the ends (Q10g).
    const code = [...this.invites.keys()].find((c) => c.trim().toUpperCase() === a.code.trim().toUpperCase());
    if (code === undefined || this.invites.get(code) !== null || this.holds.has(code)) return { ok: false, reason: "bad_code" };
    this.holds.set(code, a.telegramId);
    this.drafts.set(a.telegramId, { step: "name", answers: { first_name: a.firstName } });
    this.draftCode.set(a.telegramId, code);
    return { ok: true };
  }
  async saveSignUpStep(telegramId: number, step: string, answers: DraftAnswers): Promise<void> {
    this.failIfAsked();
    if (!this.drafts.has(telegramId)) throw new Error("No sign-up in progress for this Telegram account.");
    this.drafts.set(telegramId, { step, answers: structuredClone(answers) });
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
    const answer = this.logs.some((l) => l.messageId === m.id)
      ? "done"
      : this.events.some((e) => e.parentId === parentId && e.type === "start_now_not_now")
        ? "not_now"
        : null;
    return { messageId: m.id, nudgeId: m.nudgeId, nudgeName: nudge.name, day: m.day, answer };
  }
  async saveStartNowLog(a: { parentId: number; nudgeId: number; day: string; messageId: number; updateId: number }): Promise<"saved" | "duplicate"> {
    this.failIfAsked();
    if (this.logs.some((l) => l.updateId === a.updateId || l.messageId === a.messageId)) return "duplicate";
    this.logs.push({ id: this.nextId++, ...a, via: "start_now" });
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
  async fixedNudge(): Promise<{ nudgeId: number; name: string; exampleId: number; example: string }> {
    return { nudgeId: 2, name: "Showing affection", exampleId: 7, example: "Give a long hug before bed." };
  }
  async nudgeCandidates(day: string, slotMinute: number): Promise<NudgeCandidate[]> {
    return this.parents.map((p) => ({
      parentId: p.id,
      telegramId: p.telegramId,
      paused: p.paused,
      recordingConsent: this.consents.some((c) => c.parentId === p.id && c.topic === "recording" && c.answer === "agreed")
        ? "agreed"
        : "missing",
      alreadySent: this.sentNudges.some((n) => n.parentId === p.id && n.day === day && n.slotMinute === slotMinute),
    }));
  }
  async recordNudgeSent(a: { parentId: number; nudgeId: number; exampleId: number; day: string; slotMinute: number }): Promise<void> {
    this.failIfAsked();
    if (this.sentNudges.some((n) => n.parentId === a.parentId && n.day === a.day && n.slotMinute === a.slotMinute)) {
      throw new Error("one nudge message per parent, day and slot");
    }
    this.sentNudges.push({ id: this.nextId++, ...a });
  }
  async findNudgeMessage(parentId: number, day: string, slotMinute: number): Promise<{ messageId: number; nudgeId: number; nudgeName: string } | null> {
    this.failReadIfAsked("findNudgeMessage");
    const n = this.sentNudges.find((x) => x.parentId === parentId && x.day === day && x.slotMinute === slotMinute);
    return n ? { messageId: n.id, nudgeId: n.nudgeId, nudgeName: "Showing affection" } : null;
  }
  async logExistsFor(messageId: number): Promise<boolean> {
    this.failReadIfAsked("logExistsFor");
    return this.logs.some((l) => l.messageId === messageId);
  }
  async saveDoneLog(a: { parentId: number; nudgeId: number; day: string; messageId: number; updateId: number }): Promise<"saved" | "duplicate"> {
    this.failIfAsked();
    if (this.logs.some((l) => l.updateId === a.updateId)) return "duplicate";
    this.logs.push({ id: this.nextId++, ...a, via: "done_button" });
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
}

