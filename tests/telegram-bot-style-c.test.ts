// =============================================================================
// tests/telegram-bot-style-c.test.ts: readable messages (house style C) and reactions
//
// [2026-11-15] The owner chose house style C and approved these tests
// (src/telegram-bot/SPEC.md, "Design in progress: readable messages"):
//   - F1 to F3: bold, done safely (Telegram's formatting mode; anything a person
//     typed, and any text from the database, is made safe first)
//   - B1 to B3: buttons (a picked option shows ✅; buttons that move sign-up on
//     end with ➡️; "💪 I've started!")
//   - T1, T2: the Terms & Conditions link and its plain page
//   - R1 to R4: rule 5.14, a random reaction on a keyboard tap only
// Each test checks what the parent would see in Telegram, or what was saved.
// =============================================================================

import { existsSync, readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleUpdate, type BotDeps } from "../src/telegram-bot/handle-update.js";
import { createTelegramApi } from "../src/telegram-bot/telegram-api.js";
import { parseUpdate } from "../src/telegram-bot/updates.js";
import { WORDS } from "../src/telegram-bot/words.js";
import { REACTION_EMOJI, WEB_PAGES } from "../src/settings.js";
import { sgtInstant } from "../src/sgt.js";
import { FakeStore } from "./helpers/datastore-fake-store.js";
import { FakeTelegram, tapUpdate, textUpdate } from "./helpers/telegram-bot-fakes.js";
import { goTo } from "./helpers/telegram-bot-onboarding.js";

const ME = 4242;
const today = "2026-11-11";
const evening = sgtInstant(today, 19 * 60 + 5); // 7:05 pm
let store: FakeStore;
let telegram: FakeTelegram;
// random() decides which reaction is picked; 0 picks the first emoji.
const deps = (random = () => 0): BotDeps => ({ store, telegram, now: evening, random });
const lastButtons = () => {
  const call = [...telegram.calls].reverse().find((c) => (c.kind === "send" || c.kind === "edit") && c.buttons);
  return call && "buttons" in call && call.buttons ? call.buttons.flat().map((b) => b.text) : [];
};

beforeEach(() => {
  store = new FakeStore();
  store.today = today;
  store.clock = evening;
  store.invites.set("WELCOME-1", null);
  telegram = new FakeTelegram();
});
afterEach(() => vi.restoreAllMocks());

describe("Bold, done safely", () => {
  it("F1 every message and edit is sent in Telegram's formatting mode (HTML), so bold shows as bold", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fakeFetch = (async (_url: string, init: { body: string }) => {
      bodies.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }));
    }) as unknown as typeof fetch;
    const api = createTelegramApi("token", fakeFetch);
    await api.sendMessage(ME, "<b>Hi</b>");
    await api.sendWithKeyboard(ME, "<b>Hi</b>", ["✅ Showing affection"]);
    await api.editMessage(ME, 9, "<b>Hi</b>");
    expect(bodies.map((b) => b.parse_mode)).toEqual(["HTML", "HTML", "HTML"]);
  });

  it("F2 a name a person typed is shown exactly as typed, and can never add formatting or break the message", async () => {
    await handleUpdate(parseUpdate(textUpdate(ME, "Tom & <b>Jerry</b>", "/start WELCOME-1")), deps());
    expect(telegram.sentTexts()[0]).toContain("Thanks for joining, Tom &amp; &lt;b&gt;Jerry&lt;/b&gt;!");
    expect(WORDS.nudge("Showing affection", "Mia <3", "Hug & smile")).toBe("<b>Showing affection</b> · with Mia &lt;3\n\n💡 Hug &amp; smile");
  });

  it("F3 the habit's name is bold in the reminder, the receipts and the plan", () => {
    expect(WORDS.nudge("Talking with children", "Mia", "Ask what made them laugh today.")).toBe(
      "<b>Talking with children</b> · with Mia\n\n💡 Ask what made them laugh today.",
    );
    expect(WORDS.receipt("Showing affection")).toBe("✅ <b>Saved</b>\nShowing affection today.");
    expect(WORDS.receiptAgain("Showing affection")).toBe("✅ <b>Saved</b>\nShowing affection, again today.\nIt counts once for your week.");
    expect(WORDS.plan(["Talking with children"], "Spending quality time", 20 * 60)).toBe(
      "<b>Your reminders</b>\n\n🔁 <b>Every 2 days</b>\n• Talking with children\n\n📅 <b>Once a week</b>\n• Spending quality time\n\n📝 <b>Week wrap up:</b> Sunday 8:00 pm\n\nChange these anytime in Settings.",
    );
  });
});

describe("Buttons", () => {
  it("B1 a picked option shows ✅, the same mark as Done", async () => {
    await goTo("children", deps(), ME);
    await handleUpdate(parseUpdate(tapUpdate(ME, "kids:done")), deps());
    await handleUpdate(parseUpdate(tapUpdate(ME, "q:2")), deps());
    expect(lastButtons()).toContain("✅ Showing affection");
  });

  it("B2 every button that moves sign-up on ends with ➡️, and no option does", async () => {
    const moveOn: string[] = [];
    const options: string[] = [];
    await handleUpdate(parseUpdate(textUpdate(ME, "John", "/start WELCOME-1")), deps());
    await handleUpdate(parseUpdate(textUpdate(ME, "John", "Mia")), deps());
    moveOn.push(WORDS.thatsAllButton);
    options.push(WORDS.addChildButton, WORDS.changeNameButton, WORDS.notNowButton);
    await handleUpdate(parseUpdate(tapUpdate(ME, "kids:done")), deps());
    const quick = lastButtons();
    moveOn.push(quick.at(-1)!);
    options.push(...quick.slice(0, -1));
    await handleUpdate(parseUpdate(tapUpdate(ME, "q:2")), deps());
    await handleUpdate(parseUpdate(tapUpdate(ME, "q:next")), deps());
    const deliberate = lastButtons();
    moveOn.push(deliberate.at(-1)!);
    options.push(...deliberate.slice(0, -1));
    await handleUpdate(parseUpdate(tapUpdate(ME, "d:skip")), deps());
    moveOn.push(...lastButtons()); // school times: OK
    moveOn.push(WORDS.continueButton);
    expect(moveOn).toEqual(["That's all ➡️", "Next ➡️", "Skip for now ➡️", "OK ➡️", "Continue ➡️"]);
    for (const option of options) expect(option.endsWith("➡️")).toBe(false);
  });

  it("B3 the start-right-now button reads '💪 I've started!'", () => {
    expect(WORDS.startedButton).toBe("💪 I've started!");
  });
});

describe("Terms & Conditions", () => {
  it("T1 the agreement links to the Terms & Conditions page", () => {
    expect(WORDS.agreement).toContain(`<a href="${WEB_PAGES.terms}">Read the Terms &amp; Conditions</a>`);
    expect(WEB_PAGES.terms).toBe("https://family-habit-builder.vercel.app/terms.html");
  });

  it("T2 the page exists, says only 'Terms & Conditions' for now, and has no styling", () => {
    expect(existsSync("public/terms.html")).toBe(true);
    const page = readFileSync("public/terms.html", "utf8");
    expect(page).toContain("<title>Terms &amp; Conditions</title>");
    expect(page).toContain("<h1>Terms &amp; Conditions</h1>");
    expect(page).not.toMatch(/<style|style=|<link/);
  });
});

describe("Reactions on a keyboard tap (rule 5.14)", () => {
  let parentId: number;
  beforeEach(() => {
    parentId = store.addParent({ telegramId: ME, firstName: "Wei Lieh", agreed: true });
    store.picks.push({ parentId, nudgeId: 2, frequency: "every_2_days" });
  });
  const say = (text: string, random?: () => number) => handleUpdate(parseUpdate(textUpdate(ME, "Wei Lieh", text, 901)), deps(random));
  const reactions = () => telegram.calls.filter((c) => c.kind === "react");

  it("R1 a keyboard tap that is saved gets one reaction on the parent's own message, picked at random from the set", async () => {
    await say("✅ Showing affection", () => 0);
    expect(reactions()).toEqual([{ kind: "react", chatId: ME, messageId: 901, emoji: REACTION_EMOJI[0] }]);
    telegram = new FakeTelegram();
    store.logs.length = 0;
    await handleUpdate(parseUpdate(textUpdate(ME, "Wei Lieh", "✅ Showing affection", 902)), deps(() => 0.999));
    expect(reactions()).toEqual([{ kind: "react", chatId: ME, messageId: 902, emoji: REACTION_EMOJI.at(-1) }]);
  });

  it("R2 nothing else gets a reaction: typed text, a /log choice, ✅ Done, or a keyboard tap already saved", async () => {
    await say("Hugged Mia this morning");
    await say("/log");
    await handleUpdate(parseUpdate(tapUpdate(ME, "log:2", 70)), deps());
    store.recordNudgeSent({ parentId, nudgeId: 2, exampleId: 21, day: today, slotMinute: 1140, telegramMessageId: 777 });
    await handleUpdate(parseUpdate(tapUpdate(ME, `done:${today}:1140`, 777)), deps());
    await say("✅ Showing affection"); // update 901
    telegram = new FakeTelegram();
    await say("✅ Showing affection"); // update 901 again: Telegram resent it, already saved
    expect(reactions()).toEqual([]);
  });

  it("R3 if the reaction fails, the log is still saved and the receipt still sent; the failure is only written to the log", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void lines.push(args.map(String).join(" ")));
    telegram.failReactions = true;
    await say("✅ Showing affection");
    expect(store.logs).toHaveLength(1);
    expect(telegram.sentTexts()).toEqual([WORDS.receipt("Showing affection")]);
    expect(lines.join("\n")).toContain("reaction");
  });

  it("R4 the set is exactly the nine emoji the owner chose", () => {
    expect([...REACTION_EMOJI]).toEqual(["❤", "🥰", "🤗", "👏", "💯", "🏆", "🎉", "🔥", "🤩"]);
  });
});
