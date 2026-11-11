// =============================================================================
// tests/telegram-bot-daily-nudge.test.ts: the one fixed nudge at 7:00 pm (thin slice 1)
//
// [2026-11-11] Who gets the daily nudge, what it carries, and what happens when
// Telegram fails (rules 1.3, 3.5, 8.6; src/telegram-bot/SPEC.md, "Build: thin slice 1").
// =============================================================================

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runDailyNudge } from "../src/telegram-bot/daily-nudge.js";
import { createNudgeHandler } from "../src/telegram-bot/web-handlers.js";
import { sgtInstant } from "../src/sgt.js";
import { FakeStore } from "./helpers/datastore-fake-store.js";
import { FakeTelegram } from "./helpers/telegram-bot-fakes.js";

let store: FakeStore;
let telegram: FakeTelegram;
const today = "2026-11-11";
const sevenPm = sgtInstant(today, 19 * 60);

async function addParent(telegramId: number, opts: { agreed: boolean; paused?: boolean }): Promise<number> {
  const code = `C-${telegramId}`;
  store.invites.set(code, null);
  const r = await store.signUp({ telegramId, firstName: "P", code, updateId: telegramId });
  const id = r.ok ? r.parentId : 0;
  if (opts.agreed) await store.recordAgreement(id);
  if (opts.paused) store.parents.find((p) => p.id === id)!.paused = true;
  return id;
}

beforeEach(() => {
  store = new FakeStore();
  telegram = new FakeTelegram();
});

describe("The daily nudge (thin slice 1)", () => {
  it("sends every agreed, unpaused parent 'Showing affection' with one example and the two buttons, and records it", async () => {
    const id = await addParent(1001, { agreed: true });
    await runDailyNudge({ store, telegram, now: sevenPm });
    expect(telegram.calls).toEqual([
      {
        kind: "send",
        chatId: 1001,
        text: "Showing affection\n\nIdea: Give a long hug before bed.",
        buttons: [
          { text: "✅ Done", data: `done:${today}` },
          { text: "😴 Not today", data: `skip:${today}` },
        ],
      },
    ]);
    expect(store.sentNudges).toEqual([expect.objectContaining({ parentId: id, nudgeId: 2, exampleId: 7, day: today, slotMinute: 1140 })]);
  });

  it("sends nothing to a paused parent or one who hasn't agreed yet", async () => {
    await addParent(1002, { agreed: true, paused: true });
    await addParent(1003, { agreed: false });
    await runDailyNudge({ store, telegram, now: sevenPm });
    expect(telegram.calls).toEqual([]);
    expect(store.sentNudges).toEqual([]);
  });

  it("records a failed send as a failure, never as sent, and still sends to the others", async () => {
    await addParent(1004, { agreed: true });
    await addParent(1005, { agreed: true });
    telegram.failFor.add(1004);
    const result = await runDailyNudge({ store, telegram, now: sevenPm });
    expect(result).toEqual({ sent: 1, failed: 1, skipped: 0 });
    expect(store.sentNudges.map((n) => n.parentId)).toEqual([store.parents[1]?.id]);
  });

  it("if recording fails after sending, edits that nudge into an honest note without buttons, and counts a failure", async () => {
    await addParent(1008, { agreed: true });
    store.failWrites = true;
    const result = await runDailyNudge({ store, telegram, now: sevenPm });
    expect(result).toEqual({ sent: 0, failed: 1, skipped: 0 });
    expect(telegram.calls.at(-1)).toEqual({
      kind: "edit",
      chatId: 1008,
      messageId: 500,
      text: "Sorry, this reminder couldn't be saved, so its buttons won't work. Your next one comes tomorrow.",
    });
  });

  it("running the job twice the same evening doesn't send a second nudge", async () => {
    await addParent(1006, { agreed: true });
    await runDailyNudge({ store, telegram, now: sevenPm });
    const second = await runDailyNudge({ store, telegram, now: sgtInstant(today, 19 * 60 + 10) });
    expect(telegram.calls).toHaveLength(1);
    expect(second).toEqual({ sent: 0, failed: 0, skipped: 1 });
  });
});

describe("Only Vercel's alarm can start the daily nudge", () => {
  let server: Server;
  let url: string;
  beforeAll(async () => {
    server = createServer(createNudgeHandler({ cronSecret: "cron-secret", makeDeps: () => ({ store, telegram, now: sevenPm }) }));
    await new Promise<void>((r) => server.listen(0, r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/telegram-bot`;
  });
  afterAll(async () => {
    await new Promise<void>((r) => server.close(() => r()));
  });

  it("refuses a caller without the cron secret and sends nothing; runs for the right one", async () => {
    await addParent(1007, { agreed: true });
    expect((await fetch(url)).status).toBe(401);
    expect((await fetch(url, { headers: { authorization: "Bearer wrong" } })).status).toBe(401);
    expect(telegram.calls).toEqual([]);
    const ok = await fetch(url, { headers: { authorization: "Bearer cron-secret" } });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ sent: 1, failed: 0, skipped: 0 });
  });
});
