// =============================================================================
// tests/telegram-bot-done.test.ts: the ✅ Done and 😴 Not today buttons (thin slice 1)
//
// [2026-11-11] What happens when the parent taps a button under the daily
// nudge (rules 3.5, 5.4, 7.5, 1.3; src/telegram-bot/SPEC.md, "Build: thin slice 1").
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
  telegram = new FakeTelegram();
  store.invites.set("WELCOME-1", null);
  const r = await store.signUp({ telegramId: ME, firstName: "Wei Lieh", code: "WELCOME-1", updateId: 1 });
  parentId = r.ok ? r.parentId : 0;
  await store.recordAgreement(parentId);
  // Tonight's nudge was sent and recorded (7:00 pm = minute 1140).
  await store.recordNudgeSent({ parentId, nudgeId: 2, exampleId: 7, day: today, slotMinute: 1140 });
});

describe("✅ Done and 😴 Not today (thin slice 1)", () => {
  it("✅ Done saves a log for today, linked to that nudge, and turns the nudge into the receipt", async () => {
    await tap(`done:${today}`);
    expect(store.logs).toEqual([expect.objectContaining({ parentId, nudgeId: 2, day: today, messageId: store.sentNudges[0]?.id })]);
    expect(telegram.calls).toContainEqual({ kind: "edit", chatId: ME, messageId: 55, text: "✅ Saved: Showing affection today." });
  });

  it("✅ Done on yesterday's nudge saves nothing and shows 'Reminder has expired'", async () => {
    await tap(`done:2026-11-10`);
    expect(store.logs).toEqual([]);
    expect(telegram.calls).toEqual([
      { kind: "answer", tapId: expect.any(String), popup: "Reminder has expired. Tap a behaviour on the keyboard to log today." },
    ]);
  });

  it("a second ✅ Done on the same nudge saves nothing more", async () => {
    await tap(`done:${today}`);
    await tap(`done:${today}`);
    expect(store.logs).toHaveLength(1);
    expect(telegram.calls.at(-1)).toEqual({ kind: "answer", tapId: expect.any(String), popup: "Already saved." });
  });

  it("😴 Not today turns the nudge into the comforting note and records the event", async () => {
    await tap(`skip:${today}`);
    expect(store.events).toContainEqual(expect.objectContaining({ parentId, type: "not_today" }));
    expect(telegram.calls).toContainEqual({
      kind: "edit",
      chatId: ME,
      messageId: 55,
      text: "😴 Not today. That's completely fine. No more reminders from us today. We'll be back tomorrow.",
    });
    expect(store.logs).toEqual([]); // Not today is not a log
  });

  it("😴 Not today delivered twice by Telegram is recorded once", async () => {
    const once = tapUpdate(ME, `skip:${today}`, 55, 8888);
    await handleUpdate(parseUpdate(once), { store, telegram, now: evening });
    await handleUpdate(parseUpdate(once), { store, telegram, now: evening });
    expect(store.events.filter((e) => e.type === "not_today")).toHaveLength(1);
  });

  it("ignores a button tap whose chat isn't the person who tapped", async () => {
    const body = tapUpdate(ME, `done:${today}`, 55) as { callback_query: { message: { chat: { id: number } } } };
    body.callback_query.message.chat.id = 9999;
    await handleUpdate(parseUpdate(body), { store, telegram, now: evening });
    expect(store.logs).toEqual([]);
    expect(telegram.calls).toEqual([]);
  });

  it("if saving fails, the parent sees an honest 'didn't save' message, never a receipt (rule 1.3)", async () => {
    store.failWrites = true;
    await tap(`done:${today}`);
    expect(telegram.sentTexts()).toEqual(["Sorry, that didn't save. Please try again."]);
    expect(telegram.calls.some((c) => c.kind === "edit")).toBe(false); // the nudge keeps its buttons, so they can retry
  });
});
