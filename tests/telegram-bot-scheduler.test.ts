// =============================================================================
// tests/telegram-bot-scheduler.test.ts: the alarm run every 10 minutes (pull request 3c)
//
// [2026-11-13] Supabase Cron calls the bot every 10 minutes (owner's D5). Each
// run: the sign-up clean-up, the one 24-hour sign-up reminder (Q11b, only
// 7:00 am to 9:30 pm, D7), and the planner's nudges for every parent, in
// their own slots, about their own behaviours (rules 3.1 to 3.17).
// Replaces tests/telegram-bot-daily-nudge.test.ts (the one fixed 7:00 pm
// nudge of thin slice 1), whose tests are rewritten here (CLAUDE.md rule 12).
// Test day: Wednesday 11 Nov 2026 (a school day). Default slots: school days
// 7:00 am, 7:00 pm, 9:00 pm; non-school days 9:00 am, 12:30 pm, 7:00 pm.
// [2026-11-14] B1: S3 also checks the nudge is recorded with Telegram's message number (B1-D7).
// =============================================================================

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runScheduler } from "../src/telegram-bot/scheduler.js";
import { createSchedulerHandler } from "../src/telegram-bot/web-handlers.js";
import { sgtInstant } from "../src/sgt.js";
import { DEFAULT_SCHEDULES } from "../src/settings.js";
import { FakeStore } from "./helpers/datastore-fake-store.js";
import { FakeTelegram } from "./helpers/telegram-bot-fakes.js";

let store: FakeStore;
let telegram: FakeTelegram;
const today = "2026-11-11"; // Wednesday
const at = (day: string, h: number, m = 0) => sgtInstant(day, h * 60 + m);
const sevenPm = at(today, 19, 5); // inside the 7:00 pm slot
const run = (now = sevenPm) => runScheduler({ store, telegram, now });

const HUG = "Give a hug when you say goodbye and again when you meet up.";

// A parent as sign-up leaves them: picks (in order), children, default slots.
function addPlannedParent(
  telegramId: number,
  o: { picks?: { nudgeId: number; frequency: string }[]; children?: string[]; agreed?: boolean; paused?: boolean; slots?: { school: number[]; nonSchool: number[] } } = {},
): number {
  const id = store.addParent({ telegramId, firstName: "P", agreed: o.agreed ?? true, paused: o.paused });
  for (const p of o.picks ?? [{ nudgeId: 2, frequency: "every_day" }]) store.picks.push({ parentId: id, ...p });
  for (const name of o.children ?? ["Mia"]) store.children.push({ parentId: id, firstName: name });
  store.slots.push({ parentId: id, ...(o.slots ?? DEFAULT_SCHEDULES) });
  return id;
}

beforeEach(() => {
  store = new FakeStore();
  store.today = today;
  telegram = new FakeTelegram();
  store.examples.set(2, [
    { id: 21, active: true, example: HUG },
    { id: 22, active: true, example: "Give a long hug before bed." },
  ]);
});
afterEach(() => vi.restoreAllMocks());

describe("S. Nudges from the planner", () => {
  // S3
  it("S3. sends a due behaviour in the parent's slot: 'With Mia: …', an unused idea, buttons naming the day and slot, and records it", async () => {
    const id = addPlannedParent(1001);
    await run();
    expect(telegram.calls).toEqual([
      {
        kind: "send",
        chatId: 1001,
        text: `With Mia: Showing affection\n\nIdea: ${HUG}`,
        buttons: [
          { text: "✅ Done", data: `done:${today}:1140` },
          { text: "😴 Not today", data: `skip:${today}:1140` },
        ],
      },
    ]);
    // [2026-11-14] B1-D7: recorded with Telegram's number for the message, so its buttons can be removed later (rule 5.10).
    expect(store.sentNudges).toEqual([
      expect.objectContaining({ parentId: id, nudgeId: 2, exampleId: 21, day: today, slotMinute: 1140, telegramMessageId: telegram.lastSentId }),
    ]);
  });

  // S4
  it("S4. sends nothing when paused, not agreed, after Not today, outside a slot, or with nothing due", async () => {
    addPlannedParent(1002, { paused: true });
    addPlannedParent(1003, { agreed: false });
    const notToday = addPlannedParent(1004);
    store.events.push({ parentId: notToday, type: "not_today", updateId: 1, day: today });
    const logged = addPlannedParent(1005);
    store.logs.push({ id: 900, parentId: logged, nudgeId: 2, day: today, messageId: 0, updateId: 2, via: "done_button" });
    await run();
    addPlannedParent(1006);
    await run(at(today, 15, 0)); // 3:00 pm: no slot
    expect(telegram.calls).toEqual([]);
    expect(store.sentNudges).toEqual([]);
  });

  // S5
  it("S5. re-checks right before sending: a behaviour logged a moment ago is not nudged (rule 3.6)", async () => {
    const id = addPlannedParent(1007);
    store.afterPlanningRead = () =>
      store.logs.push({ id: 901, parentId: id, nudgeId: 2, day: today, messageId: 0, updateId: 3, via: "done_button" });
    await run();
    expect(telegram.calls).toEqual([]);
  });

  // S6
  it("S6. each parent gets their own behaviour at their own time", async () => {
    store.examples.set(1, [{ id: 11, active: true, example: "Ask about their day." }]);
    store.examples.set(4, [{ id: 41, active: true, example: "Put your phone away." }]);
    addPlannedParent(1008, { picks: [{ nudgeId: 1, frequency: "every_day" }], slots: { school: [1140], nonSchool: [1140] } });
    addPlannedParent(1009, { picks: [{ nudgeId: 4, frequency: "every_day" }], slots: { school: [1260], nonSchool: [1260] } });
    await run(at(today, 19, 5));
    await run(at(today, 21, 5));
    expect(telegram.calls.map((c) => (c.kind === "send" ? [c.chatId, c.text.split("\n")[0]] : null))).toEqual([
      [1008, "With Mia: Talking with children"],
      [1009, "With Mia: Giving attention"],
    ]);
  });

  // S7 (rewritten from "running the job twice the same evening doesn't send a second nudge")
  it("S7. two runs inside the same slot send only one nudge", async () => {
    addPlannedParent(1010);
    await run(at(today, 19, 5));
    await run(at(today, 19, 15));
    expect(telegram.calls).toHaveLength(1);
  });

  // S8 (rewritten from "records a failed send as a failure, never as sent, and still sends to the others")
  it("S8. a nudge Telegram refuses is counted as a failure, never as sent, and the others still go", async () => {
    addPlannedParent(1011);
    const other = addPlannedParent(1012);
    telegram.failFor.add(1011);
    const result = await run();
    expect(result).toMatchObject({ nudgesSent: 1, failed: 1 });
    expect(store.sentNudges.map((n) => n.parentId)).toEqual([other]);
  });

  // S9 (rewritten from "if recording fails after sending, edits that nudge into an honest note")
  it("S9. if recording fails after sending, the nudge is edited into an honest note without buttons, and counts a failure", async () => {
    addPlannedParent(1013);
    store.failRecordNudge = true;
    const result = await run();
    expect(result).toMatchObject({ nudgesSent: 0, failed: 1 });
    expect(telegram.calls.at(-1)).toEqual({
      kind: "edit",
      chatId: 1013,
      messageId: 500,
      text: "Sorry, this reminder couldn't be saved, so its buttons won't work.",
    });
  });

  // S10
  it("S10. a behaviour with no active idea is not sent (never a made-up idea, rule 1.3); the others still go", async () => {
    store.examples.set(1, [{ id: 11, active: false, example: "Switched off." }]);
    addPlannedParent(1014, { picks: [{ nudgeId: 1, frequency: "every_day" }] });
    addPlannedParent(1015);
    const result = await run();
    expect(result).toMatchObject({ nudgesSent: 1, failed: 1 });
    expect(telegram.calls.map((c) => (c.kind === "send" ? c.chatId : null))).toEqual([1015]);
  });

  // S11
  it("S11. children take turns: after Start right now named Mia, the nudges name Leo, then Ava", async () => {
    store.examples.set(1, [{ id: 11, active: true, example: "Ask about their day." }]);
    const id = addPlannedParent(1016, {
      picks: [
        { nudgeId: 2, frequency: "every_day" },
        { nudgeId: 1, frequency: "every_day" },
      ],
      children: ["Mia", "Leo", "Ava"],
    });
    store.startNow.push({ id: 950, parentId: id, nudgeId: 2, day: "2026-11-10" });
    await run(at(today, 19, 5));
    await run(at(today, 21, 5));
    expect(telegram.sentTexts().map((t) => t.split("\n")[0])).toEqual(["With Leo: Showing affection", "With Ava: Talking with children"]);
  });

  // S13 [2026-11-13, spec review]
  it("S13. with no child recorded, the nudge reads 'With your child: …' (W1)", async () => {
    addPlannedParent(1021, { children: [] });
    await run();
    expect(telegram.sentTexts()[0]).toBe(`With your child: Showing affection\n\nIdea: ${HUG}`);
  });

  // S12
  it("S12. a public holiday uses the non-school slots (Thursday 9:00 am)", async () => {
    addPlannedParent(1017);
    store.holidays.push({ day: "2026-11-12", kind: "public_holiday" });
    await run(at("2026-11-12", 9, 5));
    expect(telegram.calls).toHaveLength(1);
    expect(store.sentNudges[0]).toMatchObject({ day: "2026-11-12", slotMinute: 540 });
  });
});

describe("S2. The sign-up clean-up runs every time", () => {
  // Rewritten from "runs the clean-up once, and still sends the nudges".
  it("runs the clean-up once per run, and still sends the nudges", async () => {
    addPlannedParent(1018);
    await run();
    expect(store.cleanUps).toBe(1);
    expect(telegram.calls).toHaveLength(1);
  });

  // Rewritten from "if the clean-up fails, the nudges still go out".
  it("if the clean-up fails, the nudges still go out, and the run counts a failure", async () => {
    addPlannedParent(1019);
    store.failCleanUp = true;
    const result = await run();
    expect(result).toMatchObject({ nudgesSent: 1, failed: 1 });
  });
});

describe("R. The one 24-hour sign-up reminder (Q11b)", () => {
  const REMINDER = "You're almost there! Tap below to continue where you left off.";

  // R1
  it("R1. between 7:00 am and 9:30 pm, someone due gets the reminder with Continue, once", async () => {
    store.dueForReminder.add(2001);
    await run();
    await run(at(today, 19, 15));
    expect(telegram.calls).toEqual([{ kind: "send", chatId: 2001, text: REMINDER, buttons: [[{ text: "Continue", data: "signup:continue" }]] }]);
  });

  // R2
  it("R2. at 2:00 am nobody is claimed or sent anything: it waits for 7:00 am (D7)", async () => {
    store.dueForReminder.add(2002);
    await run(at(today, 2, 0));
    expect(store.reminderClaims).toBe(0);
    expect(telegram.calls).toEqual([]);
    await run(at(today, 7, 0));
    expect(telegram.sentTexts()).toEqual([REMINDER]);
  });

  // R3
  it("R3. if Telegram refuses it, the failure is logged without the Telegram ID, never retried, and counted", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void lines.push(args.map(String).join(" ")));
    store.dueForReminder.add(987654321);
    telegram.failFor.add(987654321);
    const result = await run();
    expect(result).toMatchObject({ remindersSent: 0, failed: 1 });
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.join("\n")).not.toContain("987654321");
    telegram.failFor.clear();
    await run(at(today, 19, 15));
    expect(telegram.calls).toEqual([]);
  });
});

describe("S1. Only our alarm can start a run", () => {
  let server: Server;
  let url: string;
  beforeAll(async () => {
    server = createServer(createSchedulerHandler({ cronSecret: "cron-secret", makeDeps: () => ({ store, telegram, now: sevenPm }) }));
    await new Promise<void>((r) => server.listen(0, r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/telegram-bot`;
  });
  afterAll(async () => {
    await new Promise<void>((r) => server.close(() => r()));
  });

  // Rewritten from "refuses a caller without the cron secret and sends nothing; runs for the right one".
  it("refuses a caller without the secret and sends nothing; runs for the right one", async () => {
    addPlannedParent(1020);
    expect((await fetch(url)).status).toBe(401);
    expect((await fetch(url, { headers: { authorization: "Bearer wrong" } })).status).toBe(401);
    expect(telegram.calls).toEqual([]);
    const ok = await fetch(url, { headers: { authorization: "Bearer cron-secret" } });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ nudgesSent: 1, remindersSent: 0, failed: 0 });
  });
});
