// =============================================================================
// tests/helpers/telegram-bot-onboarding.ts: walk a pretend person through sign-up
//
// What it does: [2026-11-12] many tests need someone who has already reached a
// given sign-up screen (say, the plan summary). goTo plays the taps and typed
// answers up to that screen, like fast-forwarding a video, so each test only
// shows the part it checks. It uses the invite code "WELCOME-1" (the test adds
// it), the first name "John" and one child, "Mia". By default the person picks
// one quick behaviour (Showing affection) and skips the deliberate one.
// =============================================================================

import { handleUpdate, type BotDeps } from "../../src/telegram-bot/handle-update.js";
import { parseUpdate } from "../../src/telegram-bot/updates.js";
import { QUICK } from "./datastore-fake-store.js";
import { tapUpdate, textUpdate } from "./telegram-bot-fakes.js";

// The screens in order; "finished" means "I agree" has been tapped.
const STEPS = ["name", "children", "quick", "deliberate", "school_times", "weekend_times", "plan", "agreement", "finished"] as const;
export type Step = (typeof STEPS)[number];

export async function goTo(
  step: Step,
  deps: BotDeps,
  telegramId: number,
  choose: { quick?: number[]; deliberate?: number } = {},
): Promise<void> {
  const send = (body: unknown) => handleUpdate(parseUpdate(body), deps);
  const type = (text: string) => send(textUpdate(telegramId, "John", text));
  const tap = (data: string) => send(tapUpdate(telegramId, data));
  const quick = choose.quick ?? [QUICK[1]!.id];

  // Each action below moves the person to the next screen in STEPS.
  const actions: (() => Promise<void>)[] = [
    () => type("/start WELCOME-1"), // → name (waiting for the child's name)
    () => type("Mia"), // → children ("Any other children?")
    () => tap("kids:done"), // → quick
    async () => {
      for (const id of quick) await tap(`q:${id}`);
      await tap("q:next"); // → deliberate
    },
    () => tap(choose.deliberate === undefined ? "d:skip" : `d:${choose.deliberate}`), // → school_times
    () => tap("times:school"), // → weekend_times
    () => tap("times:weekend"), // → plan
    () => tap("plan:ok"), // → agreement
    () => tap("agree"), // → finished
  ];
  for (let i = 0; i <= STEPS.indexOf(step); i++) await actions[i]!();
}
