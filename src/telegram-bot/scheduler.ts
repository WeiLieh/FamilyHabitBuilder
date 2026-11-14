// =============================================================================
// src/telegram-bot/scheduler.ts: the alarm run, every 10 minutes (pull request 3c)
//
// What it does: [2026-11-13] Supabase Cron calls the bot every 10 minutes
// (owner's D5; the call arrives through web-handlers.ts). Each run does three
// jobs, each on its own so one failing never stops the others:
//   1. the sign-up clean-up (7 and 90 days, rule 8.13), moved here from the old
//      7:00 pm job (D4);
//   2. the one 24-hour sign-up reminder (Q11b, W5), only between 7:00 am and
//      9:30 pm Singapore time (D7);
//   3. the nudges: for every parent who agreed, ask the planner "anything to
//      send right now?" (rules 3.1 to 3.10). Before sending, ask again with
//      fresh data, so a behaviour logged a moment ago is never nudged (rule
//      3.6). The nudge carries an idea this parent hasn't seen (rule 3.13) and
//      one child's name, taking turns (rule 3.16), in the owner's words (W1).
// It returns a count: nudges sent, reminders sent, failures.
//
// Honest failures (rule 1.3): a send Telegram refuses is a failure, never
// "sent"; a nudge sent but not recorded is edited into an honest note without
// buttons (W6); nothing is ever sent with a made-up idea. Failures are logged
// with the parent's number at most, never a name or Telegram ID (privacy review).
// Replaces daily-nudge.ts (thin slice 1's one 7:00 pm nudge; CLAUDE.md rule 12).
// =============================================================================

import type { PlanParent } from "../datastore/store.js";
import { childForMessage } from "../nudge-engine/child-turn.js";
import { chooseExample } from "../nudge-engine/examples.js";
import { planNudge, type PlannerInput } from "../nudge-engine/planner.js";
import type { Holidays } from "../nudge-engine/schedule.js";
import { SIGN_UP_REMINDER_HOURS } from "../settings.js";
import { toSgt } from "../sgt.js";
import type { BotDeps } from "./handle-update.js";
import { logFailure } from "./log-failure.js";
import { WORDS } from "./words.js";

export type SchedulerResult = { nudgesSent: number; remindersSent: number; failed: number };

export async function runScheduler(deps: BotDeps): Promise<SchedulerResult> {
  const result: SchedulerResult = { nudgesSent: 0, remindersSent: 0, failed: 0 };
  await cleanUp(deps, result);
  await signUpReminders(deps, result);
  await nudges(deps, result);
  return result;
}

// ---- 1. The sign-up clean-up ----------------------------------------------------
async function cleanUp({ store }: BotDeps, result: SchedulerResult): Promise<void> {
  try {
    await store.cleanUpSignUps();
  } catch (error) {
    logFailure("The sign-up clean-up failed", error);
    result.failed++;
  }
}

// ---- 2. The one 24-hour sign-up reminder (Q11b) ----------------------------------
async function signUpReminders({ store, telegram, now }: BotDeps, result: SchedulerResult): Promise<void> {
  // D7: only in daytime; someone due at night is claimed at the first run from 7:00 am.
  const minutes = toSgt(now).minutes;
  if (minutes < SIGN_UP_REMINDER_HOURS.from || minutes > SIGN_UP_REMINDER_HOURS.until) return;
  let due: { telegramId: number }[];
  try {
    due = await store.claimSignUpReminders(); // marked as reminded in the same step
  } catch (error) {
    logFailure("Claiming sign-up reminders failed", error);
    result.failed++;
    return;
  }
  for (const person of due) {
    try {
      await telegram.sendMessage(person.telegramId, WORDS.signUpReminder, [[{ text: WORDS.continueButton, data: "signup:continue" }]]);
      result.remindersSent++;
    } catch (error) {
      // Not retried: one reminder only (Q11b). No Telegram ID in the log (privacy review).
      logFailure("A sign-up reminder was not sent", error);
      result.failed++;
    }
  }
}

// ---- 3. The planner's nudges -----------------------------------------------------
async function nudges(deps: BotDeps, result: SchedulerResult): Promise<void> {
  const { store, now } = deps;
  const day = toSgt(now).date;
  let data: { holidays: Holidays; parents: PlanParent[] };
  try {
    data = await store.planningData(day);
  } catch (error) {
    logFailure("Reading the planner's data failed", error);
    result.failed++;
    return;
  }
  for (const parent of data.parents) {
    // Only parents who agreed to recording (rule 11.9); "paused" is the planner's first check.
    if (!parent.agreed) continue;
    // [2026-11-13, review] One parent's error is logged and skipped; the others still get theirs.
    try {
      if (!planNudge(plannerInput(parent, data.holidays, now)).send) continue;
    } catch (error) {
      logFailure(`Planning for parent ${parent.parentId} failed`, error);
      result.failed++;
      continue;
    }
    await sendNudge(parent.parentId, deps, result);
  }
}

// The planner's question, for one parent at this moment.
export function plannerInput(p: PlanParent, holidays: Holidays, now: Date): PlannerInput {
  return {
    now,
    targets: p.targets,
    schedules: p.schedules,
    holidays,
    logs: p.logs,
    messagesSent: p.messagesSent,
    notTodayDate: p.notTodayDate,
    paused: p.paused,
    slotsChangedAt: p.slotsChangedAt,
  };
}

async function sendNudge(parentId: number, { store, telegram, now }: BotDeps, result: SchedulerResult): Promise<void> {
  const day = toSgt(now).date;
  // Rule 3.6: look again, with fresh data, right before sending.
  let fresh: { holidays: Holidays; parent: PlanParent | null };
  try {
    fresh = await store.planningDataFor(parentId, day);
  } catch (error) {
    logFailure(`Re-checking parent ${parentId} before sending failed`, error);
    result.failed++;
    return;
  }
  const p = fresh.parent;
  if (!p || !p.agreed) return;
  let plan;
  try {
    plan = planNudge(plannerInput(p, fresh.holidays, now));
  } catch (error) {
    logFailure(`Planning for parent ${parentId} failed`, error);
    result.failed++;
    return;
  }
  if (!plan.send) return; // e.g. logged a moment ago: nothing to send

  // The idea (rule 3.13) and the child (rule 3.16). Never made up (rule 1.3).
  let exampleId: number;
  let example: string;
  let child: string | null;
  let name: string;
  try {
    const ideas = await store.nudgeExamples(plan.nudgeId);
    exampleId = chooseExample(ideas, p.examplesUsed.filter((u) => u.nudgeId === plan.nudgeId).map((u) => u.exampleId));
    example = ideas.find((e) => e.id === exampleId)!.example;
    child = childForMessage(p.children, p.childMessagesBefore);
    const behaviour = (await store.behaviours()).find((b) => b.id === plan.nudgeId);
    if (!behaviour) throw new Error(`Behaviour ${plan.nudgeId} not found`);
    name = behaviour.name;
  } catch (error) {
    logFailure(`Nudge for parent ${parentId} not sent: its words couldn't be made`, error);
    result.failed++;
    return;
  }

  // Send first, record after: a nudge is recorded only once Telegram really took it.
  let messageId: number;
  try {
    messageId = await telegram.sendMessage(p.telegramId, WORDS.nudge(name, child, example), [
      { text: WORDS.doneButton, data: `done:${day}:${plan.slotStart}` },
      { text: WORDS.notTodayButton, data: `skip:${day}:${plan.slotStart}` },
    ]);
  } catch (error) {
    logFailure(`Nudge not sent to parent ${parentId}`, error);
    result.failed++;
    return;
  }
  try {
    // [2026-11-14] With Telegram's number, so a keyboard or /log tap can remove its buttons (B1-D7, rule 5.10).
    await store.recordNudgeSent({ parentId, nudgeId: plan.nudgeId, exampleId, day, slotMinute: plan.slotStart, telegramMessageId: messageId });
    result.nudgesSent++;
  } catch (error) {
    // Sent but not recorded: its buttons could never save, so say so and remove them (W6).
    logFailure(`Nudge sent but not recorded for parent ${parentId}`, error);
    result.failed++;
    // [2026-11-13, review] A failed edit is logged too (rule 1.3).
    await telegram.editMessage(p.telegramId, messageId, WORDS.nudgeNotSaved).catch((e) => logFailure(`Editing the unsaved nudge for parent ${parentId} failed`, e));
  }
}
