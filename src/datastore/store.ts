// =============================================================================
// src/datastore/store.ts: what the bot may ask the database to do (thin slice 1)
//
// What it does: [2026-11-11] lists, in one place, every question or change the
// Telegram bot can ask of the Datastore, like a restaurant menu: the bot orders
// from the menu and never walks into the kitchen. The real kitchen is
// supabase-store.ts (Supabase); the tests use a pretend kitchen with the same
// menu (tests/helpers/datastore-fake-store.ts).
//
// Why: the bot's logic can then be tested without the real database, and the
// database rules (add-only, all-or-nothing functions) stay in the Datastore.
// =============================================================================

// The answer to a sign-up: the new parent, or why it was refused.
export type SignUpResult = { ok: true; parentId: number } | { ok: false; reason: "bad_code" | "already" };

// One parent as the daily nudge job sees them.
export type NudgeCandidate = {
  parentId: number;
  telegramId: number;
  paused: boolean;
  recordingConsent: "agreed" | "opted_out" | "missing"; // the latest answer counts (rule 11.13)
  alreadySent: boolean; // a nudge was already recorded for this day and slot
};

export interface Store {
  // Who is this Telegram account? Nothing if they haven't signed up.
  findParent(telegramId: number): Promise<{ id: number; paused: boolean } | null>;
  // Sign up with an invite, all or nothing (migration 006).
  signUp(a: { telegramId: number; firstName: string; code: string; updateId: number }): Promise<SignUpResult>;
  // The parent tapped "I agree" to the recording agreement (rule 11.9).
  recordAgreement(parentId: number): Promise<void>;
  // The one fixed nudge of thin slice 1, with one active example.
  fixedNudge(day: string): Promise<{ nudgeId: number; name: string; exampleId: number; example: string }>;
  // Everyone the daily job might nudge, with what it needs to decide.
  nudgeCandidates(day: string, slotMinute: number): Promise<NudgeCandidate[]>;
  // A nudge message was sent (one per parent, day and slot, rule 8.6).
  recordNudgeSent(a: { parentId: number; nudgeId: number; exampleId: number; day: string; slotMinute: number }): Promise<void>;
  // The nudge message this parent got on that day and slot, if any.
  findNudgeMessage(parentId: number, day: string, slotMinute: number): Promise<{ messageId: number; nudgeId: number; nudgeName: string } | null>;
  // Has a log already been saved from this nudge message?
  logExistsFor(messageId: number): Promise<boolean>;
  // Save a log from a Done tap; "duplicate" if this Telegram update was already saved.
  saveDoneLog(a: { parentId: number; nudgeId: number; day: string; messageId: number; updateId: number }): Promise<"saved" | "duplicate">;
  // The parent tapped "Not today" (rule 3.5).
  recordNotToday(parentId: number, updateId: number): Promise<void>;
  // [2026-11-12] Did this parent already tap "Not today" on this Singapore day?
  // Thin slice 1 has one nudge a day, so this tells us that nudge was answered (rule 5.10).
  notTodayOn(parentId: number, day: string): Promise<boolean>;
}
