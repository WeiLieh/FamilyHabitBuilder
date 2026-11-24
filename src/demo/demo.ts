// =============================================================================
// src/demo/demo.ts: demo mode, for showing every feature to an audience
//
// What it does: [2026-11-24] the owner-approved tests DM1 to DM13 (rules 12.1
// to 12.7, owner 24 Nov):
//   - /demo, /next and /demo stop (also /demo_stop, the Menu's spelling) work
//     only from the owner's Telegram account (an allow-list from Vercel's
//     settings). From anyone else they are left to the bot, which answers
//     "Unrecognised text." like any unknown command (rule 12.1).
//   - /demo removes any earlier demo (its photo files first, then its rows),
//     starts a fresh demo sign-up with no invite code, gives the owner's chat a
//     Menu with /next and /demo_stop, and shows sign-up screens 2 and 3, the
//     same as a real sign-up (rule 12.2).
//   - The switch (rule 12.3): while a demo runs, demoIdentity gives the bot a
//     stand-in number for the owner (their Telegram number made negative), so
//     everything the owner sends or taps belongs to the demo parent. Replies
//     still go to the owner's own chat. The 10-minute alarm leaves the owner and
//     the demo parent alone (supabase-store.ts).
//   - /next (rules 12.4 to 12.6): each chosen habit's reminder once, in the
//     order picked, skipping a habit already logged today or every habit after
//     Not today (rule 3.6, 3.5); then the Wrap Up summary (when there was a
//     log), then the 1 to 5 question; then "That's the whole week."
//   - /demo stop deletes the demo, photo files first (rules 8.5, 12.7), puts
//     the owner's own Menu and keyboard back, and says so.
// Honest failures (rule 1.3): if starting or ending fails, the bot says it
// didn't work and nothing changes.
//
// Analogy: a theatre rehearsal on the real stage. The set, the lines and the
// lighting are the real ones; only the stage manager decides when the next
// scene starts (/next), and the props are cleared away afterwards.
// =============================================================================

import { childForMessage } from "../nudge-engine/child-turn.js";
import { chooseExample } from "../nudge-engine/examples.js";
import { SLOT_STARTS } from "../settings.js";
import { mondayOf, toSgt } from "../sgt.js";
import type { BotDeps } from "../telegram-bot/handle-update.js";
import { keyboardLabels } from "../telegram-bot/log-any-time.js";
import { logFailure } from "../telegram-bot/log-failure.js";
import { menuCommands } from "../telegram-bot/menu.js";
import { sendQuestion, sendSummary } from "../telegram-bot/sunday.js";
import type { Incoming } from "../telegram-bot/updates.js";
import { WORDS } from "../telegram-bot/words.js";
import { DEMO_WORDS } from "./words.js";

const quietly = (what: string, work: () => Promise<unknown>) => work().catch((error) => logFailure(what, error));

// The demo parent has no Telegram account of its own: the owner's number, negative.
export const demoNumber = (ownerTelegramId: number) => -ownerTelegramId;

// The owner's Menu during a demo: the usual commands, plus /next and /demo_stop.
const demoMenu = () => [...menuCommands(false), { command: "next", description: DEMO_WORDS.menuNext }, { command: "demo_stop", description: DEMO_WORDS.menuStop }];

type Command = "start" | "next" | "stop";
function demoCommand(text: string): Command | null {
  const t = text.trim().toLowerCase();
  if (t === "/demo") return "start";
  if (t === "/demo stop" || t === "/demo_stop") return "stop";
  if (t === "/next") return "next";
  return null;
}

// The one entry point, called first for every update (handle-update.ts).
// Answers "handled" when it was a demo command; otherwise the update to carry
// on with: unchanged, or, while the owner's demo runs, as the demo parent.
export async function demoIdentity(incoming: Incoming, deps: BotDeps): Promise<"handled" | Incoming> {
  if (incoming.kind === "ignore") return incoming;
  const owner = incoming.telegramId;
  if (!(deps.demoOwners ?? []).includes(owner)) return incoming; // rule 12.1: only the owner
  if (incoming.kind === "message" && incoming.text !== null) {
    const command = demoCommand(incoming.text);
    if (command === "start") await startDemo(incoming.chatId, owner, deps);
    if (command === "stop") await stopDemo(incoming.chatId, owner, deps);
    if (command === "next") await nextStep(incoming.chatId, owner, deps);
    if (command !== null) return "handled";
  }
  let active: boolean;
  try {
    active = await deps.store.demoActive(owner);
  } catch (error) {
    logFailure("Checking for a demo failed", error);
    return incoming; // the owner's own account carries on as usual
  }
  return active ? { ...incoming, telegramId: demoNumber(owner) } : incoming;
}

// /demo: a fresh demo and the real sign-up, with no invite code (rule 12.2).
async function startDemo(chatId: number, owner: number, deps: BotDeps): Promise<void> {
  const { store, telegram } = deps;
  let firstName: string;
  try {
    const me = await store.findParent(owner);
    if (!me) throw new Error("The owner is not signed up");
    firstName = me.firstName;
    await removeDemoFiles(owner, deps); // an earlier demo's photos go first (rule 8.5)
    await store.startDemoSignUp(owner, firstName);
  } catch (error) {
    logFailure("Starting a demo failed", error);
    await quietly("Sending 'didn't work' failed", () => telegram.sendMessage(chatId, WORDS.signUpFailed));
    return;
  }
  await quietly("Setting the demo Menu failed", () => telegram.setMenu(chatId, demoMenu()));
  // Sign-up screens 2 and 3, exactly as a real sign-up shows them.
  await telegram.sendMessage(chatId, WORDS.welcome(firstName), [[{ text: WORDS.changeNameButton, data: "name:change" }]]);
  await telegram.sendMessage(chatId, WORDS.childQuestion);
}

async function removeDemoFiles(owner: number, { store }: BotDeps): Promise<void> {
  for (const path of await store.demoPhotoPaths(owner)) await store.removePhotoFile(path);
}

// /demo stop: delete everything of the demo, then the owner's own Menu and keyboard (rule 12.7).
async function stopDemo(chatId: number, owner: number, deps: BotDeps): Promise<void> {
  const { store, telegram } = deps;
  let me: { id: number; paused: boolean } | null;
  try {
    if (!(await store.demoActive(owner))) return void (await telegram.sendMessage(chatId, DEMO_WORDS.notRunning));
    await removeDemoFiles(owner, deps);
    await store.deleteDemo(owner);
    me = await store.findParent(owner);
  } catch (error) {
    logFailure("Ending the demo failed", error);
    await quietly("Sending 'didn't work' failed", () => telegram.sendMessage(chatId, WORDS.signUpFailed));
    return;
  }
  await quietly("Putting the owner's Menu back failed", () => telegram.setMenu(chatId, me?.paused ? menuCommands(true) : null));
  let labels: string[] = [];
  try {
    labels = me ? keyboardLabels(await store.chosenBehaviours(me.id)) : [];
  } catch (error) {
    logFailure("Reading the owner's habits after the demo failed", error);
  }
  if (labels.length > 0) await quietly("Sending 'demo ended' failed", () => telegram.sendWithKeyboard(chatId, DEMO_WORDS.stopped, labels));
  else await quietly("Sending 'demo ended' failed", () => telegram.sendMessage(chatId, DEMO_WORDS.stopped));
}

// /next: the next step of the short week (rules 12.4 to 12.6).
async function nextStep(chatId: number, owner: number, deps: BotDeps): Promise<void> {
  const { store, telegram, now } = deps;
  const day = toSgt(now).date;
  const sorry = async (what: string, error: unknown) => {
    logFailure(what, error);
    await quietly("Sending 'didn't work' failed", () => telegram.sendMessage(chatId, WORDS.signUpFailed));
  };
  try {
    const demo = await store.findParent(demoNumber(owner));
    if (!demo) {
      const signingUp = await store.demoActive(owner);
      return void (await telegram.sendMessage(chatId, signingUp ? DEMO_WORDS.finishSignUpFirst : DEMO_WORDS.notRunning));
    }
    // 1. Each chosen habit's reminder once, in the order picked; none after Not today.
    if (!(await store.notTodayOn(demo.id, day))) {
      const chosen = await store.chosenBehaviours(demo.id);
      const plan = (await store.planningDataFor(demo.id, day)).parent;
      for (const [i, b] of chosen.entries()) {
        const sent = (plan?.messagesSent ?? []).some((m) => m.kind === "nudge" && m.date === day && m.nudgeId === b.id);
        if (sent || (await store.loggedToday(demo.id, b.id, day))) continue; // rule 3.6
        return await sendDemoReminder(chatId, demo.id, b, i, deps);
      }
    }
    // 2. The Wrap Up summary (with a log this week), then 3. the 1 to 5 question.
    const p = (await store.sundayData(day, demo.id))[0];
    if (!p) throw new Error("The demo parent has no Sunday data");
    const here = { ...p, telegramId: chatId, paused: false };
    const counts = { failed: 0 };
    const sentThisWeek = (kind: "weekly_wrap_up" | "connection_question") => p.messagesSent.some((m) => m.kind === kind && mondayOf(m.date) === mondayOf(day));
    if (p.logs.length > 0 && !sentThisWeek("weekly_wrap_up")) return void (await sendSummary(here, day, deps, counts));
    if (!sentThisWeek("connection_question")) return void (await sendQuestion(here, day, deps, counts));
    await telegram.sendMessage(chatId, DEMO_WORDS.done);
  } catch (error) {
    await sorry("A demo step failed", error);
  }
}

// One habit's reminder, exactly as the alarm sends it (scheduler.ts): the words,
// an idea not yet used, one child's name, ✅ Done and 😴 Not today. Its slot is a
// stand-in time per habit, so each reminder's buttons find their own message.
async function sendDemoReminder(chatId: number, parentId: number, b: { id: number; name: string }, index: number, { store, telegram, now }: BotDeps): Promise<void> {
  const day = toSgt(now).date;
  const slot = SLOT_STARTS[index * 2]!; // 7:00, 8:00, 9:00 am: one per habit, never shared
  const p = (await store.planningDataFor(parentId, day)).parent;
  if (!p) throw new Error("The demo parent has no plan data");
  const ideas = await store.nudgeExamples(b.id);
  const exampleId = chooseExample(ideas, p.examplesUsed.filter((u) => u.nudgeId === b.id).map((u) => u.exampleId));
  const example = ideas.find((e) => e.id === exampleId)!.example;
  const child = childForMessage(p.children, p.childMessagesBefore);
  const messageId = await telegram.sendMessage(chatId, WORDS.nudge(b.name, child, example), [
    { text: WORDS.doneButton, data: `done:${day}:${slot}` },
    { text: WORDS.notTodayButton, data: `skip:${day}:${slot}` },
  ]);
  try {
    await store.recordNudgeSent({ parentId, nudgeId: b.id, exampleId, day, slotMinute: slot, telegramMessageId: messageId });
  } catch (error) {
    // Sent but not recorded: its buttons could never save, so say so (as the alarm does, W6).
    logFailure("A demo reminder was sent but not recorded", error);
    await quietly("Editing the unsaved demo reminder failed", () => telegram.editMessage(chatId, messageId, WORDS.nudgeNotSaved));
  }
}
