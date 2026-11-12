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

// [2026-11-12] Pull request 2: sign-up now goes through a sign-up draft
// (migration 007, rule 8.13). The thin-slice "signUp" and "recordAgreement"
// items are removed (CLAUDE.md rule 12): "I agree" is now part of finishSignUp.

// The answer to starting a sign-up at /start: started (or carried on), or why it was refused.
export type StartSignUpResult = { ok: true } | { ok: false; reason: "bad_code" | "already" };

// What a sign-up draft holds (the only four parts migration 007 allows).
export type DraftAnswers = {
  first_name?: string;
  children?: string[];
  picks?: { nudge_id: number; frequency: string }[]; // in the order they were picked
  slots?: { school: number[]; non_school: number[] }; // minutes after midnight, Singapore time
};
// A sign-up in progress: the last step reached, and the answers so far.
export type Draft = { step: string; answers: DraftAnswers };

// One behaviour (a nudge row) as sign-up shows it. Quick behaviours carry their
// fixed "Start right now" line, with {child} where the child's name goes.
export type Behaviour = { id: number; name: string; category: "quick" | "deliberate"; startNowLine: string | null };

// The "Start right now" message a parent got at sign-up (screen 10), and how it was answered.
export type StartNowMessage = { messageId: number; nudgeId: number; nudgeName: string; day: string; answer: "done" | "not_now" | null };

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
  // [2026-11-12] With their first name, for screen 11 ("You're all set, John.").
  findParent(telegramId: number): Promise<{ id: number; paused: boolean; firstName: string } | null>;
  // [2026-11-12] This person's active sign-up draft, if any (a cut-down one doesn't count).
  findDraft(telegramId: number): Promise<Draft | null>;
  // /start with a code: hold the code and start a draft, or carry on an active one (Q10a, 10e, 10f).
  startSignUp(a: { telegramId: number; firstName: string; code: string }): Promise<StartSignUpResult>;
  // Save the answers so far and the step reached (rule 8.13).
  saveSignUpStep(telegramId: number, step: string, answers: DraftAnswers): Promise<void>;
  // "I agree": the draft becomes the parent, children, picks, times, agreement
  // and used invite, all or nothing (rule 11.9). Returns the new parent's number.
  finishSignUp(a: { telegramId: number; updateId: number }): Promise<number>;
  // The behaviours a parent can pick at sign-up, in their usual order.
  behaviours(): Promise<Behaviour[]>;
  // Screen 10 was sent: record it as its own kind of message (not a nudge, Q3).
  recordStartNowShown(a: { parentId: number; nudgeId: number; day: string }): Promise<number>;
  // This parent's start-now message, if they got one.
  findStartNow(parentId: number): Promise<StartNowMessage | null>;
  // "I've started!": today's log, logged via "start now"; "duplicate" if already saved.
  saveStartNowLog(a: { parentId: number; nudgeId: number; day: string; messageId: number; updateId: number }): Promise<"saved" | "duplicate">;
  // "Not now" on screen 10.
  recordStartNowNotNow(parentId: number, updateId: number): Promise<void>;
  // The daily sign-up clean-up: cut down drafts quiet for 7 days, delete after 90 (Q11).
  cleanUpSignUps(): Promise<void>;
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
