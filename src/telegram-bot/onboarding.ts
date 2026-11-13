// =============================================================================
// src/telegram-bot/onboarding.ts: sign-up screens 2 to 11, on the sign-up draft
//
// What it does: [2026-11-12] walks a new person through sign-up, one screen at
// a time (src/telegram-bot/SPEC.md, "Recorded: group A finished", owner 12 Nov):
//   /start CODE → 2 first name (Change name) → 3 children (up to 3) →
//   4 quick behaviours (tick up to 2) → 5 deliberate behaviour (or skip) →
//   6 and 7 the default times (OK) → 8 the plan (OK) → 9 "✅ I agree" →
//   10 "Start right now" (only with a quick pick) → 11 "All set".
// [2026-11-13] Pull request 3c: screens 10 and 11 state the planner's real
// next reminder (rule 3.17, W2, W3) instead of the fixed 7:00 pm (D1, removed);
// the 24-hour sign-up reminder's Continue button carries on (W5, Q11b).
// Every answer is saved in the person's sign-up draft as they go, with the
// step reached, so they can stop and carry on later ("Welcome back!", Q10e).
// Nothing personal reaches the real tables until "I agree", which turns the
// draft into the parent in one all-or-nothing step (rule 8.13).
//
// Why it works like a form with a bookmark: the draft's "step" is the
// bookmark. A button only works on the screen it belongs to, so an old button
// further up the chat saves nothing (like a paper form: you can't fill in page 2
// again once it's handed in).
//
// Honest failures (rule 1.3): if saving fails, the person is told "didn't save"
// and stays on the same screen; once something is saved, a Telegram failure is
// written to the log but never reported as "didn't save".
// =============================================================================

import type { Behaviour, Draft, DraftAnswers } from "../datastore/store.js";
import { toSgt } from "../sgt.js";
import { DEFAULT_FREQUENCIES, DEFAULT_SCHEDULES, DEFAULT_WEEKLY_WRAP_UP, MAX_CHILDREN, NAME_MAX_CHARS, STARTING_CHOICE_LIMITS, WEB_PAGES } from "../settings.js";
import { nextReminder } from "../nudge-engine/next-reminder.js";
import { plannerInput } from "./scheduler.js";
import type { BotDeps } from "./handle-update.js";
import { logFailure } from "./log-failure.js";
import type { Button } from "./telegram-api.js";
import type { Incoming } from "./updates.js";
import { spacedTime, whenWords, WORDS } from "./words.js";

type Start = Extract<Incoming, { kind: "start" }>;
type Tap = Extract<Incoming, { kind: "tap" }>;

// The bookmark values, in screen order. "name" = screens 2 and 3 shown, waiting
// for the first child's name (the database starts every draft here).
type Step = "name" | "new_name" | "child" | "children" | "quick" | "deliberate" | "school_times" | "weekend_times" | "plan" | "agreement";

// ---- /start ------------------------------------------------------------------

// /start from someone who is not a parent yet (handle-update.ts checked that).
export async function startOnboarding(s: Start, deps: BotDeps): Promise<void> {
  const { store, telegram } = deps;
  let draft: Draft | null;
  try {
    draft = await store.findDraft(s.telegramId);
  } catch (error) {
    logFailure("Checking for a sign-up in progress failed", error);
    await telegram.sendMessage(s.chatId, WORDS.signUpFailed);
    return;
  }
  // Halfway through: carry on, whatever link they used (Q10e, 10f).
  if (draft) {
    await telegram.sendMessage(s.chatId, WORDS.welcomeBack);
    await showStep(s.chatId, draft, deps);
    return;
  }
  if (s.code === null) {
    await telegram.sendMessage(s.chatId, WORDS.noCode); // Q10d
    return;
  }
  // Hold the code and start the draft, with the first name from Telegram (Q10a).
  let result;
  try {
    result = await store.startSignUp({ telegramId: s.telegramId, firstName: s.firstName, code: s.code });
  } catch (error) {
    logFailure("Starting a sign-up failed", error);
    await telegram.sendMessage(s.chatId, WORDS.signUpFailed);
    return;
  }
  if (!result.ok) {
    await telegram.sendMessage(s.chatId, result.reason === "already" ? WORDS.alreadySignedUp : WORDS.badCode);
    return;
  }
  // Screen 2 (with the 7-day line) and screen 3's question.
  await telegram.sendMessage(s.chatId, WORDS.welcome(s.firstName), [[{ text: WORDS.changeNameButton, data: "name:change" }]]);
  await telegram.sendMessage(s.chatId, WORDS.childQuestion);
}

// ---- Typed text (a name) -----------------------------------------------------

// Text typed by someone with a sign-up in progress. Only screens 2 and 3 take
// typing; anywhere else it is "Unrecognised text." (owner, 11 Nov).
export async function onboardingText(chatId: number, telegramId: number, text: string, draft: Draft, deps: BotDeps): Promise<void> {
  const { telegram } = deps;
  const step = draft.step as Step;
  if (step !== "name" && step !== "child" && step !== "new_name") {
    await telegram.sendMessage(chatId, WORDS.unrecognised);
    return;
  }
  // The typed text is the answer as it stands: never matched by Claude (rule 5.1).
  const name = text.trim();
  if (name === "" || name.length > NAME_MAX_CHARS) {
    await telegram.sendMessage(chatId, WORDS.nameTooLong(NAME_MAX_CHARS));
    return;
  }
  const a = draft.answers;
  if (step === "new_name") {
    if (!(await save(chatId, telegramId, "name", { ...a, first_name: name }, deps))) return;
    await telegram.sendMessage(chatId, WORDS.thanksName(name));
    await telegram.sendMessage(chatId, WORDS.childQuestion);
    return;
  }
  const children = [...(a.children ?? []), name];
  const next = { step: "children" as const, answers: { ...a, children } };
  if (!(await save(chatId, telegramId, next.step, next.answers, deps))) return;
  await showStep(chatId, next, deps);
}

// ---- Button taps -------------------------------------------------------------

// A tap from someone with a sign-up in progress. Each button works only on its
// own screen; any other tap just stops Telegram's loading spinner.
export async function onboardingTap(t: Tap, draft: Draft, deps: BotDeps): Promise<void> {
  const { store, telegram } = deps;
  const a = draft.answers;
  const step = draft.step as Step;
  const children = a.children ?? [];
  const picks = a.picks ?? [];

  // [2026-11-13] Continue on the 24-hour sign-up reminder (W5, Q11b): carry on
  // where they stopped, as when they reopen their invite link (Q10e).
  if (t.data === "signup:continue") {
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    await quietly("Sending 'welcome back' failed", () => telegram.sendMessage(t.chatId, WORDS.welcomeBack));
    await showStep(t.chatId, draft, deps);
    return;
  }

  // Move on: save the new step first, then take the old screen's buttons away
  // (its words stay, or are replaced by "doneText"), then show the next screen.
  const moveOn = async (next: { step: Step; answers: DraftAnswers }, doneText?: string): Promise<void> => {
    if (!(await save(t.chatId, t.telegramId, next.step, next.answers, deps, t))) return;
    await quietly("Saved, but closing the old screen failed", () =>
      doneText === undefined ? telegram.removeButtons(t.chatId, t.messageId) : telegram.editMessage(t.chatId, t.messageId, doneText),
    );
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    await showStep(t.chatId, next, deps);
  };

  if (t.data === "name:change" && step === "name") return moveOn({ step: "new_name", answers: a });
  if (t.data === "kids:add" && step === "children" && children.length < MAX_CHILDREN) return moveOn({ step: "child", answers: a });
  if (t.data === "kids:done" && step === "children") {
    if (!(await save(t.chatId, t.telegramId, "quick", a, deps, t))) return;
    await quietly("Saved, but closing the old screen failed", () => telegram.removeButtons(t.chatId, t.messageId));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    // Told once, to parents of 2 or 3 children (Q4).
    if (children.length >= 2) await quietly("Sending the taking-turns note failed", () => telegram.sendMessage(t.chatId, WORDS.takingTurns(children)));
    await showStep(t.chatId, { step: "quick", answers: a }, deps);
    return;
  }

  // Screens 4 and 5 need the behaviours' names.
  let behaviours: Behaviour[] = [];
  if (step === "quick" || step === "deliberate") {
    try {
      behaviours = await store.behaviours();
    } catch (error) {
      logFailure("Reading the behaviours failed", error);
      await telegram.sendMessage(t.chatId, WORDS.signUpFailed).catch(() => undefined);
      await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
      return;
    }
  }
  const quickPicks = picks.filter((p) => behaviours.some((b) => b.id === p.nudge_id && b.category === "quick"));
  // Picks always come from this list, so a name is always found; an unknown one is left out (F2).
  const namesOf = (ids: number[]) => ids.flatMap((id) => behaviours.filter((b) => b.id === id).map((b) => b.name));

  const tick = /^q:(\d+)$/.exec(t.data);
  if (tick && step === "quick") {
    const id = Number(tick[1]);
    if (!behaviours.some((b) => b.id === id && b.category === "quick")) return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId)));
    const already = picks.some((p) => p.nudge_id === id);
    if (!already && quickPicks.length >= STARTING_CHOICE_LIMITS.maxQuick) {
      await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId, WORDS.pickLimit));
      return;
    }
    // Tick or untick, keeping the order they were picked in (screen 10 uses the first).
    const nextPicks = already ? picks.filter((p) => p.nudge_id !== id) : [...picks, { nudge_id: id, frequency: DEFAULT_FREQUENCIES.quick }];
    if (!(await save(t.chatId, t.telegramId, "quick", { ...a, picks: nextPicks }, deps, t))) return;
    // Edit the list in place, so the tick shows (Telegram principle 4).
    await quietly("Saved, but showing the tick failed", () =>
      telegram.editMessage(t.chatId, t.messageId, WORDS.quickIntro, quickButtons(behaviours, nextPicks.map((p) => p.nudge_id))),
    );
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  if (t.data === "q:next" && step === "quick") {
    return moveOn({ step: "deliberate", answers: a }, `${WORDS.quickIntro}\n\n${WORDS.picked(namesOf(quickPicks.map((p) => p.nudge_id)))}`);
  }
  const choose = /^d:(\d+)$/.exec(t.data);
  if (choose && step === "deliberate") {
    const id = Number(choose[1]);
    if (!behaviours.some((b) => b.id === id && b.category === "deliberate")) return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId)));
    const nextPicks = [...picks, { nudge_id: id, frequency: DEFAULT_FREQUENCIES.deliberate }];
    return moveOn({ step: "school_times", answers: { ...a, picks: nextPicks } }, `${deliberateIntro(quickPicks.length)}\n\n${WORDS.picked(namesOf([id]))}`);
  }
  // Skip only when a quick behaviour was picked: at least one in total (rule 2.1, owner's D2).
  if (t.data === "d:skip" && step === "deliberate" && quickPicks.length > 0) {
    return moveOn({ step: "school_times", answers: a }, `${deliberateIntro(quickPicks.length)}\n\n${WORDS.skipped}`);
  }
  // Screens 6 and 7: OK keeps the default times (rule 3.3); changes come later in Settings (Q7).
  if (t.data === "times:school" && step === "school_times") {
    const slots = { school: DEFAULT_SCHEDULES.school, non_school: a.slots?.non_school ?? [] };
    return moveOn({ step: "weekend_times", answers: { ...a, slots } });
  }
  if (t.data === "times:weekend" && step === "weekend_times") {
    const slots = { school: a.slots?.school ?? DEFAULT_SCHEDULES.school, non_school: DEFAULT_SCHEDULES.nonSchool };
    return moveOn({ step: "plan", answers: { ...a, slots } });
  }
  if (t.data === "plan:ok" && step === "plan") return moveOn({ step: "agreement", answers: a });
  if (t.data === "agree" && step === "agreement") return finish(t, draft, deps);

  // An old button, or one from another screen: nothing to do.
  await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
}

// ---- Screen 9 → 10 → 11 ------------------------------------------------------

// "✅ I agree": the draft becomes the parent, all or nothing (rule 11.9).
async function finish(t: Tap, draft: Draft, deps: BotDeps): Promise<void> {
  const { store, telegram, now } = deps;
  let parentId: number;
  try {
    parentId = await store.finishSignUp({ telegramId: t.telegramId, updateId: t.updateId });
  } catch (error) {
    // Nothing was saved (all or nothing): the button and the draft stay, so they can try again.
    logFailure("Finishing a sign-up failed", error);
    await telegram.sendMessage(t.chatId, WORDS.didNotSave).catch(() => undefined);
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  // Saved. From here on a Telegram failure is logged, never reported as "didn't save".
  await quietly("Saved, but updating the agreement failed", () => telegram.editMessage(t.chatId, t.messageId, `${WORDS.agreement}\n\n${WORDS.agreed}`));
  await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));

  const firstName = draft.answers.first_name;
  // Screen 10 uses the first quick behaviour picked and the first child (Q3, Q4).
  let behaviours: Behaviour[];
  try {
    behaviours = await store.behaviours();
  } catch (error) {
    // [2026-11-12] Review fix F3: say so, rather than skip screen 10 in silence (rule 1.3).
    logFailure("Reading the behaviours for Start right now failed", error);
    await quietly("Sending the start-now failure note failed", () => telegram.sendMessage(t.chatId, WORDS.startNowNotShown));
    await allSet(t.chatId, firstName, parentId, deps);
    return;
  }
  const first = (draft.answers.picks ?? [])
    .map((p) => behaviours.find((b) => b.id === p.nudge_id))
    .find((b) => b?.category === "quick");
  const child = draft.answers.children?.[0];
  if (!first || !first.startNowLine || !child) {
    // Only a deliberate pick: screen 10 is skipped (Q3). A missing line is never made up (rule 1.3).
    if (first && (!first.startNowLine || !child)) logFailure("Start right now skipped: no fixed line or child", new Error("missing data"));
    await allSet(t.chatId, firstName, parentId, deps);
    return;
  }
  // Send first, record after: a message is recorded only once it was really sent.
  let messageId: number;
  try {
    messageId = await telegram.sendMessage(t.chatId, first.startNowLine.replaceAll("{child}", child), [
      [
        { text: WORDS.startedButton, data: "start:done" },
        { text: WORDS.notNowButton, data: "start:notnow" },
      ],
    ]);
  } catch (error) {
    logFailure("Sending Start right now failed", error);
    await allSet(t.chatId, firstName, parentId, deps);
    return;
  }
  try {
    await store.recordStartNowShown({ parentId, nudgeId: first.id, day: toSgt(now).date });
  } catch (error) {
    // Its buttons could never save: say so and take them away (rule 1.3).
    logFailure("Start right now sent but not recorded", error);
    await quietly("Replacing the start-now buttons failed", () => telegram.editMessage(t.chatId, messageId, WORDS.startNowNotSaved));
    await allSet(t.chatId, firstName, parentId, deps);
  }
}

// A tap on screen 10's buttons, from the new parent.
export async function startNowTap(t: Tap, parent: { id: number; firstName: string }, deps: BotDeps): Promise<void> {
  const { store, telegram, now } = deps;
  let m;
  try {
    m = await store.findStartNow(parent.id);
  } catch (error) {
    logFailure("Looking up the start-now message failed", error);
    await telegram.sendMessage(t.chatId, WORDS.signUpFailed).catch(() => undefined);
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  if (!m) return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId)));
  // Logging is for today only (rule 5.4): an old start-now button saves nothing.
  if (m.day !== toSgt(now).date) return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId, WORDS.expired)));
  const done = t.data === "start:done";
  if (m.answer !== null) {
    const popup = m.answer === "done" && done ? WORDS.alreadySaved : WORDS.alreadyAnswered;
    return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId, popup)));
  }

  let saved: "saved" | "duplicate" | undefined;
  try {
    if (done) saved = await store.saveStartNowLog({ parentId: parent.id, nudgeId: m.nudgeId, day: m.day, messageId: m.messageId, updateId: t.updateId });
    else await store.recordStartNowNotNow(parent.id, t.updateId);
  } catch (error) {
    logFailure("Saving a start-now tap failed", error);
    await telegram.sendMessage(t.chatId, WORDS.didNotSave).catch(() => undefined);
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  if (saved === "duplicate") return void (await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId, WORDS.alreadySaved)));

  // Like a nudge (rule 5.10): the message keeps its words and loses its buttons,
  // then the reply arrives as new messages below it.
  await quietly("Saved, but removing the start-now buttons failed", () => telegram.removeButtons(t.chatId, t.messageId));
  await quietly("Saved, but sending the reply failed", () =>
    done ? telegram.sendMessage(t.chatId, WORDS.receipt(m.nudgeName)) : notNowLine(t.chatId, parent.id, deps),
  );
  await allSet(t.chatId, parent.firstName, parent.id, deps);
  await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
}

// [2026-11-13] When this parent's next reminder is, from the planner (rule
// 3.17): words like "on Friday at 7:00 am" (W2), "none" (paused, or nothing
// due in 14 days: W3), or "unknown" if the database can't answer (rule 1.3:
// shown as a failure, never a guessed time).
async function nextReminderWords(parentId: number, { store, now }: BotDeps): Promise<string | "none" | "unknown"> {
  try {
    const { holidays, parent } = await store.planningDataFor(parentId, toSgt(now).date);
    if (!parent) throw new Error("The new parent was not found");
    const next = nextReminder(plannerInput(parent, holidays, now));
    return next ? whenWords(now, next) : "none";
  } catch (error) {
    logFailure("Working out the next reminder failed", error);
    return "unknown";
  }
}

// "Not now" on screen 10: the first reminder's time (W2, W3).
async function notNowLine(chatId: number, parentId: number, deps: BotDeps): Promise<void> {
  const when = await nextReminderWords(parentId, deps);
  const text = when === "none" ? WORDS.notNowNoReminder : when === "unknown" ? WORDS.notNowUnknown : WORDS.notNow(when);
  await deps.telegram.sendMessage(chatId, text);
}

// Screen 11: "You're all set" and the link to My page (a placeholder until the Web app).
// [2026-11-12] Review fix F2: without a first name, that line is left out rather
// than shown with a blank (rule 1.3); the database never lets this happen for a parent.
async function allSet(chatId: number, firstName: string | undefined, parentId: number, deps: BotDeps): Promise<void> {
  const { telegram } = deps;
  if (firstName) {
    const when = await nextReminderWords(parentId, deps);
    const text = when === "none" ? WORDS.allSetNoReminder(firstName) : when === "unknown" ? WORDS.allSetUnknown(firstName) : WORDS.allSet(firstName, when);
    await quietly("Sending 'all set' failed", () => telegram.sendMessage(chatId, text));
  } else logFailure("'All set' left out: no first name", new Error("missing data"));
  await quietly("Sending the page link failed", () =>
    telegram.sendMessage(chatId, WORDS.myPage, [[{ text: WORDS.openMyPageButton, url: WEB_PAGES.myPage }]]),
  );
}

// ---- Showing a screen --------------------------------------------------------

// Show the screen for a step: after moving on, and after "Welcome back!".
async function showStep(chatId: number, draft: Draft, deps: BotDeps): Promise<void> {
  const { store, telegram } = deps;
  const a = draft.answers;
  const send = (text: string, buttons?: Button[][]) => quietly("Showing a sign-up screen failed", () => telegram.sendMessage(chatId, text, buttons));
  switch (draft.step as Step) {
    case "name":
      return send(WORDS.childQuestion);
    case "new_name":
      return send(WORDS.askFirstName);
    case "child":
      return send(WORDS.otherChildQuestion);
    case "children": {
      const children = a.children ?? [];
      const buttons: Button[] = [
        ...(children.length < MAX_CHILDREN ? [{ text: WORDS.addChildButton, data: "kids:add" }] : []),
        { text: WORDS.thatsAllButton, data: "kids:done" },
      ];
      return send(WORDS.anyOtherChildren(children), [buttons]);
    }
    case "quick":
    case "deliberate": {
      let behaviours: Behaviour[];
      try {
        behaviours = await store.behaviours();
      } catch (error) {
        logFailure("Reading the behaviours failed", error);
        return send(WORDS.signUpFailed);
      }
      const picked = (a.picks ?? []).map((p) => p.nudge_id);
      if (draft.step === "quick") {
        const children = a.children ?? [];
        // [2026-11-12] Review fix F2: no first name, no greeting (never a blank, rule 1.3).
        if (!a.first_name) logFailure("Greeting left out: no first name", new Error("missing data"));
        else await send(children.length === 1 ? WORDS.greetOneChild(children[0]!, a.first_name) : WORDS.greetManyChildren(a.first_name));
        return send(WORDS.quickIntro, quickButtons(behaviours, picked));
      }
      const quickCount = behaviours.filter((b) => b.category === "quick" && picked.includes(b.id)).length;
      const rows: Button[][] = behaviours.filter((b) => b.category === "deliberate").map((b) => [{ text: b.name, data: `d:${b.id}` }]);
      if (quickCount > 0) rows.push([{ text: WORDS.skipButton, data: "d:skip" }]);
      return send(deliberateIntro(quickCount), rows);
    }
    case "school_times":
      return send(WORDS.schoolTimes(DEFAULT_SCHEDULES.school), [[{ text: WORDS.okButton, data: "times:school" }]]);
    case "weekend_times":
      return send(WORDS.weekendTimes(DEFAULT_SCHEDULES.nonSchool), [[{ text: WORDS.okButton, data: "times:weekend" }]]);
    case "plan": {
      let behaviours: Behaviour[];
      try {
        behaviours = await store.behaviours();
      } catch (error) {
        logFailure("Reading the behaviours failed", error);
        return send(WORDS.signUpFailed);
      }
      const chosen = (a.picks ?? []).map((p) => behaviours.find((b) => b.id === p.nudge_id)).filter((b): b is Behaviour => b !== undefined);
      const quick = chosen.filter((b) => b.category === "quick").map((b) => b.name);
      const deliberate = chosen.find((b) => b.category === "deliberate")?.name ?? null;
      return send(WORDS.plan(quick, deliberate, DEFAULT_WEEKLY_WRAP_UP.minutes), [[{ text: WORDS.okButton, data: "plan:ok" }]]);
    }
    case "agreement":
      return send(WORDS.agreement, [[{ text: WORDS.agreeButton, data: "agree" }]]);
  }
}

// Screen 4's list: one behaviour per row, ticked ones marked ✓, then Next.
function quickButtons(behaviours: Behaviour[], picked: number[]): Button[][] {
  return [
    ...behaviours
      .filter((b) => b.category === "quick")
      .map((b) => [{ text: picked.includes(b.id) ? WORDS.ticked(b.name) : b.name, data: `q:${b.id}` }]),
    [{ text: WORDS.nextButton, data: "q:next" }],
  ];
}

const deliberateIntro = (quickCount: number) => (quickCount > 0 ? WORDS.deliberateIntro : WORDS.deliberateNeeded);

// ---- Helpers -----------------------------------------------------------------

// Save a step to the draft. If it fails, say so honestly and stay on this
// screen (rule 1.3). Returns true when saved.
async function save(chatId: number, telegramId: number, step: Step, answers: DraftAnswers, { store, telegram }: BotDeps, t?: Tap): Promise<boolean> {
  try {
    await store.saveSignUpStep(telegramId, step, answers);
    return true;
  } catch (error) {
    logFailure("Saving a sign-up step failed", error);
    await telegram.sendMessage(chatId, WORDS.didNotSave).catch(() => undefined);
    if (t) await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return false;
  }
}

// Run a Telegram call whose failure must not stop the rest: write it to the log
// (with no personal values, log-failure.ts) and carry on.
async function quietly(what: string, work: () => Promise<unknown>): Promise<void> {
  try {
    await work();
  } catch (error) {
    logFailure(what, error);
  }
}
