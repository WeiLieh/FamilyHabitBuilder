// =============================================================================
// tests/helpers/datastore-fake-store.ts: a pretend database for the bot's tests
//
// What it does: [2026-11-11] keeps parents, invites, consents, sent nudges,
// logs and events in plain lists, and follows the same rules as the real
// database functions (one sign-up per account, each invite once, one nudge per
// day and slot, a resent Telegram message saved once). It has the same "menu"
// as the real one (src/datastore/store.ts). Set failWrites to pretend the
// database is down, so tests can check the bot never pretends a failure worked
// (rule 1.3).
// =============================================================================

import type { NudgeCandidate, SignUpResult, Store } from "../../src/datastore/store.js";

type Parent = { id: number; telegramId: number; firstName: string; paused: boolean };
type SentNudge = { id: number; parentId: number; nudgeId: number; exampleId: number; day: string; slotMinute: number };
type Log = { id: number; parentId: number; nudgeId: number; day: string; messageId: number; updateId: number };

export class FakeStore implements Store {
  parents: Parent[] = [];
  invites = new Map<string, number | null>(); // code -> parent who used it, or null if unused
  consents: { parentId: number; topic: string; answer: string }[] = [];
  sentNudges: SentNudge[] = [];
  logs: Log[] = [];
  events: { parentId: number; type: string; updateId: number | null }[] = [];
  // Set to true to make every write fail, like a database outage.
  failWrites = false;

  private nextId = 1;
  private failIfAsked(): void {
    if (this.failWrites) throw new Error("database unavailable");
  }

  async findParent(telegramId: number): Promise<{ id: number; paused: boolean } | null> {
    const p = this.parents.find((x) => x.telegramId === telegramId);
    return p ? { id: p.id, paused: p.paused } : null;
  }
  async signUp(a: { telegramId: number; firstName: string; code: string; updateId: number }): Promise<SignUpResult> {
    this.failIfAsked();
    if (this.parents.some((x) => x.telegramId === a.telegramId)) return { ok: false, reason: "already" };
    if (this.invites.get(a.code) !== null) return { ok: false, reason: "bad_code" }; // unknown (undefined) or used
    const parent = { id: this.nextId++, telegramId: a.telegramId, firstName: a.firstName, paused: false };
    this.parents.push(parent);
    this.invites.set(a.code, parent.id);
    this.events.push({ parentId: parent.id, type: "signed_up", updateId: a.updateId });
    return { ok: true, parentId: parent.id };
  }
  async recordAgreement(parentId: number): Promise<void> {
    this.failIfAsked();
    this.consents.push({ parentId, topic: "recording", answer: "agreed" });
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
    const n = this.sentNudges.find((x) => x.parentId === parentId && x.day === day && x.slotMinute === slotMinute);
    return n ? { messageId: n.id, nudgeId: n.nudgeId, nudgeName: "Showing affection" } : null;
  }
  async logExistsFor(messageId: number): Promise<boolean> {
    return this.logs.some((l) => l.messageId === messageId);
  }
  async saveDoneLog(a: { parentId: number; nudgeId: number; day: string; messageId: number; updateId: number }): Promise<"saved" | "duplicate"> {
    this.failIfAsked();
    if (this.logs.some((l) => l.updateId === a.updateId)) return "duplicate";
    this.logs.push({ id: this.nextId++, ...a });
    this.events.push({ parentId: a.parentId, type: "habit_logged", updateId: a.updateId });
    return "saved";
  }
  async recordNotToday(parentId: number, updateId: number): Promise<void> {
    this.failIfAsked();
    if (this.events.some((e) => e.updateId === updateId)) return; // a resent message is saved once
    this.events.push({ parentId, type: "not_today", updateId });
  }
}

