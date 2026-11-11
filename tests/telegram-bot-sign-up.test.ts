// =============================================================================
// tests/telegram-bot-sign-up.test.ts: signing up with an invite (thin slice 1)
//
// [2026-11-11] What a person sees when they open the bot with an invite link
// (src/telegram-bot/SPEC.md, "Build: thin slice 1"; rules 1.1, 11.9).
// Uses the pretend Telegram and database in tests/helpers/telegram-bot-fakes.ts.
// =============================================================================

import { beforeEach, describe, expect, it } from "vitest";
import { handleUpdate } from "../src/telegram-bot/handle-update.js";
import { parseUpdate } from "../src/telegram-bot/updates.js";
import { sgtInstant } from "../src/sgt.js";
import { FakeStore } from "./helpers/datastore-fake-store.js";
import { FakeTelegram, tapUpdate, textUpdate } from "./helpers/telegram-bot-fakes.js";

const ME = 4242; // a Telegram user ID
let store: FakeStore;
let telegram: FakeTelegram;
const now = sgtInstant("2026-11-11", 10 * 60); // Wednesday 10:00 am, Singapore time

async function send(body: unknown): Promise<void> {
  await handleUpdate(parseUpdate(body), { store, telegram, now });
}

beforeEach(() => {
  store = new FakeStore();
  telegram = new FakeTelegram();
  store.invites.set("WELCOME-1", null);
});

describe("Sign-up with an invite (thin slice 1)", () => {
  it("creates the parent with their Telegram first name, uses the code, and shows the agreement with one button", async () => {
    await send(textUpdate(ME, "Wei Lieh", "/start WELCOME-1"));
    expect(store.parents).toEqual([expect.objectContaining({ telegramId: ME, firstName: "Wei Lieh" })]);
    expect(store.invites.get("WELCOME-1")).toBe(store.parents[0]?.id);
    expect(telegram.sentTexts()[0]).toBe("Thanks for joining, Wei Lieh!");
    const agreement = telegram.calls[1];
    expect(agreement).toMatchObject({ kind: "send", chatId: ME, buttons: [{ text: "✅ I agree", data: "agree" }] });
  });

  it("refuses an unknown or used code politely, and saves nothing", async () => {
    await send(textUpdate(ME, "Wei Lieh", "/start NOPE"));
    store.invites.set("USED-1", 999);
    await send(textUpdate(ME, "Wei Lieh", "/start USED-1"));
    await send(textUpdate(ME, "Wei Lieh", "/start")); // no code at all
    expect(store.parents).toEqual([]);
    expect(telegram.sentTexts()).toEqual([
      "Sorry, that invite code doesn't work. Please check your invite link.",
      "Sorry, that invite code doesn't work. Please check your invite link.",
      "Sorry, that invite code doesn't work. Please check your invite link.",
    ]);
  });

  it("tells someone already signed up so, and creates no second parent", async () => {
    store.invites.set("WELCOME-2", null);
    await send(textUpdate(ME, "Wei Lieh", "/start WELCOME-1"));
    await send(textUpdate(ME, "Wei Lieh", "/start WELCOME-2"));
    expect(store.parents).toHaveLength(1);
    expect(store.invites.get("WELCOME-2")).toBeNull(); // the second code is still unused
    expect(telegram.sentTexts().at(-1)).toBe("You're already signed up.");
  });

  it("records the recording agreement when 'I agree' is tapped, and says when the reminder comes", async () => {
    await send(textUpdate(ME, "Wei Lieh", "/start WELCOME-1"));
    await send(tapUpdate(ME, "agree", 77));
    expect(store.consents).toEqual([{ parentId: store.parents[0]?.id, topic: "recording", answer: "agreed" }]);
    expect(telegram.calls).toContainEqual(expect.objectContaining({ kind: "edit", chatId: ME, messageId: 77 })); // button removed
    expect(telegram.sentTexts().at(-1)).toBe("You're all set. Your reminder comes every day at 7:00 pm.");
  });
});
