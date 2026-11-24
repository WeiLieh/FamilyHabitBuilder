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

// [2026-11-13] Pull request 3c: the planner goes live. The thin-slice items
// "fixedNudge" and "nudgeCandidates" (the one 7:00 pm nudge for everyone) are
// removed (CLAUDE.md rule 12); "planningData" gives the planner each parent's
// choices and history instead, "nudgeExamples" the ideas to choose from, and
// "claimSignUpReminders" the people due their one sign-up reminder (Q11b).

// [2026-11-14] B1, log any time (src/telegram-bot/SPEC.md, "Build: B1"): the
// keyboard and /log save logs (saveLog), answering a waiting nudge
// (waitingNudge); Undo (undoLog, rule 5.8); /resume (resumeReminders); the
// Telegram message numbers of migration 010 (recordNudgeSent's
// telegramMessageId, a draft's screenMessageId and recordSignUpScreen).

// [2026-11-15] The Web app sign-in (rule 9.3): /mypage stores a new link's
// fingerprint (createSignInLink, migration 011).
// [2026-11-24] Photos after a log (owner, 24 Nov; migration 012): which
// behaviours allow photos, the first-photo consent, the log a photo joins, the
// private photo store (save and remove a file) and adding the photo to its log
// "not checked" (the photo check is parked).

import type { Target } from "../nudge-engine/choices.js";
import type { LogEntry, SentMessage } from "../nudge-engine/planner.js";
// [2026-11-24] Sunday's Wrap Up uses the same kinds of entries (SundayParent below).
import type { Holidays, Schedules } from "../nudge-engine/schedule.js";

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
// [2026-11-14] With Telegram's number for its latest screen with buttons, if
// one was noted (migration 010), so "Welcome back" can remove that copy's buttons.
export type Draft = { step: string; answers: DraftAnswers; screenMessageId: number | null };

// One behaviour (a nudge row) as sign-up shows it. Quick behaviours carry their
// fixed "Start right now" line, with {child} where the child's name goes.
export type Behaviour = { id: number; name: string; category: "quick" | "deliberate"; startNowLine: string | null };

// The "Start right now" message a parent got at sign-up (screen 10), and how it was answered.
export type StartNowMessage = { messageId: number; nudgeId: number; nudgeName: string; day: string; answer: "done" | "not_now" | null };

// [2026-11-13] One parent as the planner sees them (rules 3.1 to 3.17).
export type PlanParent = {
  parentId: number;
  telegramId: number;
  paused: boolean;
  agreed: boolean; // the latest recording-consent answer is "agreed" (rule 11.13)
  targets: Target[]; // current picks, in the order picked
  schedules: Schedules;
  slotsChangedAt: Date | null; // when the slots were last set
  logs: LogEntry[]; // recent logs that weren't undone
  messagesSent: SentMessage[]; // recent nudge messages
  notTodayDate: string | null; // today, if they tapped Not today today
  children: string[]; // in the order the names were typed
  childMessagesBefore: number; // earlier messages that named a child (rule 3.16)
  examplesUsed: { nudgeId: number; exampleId: number }[]; // every idea their nudges carried (rule 3.13)
};
// [2026-11-24] One parent as Sunday's Wrap Up sees them (rules 3.12, 5.6, 7.8):
// this week's logs (not undone) and Sunday messages, and the summary's counts.
export type SundayParent = {
  parentId: number;
  telegramId: number;
  firstName: string;
  paused: boolean;
  agreed: boolean;
  wrapUpMinute: number;
  logs: LogEntry[]; // this week's logs that weren't undone
  messagesSent: SentMessage[]; // this week's Wrap Up and connection question
  feelings: number; // "how you felt" lines, moment lines and reflections this week (D6)
  photos: number; // photos saved this week, on logs and moments (D6)
};
// [2026-11-24] The state of "Add a moment from this week" (rule 7.7).
export type MomentState = { week: string; askedAt: Date | null; hasPhoto: boolean; hasLine: boolean };

// [2026-11-13] One example idea of a behaviour (rule 3.13).
export type ExampleIdea = { id: number; active: boolean; example: string };

export interface Store {
  // Who is this Telegram account? Nothing if they haven't signed up.
  // [2026-11-12] With their first name, for screen 11 ("You're all set, John.").
  findParent(telegramId: number): Promise<{ id: number; paused: boolean; firstName: string } | null>;
  // [2026-11-12] This person's active sign-up draft, if any (a cut-down one doesn't count).
  findDraft(telegramId: number): Promise<Draft | null>;
  // /start with a code: hold the code and start a draft, or carry on an active one (Q10a, 10e, 10f).
  startSignUp(a: { telegramId: number; firstName: string; code: string }): Promise<StartSignUpResult>;
  // Save the answers so far and the step reached (rule 8.13).
  // [2026-11-14] A new step clears the noted screen number (migration 010).
  saveSignUpStep(telegramId: number, step: string, answers: DraftAnswers): Promise<void>;
  // [2026-11-14] Note Telegram's number for the latest sign-up screen with buttons (B1-D10).
  recordSignUpScreen(telegramId: number, messageId: number): Promise<void>;
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
  // The sign-up clean-up: cut down drafts quiet for 7 days, delete after 90 (Q11).
  cleanUpSignUps(): Promise<void>;
  // [2026-11-13] Everyone the planner may nudge, with their choices and their
  // last 14 days, and the holidays; "day" is today in Singapore. To read as
  // little as possible (privacy review), it leaves out children's names and the
  // full history (children, childMessagesBefore and examplesUsed come back empty):
  // planningDataFor gives those, for the one parent about to get a nudge.
  planningData(day: string): Promise<{ holidays: Holidays; parents: PlanParent[] }>;
  // [2026-11-13] The same for one parent (the re-check before sending, rule 3.6;
  // and "your next reminder is …", rule 3.17). Null if they are not a parent.
  planningDataFor(parentId: number, day: string): Promise<{ holidays: Holidays; parent: PlanParent | null }>;
  // [2026-11-13] A behaviour's example ideas, active or not (rule 3.13).
  nudgeExamples(nudgeId: number): Promise<ExampleIdea[]>;
  // [2026-11-13] Mark and return, in one step, who is due their one sign-up
  // reminder (Q11b; migration 009). Telegram IDs only, never names.
  claimSignUpReminders(): Promise<{ telegramId: number; step: string }[]>;
  // A nudge message was sent (one per parent, day and slot, rule 8.6).
  // [2026-11-14] With Telegram's number for the message (migration 010, B1-D7).
  recordNudgeSent(a: { parentId: number; nudgeId: number; exampleId: number; day: string; slotMinute: number; telegramMessageId: number }): Promise<void>;
  // The nudge message this parent got on that day and slot, if any.
  findNudgeMessage(parentId: number, day: string, slotMinute: number): Promise<{ messageId: number; nudgeId: number; nudgeName: string } | null>;
  // Has a log already been saved from this nudge message?
  logExistsFor(messageId: number): Promise<boolean>;
  // Save a log from a Done tap; "duplicate" if this Telegram update was already saved.
  // [2026-11-24] Returns the new log's number, for its "Add how you felt" button.
  saveDoneLog(a: { parentId: number; nudgeId: number; day: string; messageId: number; updateId: number }): Promise<{ logId: number } | "duplicate">;
  // The parent tapped "Not today" (rule 3.5).
  recordNotToday(parentId: number, updateId: number): Promise<void>;
  // [2026-11-12] Did this parent already tap "Not today" on this Singapore day?
  // Not today stops the whole day (rule 3.5), so it answers every nudge of that day (rule 5.10).
  notTodayOn(parentId: number, day: string): Promise<boolean>;

  // ---- [2026-11-14] B1, log any time ----
  // The behaviours this parent has chosen now, in the order picked (the keyboard and /log).
  chosenBehaviours(parentId: number): Promise<{ id: number; name: string }[]>;
  // Today's nudge for this behaviour, if it is still waiting for an answer (no
  // log from it, no Not today today): the keyboard or /log then answers it
  // (rule 5.10). telegramMessageId is empty for nudges sent before migration 010.
  waitingNudge(parentId: number, day: string, nudgeId: number): Promise<{ messageId: number; telegramMessageId: number | null } | null>;
  // Has this behaviour already been logged today (not undone)? For "again today" (K4).
  loggedToday(parentId: number, nudgeId: number, day: string): Promise<boolean>;
  // Save a log from the keyboard or /log, linked to the nudge it answers (if
  // any). Returns the new log's number, or "duplicate" if already saved.
  saveLog(a: { parentId: number; nudgeId: number; day: string; messageId: number | null; via: "keyboard" | "log_command"; updateId: number }): Promise<{ logId: number } | "duplicate">;
  // Undo a keyboard log (rule 5.8). The database decides, by its own clock and
  // the Undo window: "undone", "expired", or "not_allowed" (another parent's
  // log, not a keyboard log, or already undone). Other failures are thrown.
  undoLog(parentId: number, logId: number): Promise<"undone" | "expired" | "not_allowed">;
  // /resume: turn this parent's reminders back on (rule 8.4 edit 1, with an event).
  resumeReminders(parentId: number): Promise<void>;
  // [2026-11-15] /mypage: keep a new sign-in link's fingerprint (never the link
  // itself) for this parent; it works once, for 5 minutes (rule 9.3, migration 011).
  createSignInLink(parentId: number, fingerprint: string): Promise<void>;

  // ---- [2026-11-24] Photos after a log (owner-approved tests PH1 to PH10) ----
  // Does this behaviour allow photos (the nudge repository's "photo upload allowed", rule 4.3)?
  photoAllowed(nudgeId: number): Promise<boolean>;
  // This parent's latest photo-consent answer, or "missing" if never asked (rule 5.5).
  photoConsent(parentId: number): Promise<"agreed" | "opted_out" | "missing">;
  // Record a photo-consent answer (add-only: a new row each time, rule 8.4).
  recordPhotoConsent(parentId: number, answer: "agreed" | "opted_out"): Promise<void>;
  // The log a photo sent now would join (D2): this parent's latest log since
  // "since", of a behaviour that allows photos, not undone; with whether it has a photo already.
  photoLogSince(parentId: number, since: Date): Promise<{ logId: number; hasPhoto: boolean } | null>;
  // Put a photo file in the private store, in this parent's folder. Returns its name there.
  savePhotoFile(parentId: number, bytes: Uint8Array): Promise<string>;
  // Remove a photo file from the private store (before its record, rule 8.5).
  removePhotoFile(path: string): Promise<void>;
  // Add the saved file to its log, "not checked" (migration 012). "has_photo" if the log got one meanwhile.
  addLogPhoto(parentId: number, logId: number, path: string): Promise<"saved" | "has_photo">;
  // For Undo (PH9): when this parent's log was saved, and its photo file, if any. Null if not theirs.
  logForUndo(parentId: number, logId: number): Promise<{ loggedAt: Date; photoPath: string | null } | null>;

  // ---- [2026-11-24] "Add how you felt" (rule 5.3; migration 013; tests F1 to F9) ----
  // The tap: note it on this parent's log. "has_line" if it has one; "not_allowed" if undone or not theirs.
  askForLine(parentId: number, logId: number): Promise<"asked" | "has_line" | "not_allowed">;
  // A typed line: saved on the log that asked within the wait; "none" if no log waits; "duplicate" if this message was saved already.
  addLogLine(parentId: number, text: string, updateId: number): Promise<"saved" | "duplicate" | "none">;
  // Is a log of this parent waiting for a line right now (for "please shorten it")?
  lineWaiting(parentId: number): Promise<boolean>;

  // ---- [2026-11-24] The Sunday Wrap Up, the 1 to 5 question and "Add a moment" (tests W1 to W12; migration 014) ----
  // Every parent who isn't paused, with what Sunday's messages need (counts, never
  // the words); "day" is today in Singapore. Asked only on Sundays (privacy review).
  // [2026-11-24] Demo parents, and owners while their demo runs, are left out (rules
  // 12.3, 12.7); onlyParentId asks for one parent (a demo's Wrap Up), whoever it is.
  sundayData(day: string, onlyParentId?: number): Promise<SundayParent[]>;
  // A Wrap Up summary or connection question was sent (with Telegram's number for it).
  recordSundayMessage(a: { parentId: number; kind: "wrap_up" | "connection_question"; day: string; telegramMessageId: number }): Promise<void>;
  // A 1 to 5 tap: "saved"; "already" if this week was answered (the first counts); "closed" after 24 hours or with no question.
  saveConnectionAnswer(parentId: number, week: string, score: number, updateId: number): Promise<"saved" | "already" | "closed">;
  // The questions past their 24 hours, unanswered: claimed once each, to edit to "Question expired".
  claimExpiredQuestions(): Promise<{ parentId: number; telegramId: number; telegramMessageId: number | null; week: string }[]>;
  // The tap on "Add a moment": starts the 24-hour window. The week it is for, or null with no Wrap Up yet.
  askForMoment(parentId: number): Promise<string | null>;
  // The moment of the parent's latest Wrap Up week: when the button was tapped, and what is saved. Null with no Wrap Up yet.
  momentState(parentId: number): Promise<MomentState | null>;
  // Save the moment's photo (never checked) or its line. "has_photo"/"has_line" if one is there already.
  addMomentPhoto(parentId: number, week: string, path: string): Promise<"saved" | "has_photo">;
  saveMomentLine(parentId: number, week: string, text: string, updateId: number): Promise<"saved" | "duplicate" | "has_line">;

  // ---- [2026-11-24] The Demo module (rules 12.1 to 12.7; migration 015; tests DM1 to DM13) ----
  // A demo parent has no Telegram account of its own: it is known by the owner's number, made negative.
  // Is a demo running for this owner (a demo parent, or a demo sign-up in progress)?
  demoActive(ownerTelegramId: number): Promise<boolean>;
  // Start a fresh demo: remove any earlier one's rows and start the real sign-up with no invite (rule 12.2).
  startDemoSignUp(ownerTelegramId: number, firstName: string): Promise<void>;
  // The demo parent's photo files, to remove before its rows (rule 8.5).
  demoPhotoPaths(ownerTelegramId: number): Promise<string[]>;
  // Delete the demo parent with all its rows, and any demo sign-up (rule 12.7).
  deleteDemo(ownerTelegramId: number): Promise<void>;
}
