// =============================================================================
// tests/telegram-bot-log-failure.test.ts: what a failure log line may contain
//
// [2026-11-12] When something fails, the bot writes a line to Vercel's logs so
// the owner can find out why (rule 1.3). The error text comes from Supabase or
// Telegram, and it can repeat a value from the request, such as a Telegram ID
// or a name (privacy review of the sign-up gap fix, finding P2). These tests
// check such values are blanked out before the line is written.
// =============================================================================

import { afterEach, describe, expect, it, vi } from "vitest";
import { safeErrorText } from "../src/telegram-bot/log-failure.js";
import { handleUpdate } from "../src/telegram-bot/handle-update.js";
import { parseUpdate } from "../src/telegram-bot/updates.js";
import { sgtInstant } from "../src/sgt.js";
import { FakeStore } from "./helpers/datastore-fake-store.js";
import { FakeTelegram, textUpdate } from "./helpers/telegram-bot-fakes.js";

afterEach(() => vi.restoreAllMocks());

describe("Failure log lines carry no personal values (privacy finding P2)", () => {
  it("replaces a Telegram ID or any other long number in the error text with [number]", () => {
    const text = safeErrorText(new Error("Key (telegram_id)=(123456789) already exists"));
    expect(text).not.toContain("123456789");
    expect(text).toContain("[number]");
  });

  it("replaces anything in quotes in the error text with [text] (databases repeat the value they refused)", () => {
    const text = safeErrorText(new Error('invalid input syntax for type bigint: "Wei Lieh"'));
    expect(text).not.toContain("Wei Lieh");
    expect(text).toContain("[text]");
  });

  it("the bot's own failure lines go through it: a failed sign-up check logs neither the ID nor the name", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void lines.push(args.map(String).join(" ")));
    const store = new FakeStore();
    store.failReads = true;
    store.readErrorText = 'lookup failed for telegram_id 123456789, name "Wei Lieh"';
    await handleUpdate(parseUpdate(textUpdate(123456789, "Wei Lieh", "/start WELCOME-1")), {
      store,
      telegram: new FakeTelegram(),
      now: sgtInstant("2026-11-12", 10 * 60),
    });
    expect(lines.length).toBeGreaterThan(0); // the failure was still logged
    expect(lines.join("\n")).not.toContain("123456789");
    expect(lines.join("\n")).not.toContain("Wei Lieh");
  });
});
