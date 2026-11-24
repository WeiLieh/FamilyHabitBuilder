// =============================================================================
// tests/telegram-bot-felt.test.ts: "Add how you felt", a line on a saved log (rule 5.3)
//
// What it checks: [2026-11-24] the owner-approved tests F1 to F9 (owner, 24
// Nov: migration 013, a 10-minute wait, no reflections in this build):
//   F1 every receipt has an "Add how you felt" button (keyboard keeps Undo)
//   F2 the tap shows the prompt and saves nothing
//   F3 a line typed within 10 minutes is saved on that log: "✅ Added to today's log."
//   F4 over 280 characters: not saved, asked to shorten it, still waiting
//   F5 after 10 minutes, typed text is not saved as a line
//   F6 keyboard buttons and commands are never saved as a line
//   F7 a log with a line already, or an undone log, says so
//   F8 a failed save says so; the same message delivered twice is saved once
//   F9 the line's words never reach the server logs
// =============================================================================

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleUpdate, type BotDeps } from "../src/telegram-bot/handle-update.js";
import { parseUpdate } from "../src/telegram-bot/updates.js";
import { sgtInstant } from "../src/sgt.js";
import { FakeStore } from "./helpers/datastore-fake-store.js";
import { FakeTelegram, tapUpdate, textUpdate } from "./helpers/telegram-bot-fakes.js";

const ME = 4242;
const today = "2026-11-11";
const evening = sgtInstant(today, 19 * 60 + 5); // 7:05 pm
const minutesLater = (m: number) => new Date(evening.getTime() + m * 60_000);

let store: FakeStore;
let telegram: FakeTelegram;
let parentId: number;
const deps = (now: Date): BotDeps => ({ store, telegram, now });
// Each step moves the pretend database's clock too (the real database uses its own).
const at = (m: number) => {
  store.clock = minutesLater(m);
  return minutesLater(m);
};
const say = (text: string, m = 0, updateId?: number) => handleUpdate(parseUpdate(textUpdate(ME, "Wei Lieh", text, updateId)), deps(at(m)));
const tap = (data: string, m = 0, messageId = 55) => handleUpdate(parseUpdate(tapUpdate(ME, data, messageId)), deps(at(m)));

const PROMPT = "How did it feel? Type a line (up to 280 characters), or ignore this to skip.";
const ADDED = "✅ Added to today's log.";
const UNRECOGNISED = "Unrecognised text.";
const lastText = () => telegram.sentTexts().at(-1);
const felt = (logId: number) => ({ text: "Add how you felt", data: `felt:${logId}` });

beforeEach(() => {
  store = new FakeStore();
  store.today = today;
  store.clock = evening;
  telegram = new FakeTelegram();
  parentId = store.addParent({ telegramId: ME, firstName: "Wei Lieh", agreed: true });
  store.picks.push({ parentId, nudgeId: 2, frequency: "every_2_days" }, { parentId, nudgeId: 5, frequency: "once_a_week" });
});

describe("The button and the prompt (F1, F2)", () => {
  it("F1 every receipt has 'Add how you felt' for its log: keyboard (with Undo), /log and ✅ Done", async () => {
    await say("✅ Showing affection");
    const k = store.logs[0]!.id;
    expect(telegram.calls.find((c) => c.kind === "send")).toMatchObject({ buttons: [[{ text: "Undo", data: `undo:${k}` }], [felt(k)]] });
    await tap("log:5", 0, 900);
    expect(telegram.calls.filter((c) => c.kind === "send").at(-1)).toMatchObject({ buttons: [[felt(store.logs[1]!.id)]] });
    await store.recordNudgeSent({ parentId, nudgeId: 2, exampleId: 21, day: today, slotMinute: 1140, telegramMessageId: 777 });
    store.logs = [];
    await tap(`done:${today}:1140`, 0, 777);
    expect(telegram.calls.filter((c) => c.kind === "send").at(-1)).toMatchObject({ buttons: [[felt(store.logs[0]!.id)]] });
  });

  it("F2 tapping it shows the prompt and saves nothing yet", async () => {
    await say("✅ Showing affection");
    await tap(`felt:${store.logs[0]!.id}`);
    expect(lastText()).toBe(PROMPT);
    expect(store.lines.size).toBe(0);
  });
});

describe("The typed line (F3 to F6)", () => {
  it("F3 a line typed within 10 minutes is saved on that log, and the bot says so", async () => {
    await say("✅ Showing affection");
    const logId = store.logs[0]!.id;
    await tap(`felt:${logId}`, 1);
    await say("She held my hand all the way home", 9);
    expect(store.lines.get(logId)?.text).toBe("She held my hand all the way home");
    expect(lastText()).toBe(ADDED);
  });

  it("F4 a line over 280 characters is not saved; the bot asks to shorten it and keeps waiting", async () => {
    await say("✅ Showing affection");
    const logId = store.logs[0]!.id;
    await tap(`felt:${logId}`, 1);
    await say("a".repeat(312), 2);
    expect(lastText()).toBe("That line is 312 characters. Please shorten it to 280 or fewer and send it again.");
    expect(store.lines.size).toBe(0);
    await say("Shorter now", 3);
    expect(store.lines.get(logId)?.text).toBe("Shorter now");
  });

  it("F5 after 10 minutes, typed text is not saved as a line and gets 'Unrecognised text.'", async () => {
    await say("✅ Showing affection");
    await tap(`felt:${store.logs[0]!.id}`, 1);
    await say("Too late", 12);
    expect(store.lines.size).toBe(0);
    expect(lastText()).toBe(UNRECOGNISED);
    await say("a".repeat(300), 12); // too long, but nothing waits: just unrecognised
    expect(lastText()).toBe(UNRECOGNISED);
  });

  it("F6 keyboard buttons and commands are never saved as a line; they do their usual job", async () => {
    await say("✅ Showing affection");
    const first = store.logs[0]!.id;
    await tap(`felt:${first}`, 1);
    await say("✅ Spending quality time", 2); // a keyboard button: a second log
    await say("/help", 3); // a command: the help text
    expect(store.lines.size).toBe(0);
    expect(store.logs).toHaveLength(2);
    expect(lastText()).toContain("How this works");
    await say("Now the line", 4);
    expect(store.lines.get(first)?.text).toBe("Now the line");
  });
});

describe("Edge cases and failures (F7 to F9)", () => {
  it("F7 a log with a line already says so; an undone log can't take a line", async () => {
    await say("✅ Showing affection");
    const logId = store.logs[0]!.id;
    await tap(`felt:${logId}`, 1);
    await say("First line", 2);
    await tap(`felt:${logId}`, 3);
    expect(lastText()).toBe("This log already has a line.\nYou can delete it on My page.");
    await say("✅ Spending quality time", 4);
    const second = store.logs[1]!.id;
    await tap(`undo:${second}`, 4, 701);
    await tap(`felt:${second}`, 5);
    expect(telegram.calls.at(-1)).toEqual({ kind: "answer", tapId: expect.any(String), popup: "That log was undone, so it can't take a line." });
  });

  it("F8 a failed save says it didn't save, never 'Added'; the same message delivered twice is saved once", async () => {
    await say("✅ Showing affection");
    const logId = store.logs[0]!.id;
    await tap(`felt:${logId}`, 1);
    store.failLines = true;
    await say("Lost line", 2);
    expect(lastText()).toBe("🙇 Sorry, that didn't save. Please try again.");
    expect(telegram.sentTexts()).not.toContain(ADDED);
    store.failLines = false;
    await say("Kept line", 3, 9100);
    await say("Kept line", 3, 9100);
    expect(store.lines.get(logId)?.text).toBe("Kept line");
    expect(telegram.sentTexts().filter((t) => t === ADDED)).toHaveLength(1);
  });

  describe("F9", () => {
    let errors: string[];
    beforeEach(() => {
      errors = [];
      vi.spyOn(console, "error").mockImplementation((line: string) => void errors.push(line));
    });
    afterEach(() => vi.restoreAllMocks());

    it("F9 the line's words never reach the server logs, even when saving it fails", async () => {
      await say("✅ Showing affection");
      await tap(`felt:${store.logs[0]!.id}`, 1);
      store.failLines = true; // its error repeats the line in quotes, as a database might
      await say("Riley cried at bedtime", 2);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join("\n")).not.toContain("Riley");
    });
  });
});
