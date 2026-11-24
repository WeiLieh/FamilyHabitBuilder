// =============================================================================
// src/telegram-bot/sunday.ts: the Sunday Wrap Up, the 1 to 5 question and "Add a moment"
//
// What it does: [2026-11-24] owner-approved tests W1 to W12 (24 Nov; the
// designs of 9 to 11 Nov: rules 3.12, 3.15, 5.6, 7.7, 7.8), with defaults D6
// to D8:
//   - The alarm run (scheduler.ts) calls sendSundayMessages after the nudges,
//     so a nudge due in the same run goes first (rule 3.15). On Sunday, from
//     the parent's Wrap Up time until midnight, once a week, not paused:
//       1. with activity that week, the summary "Your week, <name>" (days
//          logged, feelings, photos; D6) with "Add a moment from this week"
//          and "View wrap up";
//       2. then the connection question, its own message, buttons 1 to 5.
//     Each is sent first and recorded after (a refused send is a failure,
//     never "sent"). A question sent but not recorded can't save its answers,
//     so it is edited into an honest note.
//   - closeExpiredQuestions: after 24 hours, an unanswered question is
//     edited once to "Question expired" (D7; the database claims each once).
//   - A 1 to 5 tap saves the first answer for that week; the message then
//     shows "Answered: 4, quite connected" (or "Answered (week of …)" after
//     midnight Sunday). Later taps are ignored; after 24 hours: "This
//     question has closed."
//   - "Add a moment" opens a 24-hour window (D8: the app checks the window;
//     the database checks the week). One photo and one line, never checked:
//     "✅ Saved as this week's moment." After 24 hours, a photo or line isn't
//     saved: "Moment has expired…" with the button again.
//   - "View wrap up" sends a fresh My page link, the same as /mypage.
// Every number in the summary comes from real data (rule 1.3).
// =============================================================================

import type { MomentState, SundayParent } from "../datastore/store.js";
import { planConnectionQuestion, planWeeklyWrapUp } from "../nudge-engine/wrap-up.js";
import { LINE_MAX_CHARS, MOMENT_WINDOW_HOURS, WEEKLY_WRAP_UP_WEEKDAY } from "../settings.js";
import { mondayOf, sgtInstant, toSgt, weekdayOf } from "../sgt.js";
import type { BotDeps } from "./handle-update.js";
import { logFailure } from "./log-failure.js";
import { runMenuCommand } from "./menu.js";
import type { Button } from "./telegram-api.js";
import type { Incoming } from "./updates.js";
import { WORDS } from "./words.js";

type Parent = { id: number; paused: boolean };
type Tap = Extract<Incoming, { kind: "tap" }>;
type Counts = { failed: number };

const quietly = (what: string, work: () => Promise<unknown>) => work().catch((error) => logFailure(what, error));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "2026-11-23" -> "Mon 23 Nov" (a week's Monday).
const mondayLabel = (monday: string) => `Mon ${Number(monday.slice(8, 10))} ${MONTHS[Number(monday.slice(5, 7)) - 1]}`;

export const momentButton = (): Button => ({ text: WORDS.addMomentButton, data: "moment:ask" });
const questionText = () => `${WORDS.connectionQuestionTitle}\n\n${WORDS.questionExpiresLine}`;
const questionButtons = (week: string): Button[] => [1, 2, 3, 4, 5].map((n) => ({ text: String(n), data: `conn:${week}:${n}` }));

// ---- The alarm run's Sunday jobs -------------------------------------------------
export async function sendSundayMessages(deps: BotDeps, result: Counts): Promise<void> {
  const { store, now } = deps;
  const day = toSgt(now).date;
  // [2026-11-24, privacy review] Only on Sunday: the other six days read nothing.
  if (weekdayOf(day) !== WEEKLY_WRAP_UP_WEEKDAY) return;
  let parents: SundayParent[];
  try {
    parents = await store.sundayData(day);
  } catch (error) {
    logFailure("Reading Sunday's data failed", error);
    result.failed++;
    return;
  }
  for (const p of parents) {
    if (!p.agreed) continue; // only parents who agreed to recording (rule 11.9)
    const input = { now, wrapUp: { minutes: p.wrapUpMinute }, paused: p.paused, logs: p.logs, messagesSent: p.messagesSent };
    if (planWeeklyWrapUp(input).send) await sendSummary(p, day, deps, result);
    if (planConnectionQuestion(input).send) await sendQuestion(p, day, deps, result);
  }
}

export async function sendSummary(p: SundayParent, day: string, { store, telegram }: BotDeps, result: Counts): Promise<void> {
  const days = new Set(p.logs.map((l) => l.date)).size; // Habits logged = days logged this week so far (rule 7.8)
  let messageId: number;
  try {
    messageId = await telegram.sendMessage(p.telegramId, WORDS.wrapUpSummary(p.firstName, days, p.feelings, p.photos), [
      [momentButton()],
      [{ text: WORDS.viewWrapUpButton, data: "wrapup:view" }],
    ]);
  } catch (error) {
    logFailure(`Wrap Up not sent to parent ${p.parentId}`, error);
    result.failed++;
    return;
  }
  try {
    await store.recordSundayMessage({ parentId: p.parentId, kind: "wrap_up", day, telegramMessageId: messageId });
  } catch (error) {
    // [2026-11-24, privacy review] Its buttons can't work (no Wrap Up is recorded): say so, as for the question.
    logFailure(`Wrap Up sent but not recorded for parent ${p.parentId}`, error);
    result.failed++;
    await quietly(`Editing the unsaved Wrap Up for parent ${p.parentId} failed`, () => telegram.editMessage(p.telegramId, messageId, WORDS.wrapUpNotSaved));
  }
}

export async function sendQuestion(p: SundayParent, day: string, { store, telegram }: BotDeps, result: Counts): Promise<void> {
  let messageId: number;
  try {
    messageId = await telegram.sendMessage(p.telegramId, questionText(), [questionButtons(mondayOf(day))]);
  } catch (error) {
    logFailure(`Connection question not sent to parent ${p.parentId}`, error);
    result.failed++;
    return;
  }
  try {
    await store.recordSundayMessage({ parentId: p.parentId, kind: "connection_question", day, telegramMessageId: messageId });
  } catch (error) {
    // Sent but not recorded: its buttons could never save, so say so (rule 1.3).
    logFailure(`Connection question sent but not recorded for parent ${p.parentId}`, error);
    result.failed++;
    await quietly(`Editing the unsaved question for parent ${p.parentId} failed`, () => telegram.editMessage(p.telegramId, messageId, WORDS.questionNotSaved));
  }
}

// After 24 hours: each unanswered question is edited once (D7). A failed edit is a failure.
export async function closeExpiredQuestions({ store, telegram }: BotDeps, result: Counts): Promise<void> {
  let expired: Awaited<ReturnType<BotDeps["store"]["claimExpiredQuestions"]>>;
  try {
    expired = await store.claimExpiredQuestions();
  } catch (error) {
    logFailure("Claiming expired questions failed", error);
    result.failed++;
    return;
  }
  for (const q of expired) {
    if (q.telegramMessageId === null) continue; // no number to edit (never the case for questions sent by this build)
    try {
      await telegram.editMessage(q.telegramId, q.telegramMessageId, `${WORDS.connectionQuestionTitle}\n\n${WORDS.questionExpired}`);
    } catch (error) {
      logFailure(`Marking the question expired failed for parent ${q.parentId}`, error);
      result.failed++;
    }
  }
}

// ---- The taps -------------------------------------------------------------------
// A 1 to 5 tap: "conn:<the week's Monday>:<score>" (W5, W6).
export async function connectionTap(t: Tap, parent: Parent, week: string, score: number, { store, telegram, now }: BotDeps): Promise<void> {
  let saved: "saved" | "already" | "closed";
  try {
    saved = await store.saveConnectionAnswer(parent.id, week, score, t.updateId);
  } catch (error) {
    logFailure("Saving the connection answer failed", error);
    await quietly("Sending 'didn't save' failed", () => telegram.sendMessage(t.chatId, WORDS.didNotSave));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  if (saved === "closed") return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId, WORDS.questionClosed)));
  if (saved === "already") return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId))); // the first answer counts
  const answer = mondayOf(toSgt(now).date) === week ? WORDS.answered(score, WORDS.connectionLabels[score - 1]!) : WORDS.answeredWeek(mondayLabel(week));
  await quietly("Answer saved, but editing the question failed", () => telegram.editMessage(t.chatId, t.messageId, `${WORDS.connectionQuestionTitle}\n\n${answer}`));
  await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
}

// "Add a moment from this week" (W8, W10): starts a fresh 24-hour window.
export async function momentAskTap(t: Tap, parent: Parent, { store, telegram }: BotDeps): Promise<void> {
  let week: string | null;
  try {
    week = await store.askForMoment(parent.id);
  } catch (error) {
    logFailure("Starting a moment failed", error);
    await quietly("Sending 'didn't work' failed", () => telegram.sendMessage(t.chatId, WORDS.signUpFailed));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  if (week === null) return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId, WORDS.noWrapUpYet)));
  await quietly("Sending the moment prompt failed", () => telegram.sendMessage(t.chatId, WORDS.momentPrompt));
  await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
}

// "View wrap up" (W11): a fresh My page link, the same as /mypage.
export async function viewWrapUpTap(t: Tap, parent: Parent, deps: BotDeps): Promise<void> {
  await runMenuCommand("mypage", t.chatId, parent, deps);
  await quietly("Answering the tap failed", () => deps.telegram.answerTap(t.tapId));
}

// ---- The moment's window --------------------------------------------------------
// "open": tapped within 24 hours, for the latest Wrap Up's week, not complete.
// "expired": tapped for that week, more than 24 hours ago, not complete.
export type MomentWindow = { kind: "open" | "expired"; state: MomentState } | null;
export async function momentWindow(parentId: number, { store, now }: BotDeps): Promise<MomentWindow> {
  const state = await store.momentState(parentId);
  if (!state || state.askedAt === null || (state.hasPhoto && state.hasLine)) return null;
  // A tap before that Wrap Up's week began belongs to an earlier Wrap Up: not this moment's.
  // [2026-11-24] (Demo, rule 12.6: a demo's Wrap Up can come on any day, so the week's start, not its Sunday.)
  if (state.askedAt.getTime() < sgtInstant(state.week, 0).getTime()) return null;
  const open = now.getTime() - state.askedAt.getTime() <= MOMENT_WINDOW_HOURS * 3600 * 1000;
  return { kind: open ? "open" : "expired", state };
}

// Say the moment has expired, with the button to start again (W10).
export const sayMomentExpired = (chatId: number, { telegram }: BotDeps) =>
  quietly("Sending 'moment expired' failed", () => telegram.sendMessage(chatId, WORDS.momentExpired, [[momentButton()]]));

// A typed line while the moment waits (W8). Returns true if handled here.
// Commands never reach here (handle-update.ts checks them first); a forwarded
// message is never a moment (W9).
export async function typedMomentLine(chatId: number, parent: Parent, text: string, updateId: number, deps: BotDeps): Promise<boolean> {
  const { store, telegram } = deps;
  if (text.trimStart().startsWith("/")) return false;
  try {
    const window = await momentWindow(parent.id, deps);
    if (window === null || window.state.hasLine) return false;
    if (window.kind === "expired") {
      await sayMomentExpired(chatId, deps);
      return true;
    }
    const length = [...text].length;
    if (length > LINE_MAX_CHARS) {
      await quietly("Sending 'please shorten it' failed", () => telegram.sendMessage(chatId, WORDS.lineTooLong(length)));
      return true;
    }
    const saved = await store.saveMomentLine(parent.id, window.state.week, text, updateId);
    if (saved === "saved") await quietly("Moment saved, but sending the reply failed", () => telegram.sendMessage(chatId, WORDS.momentSaved));
    return saved !== "has_line";
  } catch (error) {
    logFailure("Saving the moment's line failed", error);
    await quietly("Sending 'didn't save' failed", () => telegram.sendMessage(chatId, WORDS.didNotSave));
    return true;
  }
}
