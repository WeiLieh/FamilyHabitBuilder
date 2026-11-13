// =============================================================================
// tests/telegram-bot-done.test.ts: the ✅ Done and 😴 Not today buttons (thin slice 1)
//
// [2026-11-11] What happens when the parent taps a button under the daily
// nudge (rules 3.5, 5.4, 7.5, 1.3; src/telegram-bot/SPEC.md, "Build: thin slice 1").
// [2026-11-12] Since 12 Nov (rule 5.10) a reply never replaces the nudge: the
// nudge keeps its words, loses its buttons, and the reply is a new message.
// [2026-11-13] Pull request 3c: up to 3 nudges a day, so each button names its
// day AND slot ("done:2026-11-11:1140"); the taps below were updated to that
// form (the behaviour they check is unchanged). B1 and B2 are new.
// =============================================================================

import { beforeEach, describe, expect, it } from "vitest";
import { handleUpdate } from "../src/telegram-bot/handle-update.js";
import { parseUpdate } from "../src/telegram-bot/updates.js";
import { sgtInstant } from "../src/sgt.js";
import { FakeStore } from "./helpers/datastore-fake-store.js";
import { FakeTelegram, tapUpdate } from "./helpers/telegram-bot-fakes.js";

const ME = 4242;
let store: FakeStore;
let telegram: FakeTelegram;
let parentId: number;
const today = "2026-11-11";
const evening = sgtInstant(today, 19 * 60 + 5); // 7:05 pm, just after the nudge

async function tap(data: string, now = evening): Promise<void> {
  await handleUpdate(parseUpdate(tapUpdate(ME, data, 55)), { store, telegram, now });
}

beforeEach(async () => {
  store = new FakeStore();
  store.today = today; // [2026-11-12] the pretend database's "today" matches the tap
  telegram = new FakeTelegram();
  // [2026-11-12] A signed-up parent who agreed (sign-up itself is tested in telegram-bot-onboarding.test.ts).
  parentId = store.addParent({ telegramId: ME, firstName: "Wei Lieh", agreed: true });
  // Tonight's nudge was sent and recorded (7:00 pm = minute 1140).
  await store.recordNudgeSent({ parentId, nudgeId: 2, exampleId: 7, day: today, slotMinute: 1140 });
});

describe("✅ Done and 😴 Not today (thin slice 1)", () => {
  // [2026-11-12] Rewritten (rule 5.10): was "turns the nudge into the receipt".
  it("✅ Done saves a log for today, keeps the nudge without its buttons, and sends the receipt as a new message", async () => {
    await tap(`done:${today}:1140`);
    expect(store.logs).toEqual([expect.objectContaining({ parentId, nudgeId: 2, day: today, messageId: store.sentNudges[0]?.id })]);
    // In this order: the nudge's buttons go first (so it can't be tapped again), then the receipt arrives below it.
    expect(telegram.calls).toEqual([
      { kind: "removeButtons", chatId: ME, messageId: 55 },
      { kind: "send", chatId: ME, text: "✅ Saved: Showing affection today.", buttons: [] },
      { kind: "answer", tapId: expect.any(String), popup: null },
    ]);
  });

  it("✅ Done on yesterday's nudge saves nothing and shows 'Reminder has expired'", async () => {
    await tap(`done:2026-11-10:1140`);
    expect(store.logs).toEqual([]);
    expect(telegram.calls).toEqual([
      { kind: "answer", tapId: expect.any(String), popup: "Reminder has expired. Tap a behaviour on the keyboard to log today." },
    ]);
  });

  it("a second ✅ Done on the same nudge saves nothing more", async () => {
    await tap(`done:${today}:1140`);
    await tap(`done:${today}:1140`);
    expect(store.logs).toHaveLength(1);
    expect(telegram.calls.at(-1)).toEqual({ kind: "answer", tapId: expect.any(String), popup: "Already saved." });
  });

  // [2026-11-12] Rewritten (rule 5.10): was "turns the nudge into the comforting note".
  it("😴 Not today records the event, keeps the nudge without its buttons, and sends the comforting note as a new message", async () => {
    await tap(`skip:${today}:1140`);
    expect(store.events).toContainEqual(expect.objectContaining({ parentId, type: "not_today" }));
    expect(telegram.calls).toEqual([
      { kind: "removeButtons", chatId: ME, messageId: 55 },
      {
        kind: "send",
        chatId: ME,
        text: "😴 Not today. That's completely fine. No more reminders from us today. We'll be back tomorrow.",
        buttons: [],
      },
      { kind: "answer", tapId: expect.any(String), popup: null },
    ]);
    expect(store.logs).toEqual([]); // Not today is not a log
  });

  // [2026-11-12] New (rule 5.10, rule 1.3): the answer is already saved, so a Telegram
  // hiccup afterwards must never be reported as "didn't save", and the reply still arrives.
  it("✅ Done: if removing the nudge's buttons fails after saving, the receipt is still sent and the parent is never told it didn't save", async () => {
    telegram.failRemoveButtons = true;
    await tap(`done:${today}:1140`);
    expect(store.logs).toHaveLength(1); // the log really was saved
    expect(telegram.sentTexts()).toEqual(["✅ Saved: Showing affection today."]);
  });

  it("😴 Not today: if removing the nudge's buttons fails after saving, the note is still sent and the parent is never told it didn't save", async () => {
    telegram.failRemoveButtons = true;
    await tap(`skip:${today}:1140`);
    expect(store.events).toContainEqual(expect.objectContaining({ parentId, type: "not_today" })); // really recorded
    expect(telegram.sentTexts()).toEqual(["😴 Not today. That's completely fine. No more reminders from us today. We'll be back tomorrow."]);
  });

  // [2026-11-12] New (rule 5.10, review finding P3): if the buttons could not be removed,
  // a second, different answer on the same nudge must not be saved as well.
  it("after ✅ Done, a 😴 Not today tap on the same nudge saves nothing and shows 'Already answered.'", async () => {
    await tap(`done:${today}:1140`);
    await tap(`skip:${today}:1140`);
    expect(store.events.filter((e) => e.type === "not_today")).toHaveLength(0);
    expect(telegram.calls.at(-1)).toEqual({ kind: "answer", tapId: expect.any(String), popup: "Already answered." });
  });

  it("after 😴 Not today, a ✅ Done tap on the same nudge saves nothing and shows 'Already answered.'", async () => {
    await tap(`skip:${today}:1140`);
    await tap(`done:${today}:1140`);
    expect(store.logs).toEqual([]);
    expect(telegram.calls.at(-1)).toEqual({ kind: "answer", tapId: expect.any(String), popup: "Already answered." });
  });

  it("a second 😴 Not today tap (a new tap, not a resend) is recorded once and shows 'Already answered.'", async () => {
    await tap(`skip:${today}:1140`);
    await tap(`skip:${today}:1140`);
    expect(store.events.filter((e) => e.type === "not_today")).toHaveLength(1);
    expect(telegram.sentTexts()).toHaveLength(1); // the comforting note only once
    expect(telegram.calls.at(-1)).toEqual({ kind: "answer", tapId: expect.any(String), popup: "Already answered." });
  });

  // [2026-11-12] New (rule 5.10, review findings P5 and S1).
  it("if sending the receipt fails after saving, the log stays saved and the parent is never told it didn't save", async () => {
    telegram.failNextSend = true;
    await tap(`done:${today}:1140`);
    expect(store.logs).toHaveLength(1);
    expect(telegram.calls).toContainEqual({ kind: "removeButtons", chatId: ME, messageId: 55 });
    expect(telegram.sentTexts()).not.toContain("Sorry, that didn't save. Please try again.");
  });

  it("😴 Not today delivered twice by Telegram is recorded once", async () => {
    const once = tapUpdate(ME, `skip:${today}:1140`, 55, 8888);
    await handleUpdate(parseUpdate(once), { store, telegram, now: evening });
    await handleUpdate(parseUpdate(once), { store, telegram, now: evening });
    expect(store.events.filter((e) => e.type === "not_today")).toHaveLength(1);
  });

  // [2026-11-12] New (review finding P1, rule 1.3): every database question a tap
  // asks must fail honestly, never in silence with a spinning button.
  it("if 'which nudge is this?' can't be answered, the parent is told honestly and nothing is saved", async () => {
    store.failReadsOf.add("findNudgeMessage");
    await tap(`done:${today}:1140`);
    expect(store.logs).toEqual([]);
    expect(telegram.sentTexts()).toEqual(["Sorry, that didn't work. Please try again."]);
    expect(telegram.calls.at(-1)).toEqual({ kind: "answer", tapId: expect.any(String), popup: null }); // spinner stopped
  });

  it("if 'already logged?' can't be answered, the parent is told honestly and nothing is saved", async () => {
    store.failReadsOf.add("logExistsFor");
    await tap(`done:${today}:1140`);
    expect(store.logs).toEqual([]);
    expect(telegram.sentTexts()).toEqual(["Sorry, that didn't work. Please try again."]);
    expect(telegram.calls.at(-1)).toEqual({ kind: "answer", tapId: expect.any(String), popup: null });
  });

  it("if 'already said Not today?' can't be answered, the parent is told honestly and nothing is saved", async () => {
    store.failReadsOf.add("notTodayOn");
    await tap(`skip:${today}:1140`);
    expect(store.events.filter((e) => e.type === "not_today")).toHaveLength(0);
    expect(telegram.sentTexts()).toEqual(["Sorry, that didn't work. Please try again."]);
    expect(telegram.calls.at(-1)).toEqual({ kind: "answer", tapId: expect.any(String), popup: null });
  });

  it("ignores a button tap whose chat isn't the person who tapped", async () => {
    const body = tapUpdate(ME, `done:${today}:1140`, 55) as { callback_query: { message: { chat: { id: number } } } };
    body.callback_query.message.chat.id = 9999;
    await handleUpdate(parseUpdate(body), { store, telegram, now: evening });
    expect(store.logs).toEqual([]);
    expect(telegram.calls).toEqual([]);
  });

  it("if saving fails, the parent sees an honest 'didn't save' message, never a receipt (rule 1.3)", async () => {
    store.failWrites = true;
    await tap(`done:${today}:1140`);
    expect(telegram.sentTexts()).toEqual(["Sorry, that didn't save. Please try again."]);
    // [2026-11-12] Rule 5.10: neither edited nor stripped; the nudge keeps its buttons, so they can retry.
    expect(telegram.calls.some((c) => c.kind === "edit" || c.kind === "removeButtons")).toBe(false);
  });
});

// [2026-11-13] Pull request 3c: buttons name their slot.
describe("B. Buttons name their nudge's slot", () => {
  // B1
  it("B1. with two nudges in a day, ✅ Done on the morning one saves the morning's behaviour", async () => {
    await store.recordNudgeSent({ parentId, nudgeId: 1, exampleId: 11, day: today, slotMinute: 420 });
    await tap(`done:${today}:420`);
    expect(store.logs).toEqual([expect.objectContaining({ parentId, nudgeId: 1, day: today, via: "done_button" })]);
    expect(telegram.sentTexts()).toEqual(["✅ Saved: Talking with children today."]);
  });

  // B2
  it("B2. a tap on an old button without a slot (from before pull request 3c) only stops the spinner; nothing saved", async () => {
    await tap(`done:${today}`);
    expect(store.logs).toEqual([]);
    expect(telegram.calls).toEqual([{ kind: "answer", tapId: expect.any(String), popup: null }]);
  });
});
