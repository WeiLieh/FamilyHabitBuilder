// =============================================================================
// tests/telegram-bot-log-any-time.test.ts: B1, log any time (keyboard, /log, Undo, the Menu)
//
// [2026-11-14] What a parent can do without waiting for a reminder
// (src/telegram-bot/SPEC.md, "Build: B1", tests agreed with the owner on 14 Nov):
//   - K1 to K7: the keyboard under the chat, one button per chosen behaviour (rule 5.1)
//   - U1 to U4: Undo under a keyboard log's receipt, for 10 minutes (rule 5.8, B1-D1)
//   - L1 to L3: /log, the same choice as buttons (rules 5.1, 5.7; no Undo, B1-D5)
//   - M1 to M5: the Menu: /mypage, /settings, /pause, /resume, /help (rule 5.7, B1-D3, B1-D8)
//   - W1, W2: "Welcome back" and Continue remove the earlier copy's buttons (10e addition)
// Each test checks what the parent would see in Telegram and what was saved.
// =============================================================================

import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { handleUpdate, type BotDeps } from "../src/telegram-bot/handle-update.js";
import { menuCommands } from "../src/telegram-bot/menu.js";
import { parseUpdate } from "../src/telegram-bot/updates.js";
import { sgtInstant } from "../src/sgt.js";
import { WEB_PAGES } from "../src/settings.js";
import { FakeStore } from "./helpers/datastore-fake-store.js";
import { FakeTelegram, tapUpdate, textUpdate } from "./helpers/telegram-bot-fakes.js";
import { goTo } from "./helpers/telegram-bot-onboarding.js";

const ME = 4242;
const OTHER = 5151;
const today = "2026-11-11";
const evening = sgtInstant(today, 19 * 60 + 5); // 7:05 pm
const minutesLater = (m: number) => new Date(evening.getTime() + m * 60_000);

let store: FakeStore;
let telegram: FakeTelegram;
let parentId: number;
const deps = (now = evening): BotDeps => ({ store, telegram, now });
const say = (text: string, who = ME) => handleUpdate(parseUpdate(textUpdate(who, "Wei Lieh", text)), deps());
const tap = (data: string, messageId = 55, who = ME) => handleUpdate(parseUpdate(tapUpdate(who, data, messageId)), deps());

// The words the parent sees (drafts are marked in src/telegram-bot/words.ts).
const RECEIPT = "✅ Saved: Showing affection today.";
const AGAIN = "✅ Saved: Showing affection, again today. It counts once for your week.";
const SORRY_SAVE = "Sorry, that didn't save. Please try again.";
const SORRY = "Sorry, that didn't work. Please try again.";
const undoButton = (logId: number) => [[{ text: "Undo", data: `undo:${logId}` }]];

// A Showing affection nudge sent tonight at 7:00 pm, Telegram's message 777.
const sendNudge = () => store.recordNudgeSent({ parentId, nudgeId: 2, exampleId: 21, day: today, slotMinute: 1140, telegramMessageId: 777 });

beforeEach(() => {
  store = new FakeStore();
  store.today = today;
  store.clock = evening;
  telegram = new FakeTelegram();
  // A parent who chose Showing affection (quick) and Spending quality time (deliberate), in that order.
  parentId = store.addParent({ telegramId: ME, firstName: "Wei Lieh", agreed: true });
  store.picks.push({ parentId, nudgeId: 2, frequency: "every_2_days" }, { parentId, nudgeId: 5, frequency: "once_a_week" });
});

describe("The keyboard (rule 5.1)", () => {
  it("K1 'You're all set' brings the keyboard, one '✅ <name>' button per chosen behaviour, in the order picked", async () => {
    const fresh = new FakeStore();
    fresh.invites.set("WELCOME-1", null);
    fresh.today = today;
    const t = new FakeTelegram();
    const d = { store: fresh, telegram: t, now: evening };
    await goTo("finished", d, 7777, { quick: [1, 2], deliberate: 5 });
    await handleUpdate(parseUpdate(tapUpdate(7777, "start:notnow")), d);
    const allSet = t.calls.find((c) => c.kind === "send" && c.text.startsWith("You're all set"));
    expect(allSet).toMatchObject({ keyboard: ["✅ Talking with children", "✅ Showing affection", "✅ Spending quality time"] });
  });

  it("K2 a keyboard tap with no nudge waiting saves today's log (via keyboard) and replies with the receipt and Undo", async () => {
    await say("✅ Showing affection");
    expect(store.logs).toEqual([expect.objectContaining({ parentId, nudgeId: 2, day: today, messageId: null, via: "keyboard" })]);
    expect(telegram.calls).toEqual([{ kind: "send", chatId: ME, text: RECEIPT, buttons: undoButton(store.logs[0]!.id) }]);
  });

  it("K3 a keyboard tap while today's nudge for that behaviour is waiting answers it: linked, its buttons go, the receipt is a new message with Undo", async () => {
    await sendNudge();
    await say("✅ Showing affection");
    expect(store.logs).toEqual([expect.objectContaining({ messageId: store.sentNudges[0]!.id, via: "keyboard" })]);
    expect(telegram.calls).toEqual([
      { kind: "removeButtons", chatId: ME, messageId: 777 },
      { kind: "send", chatId: ME, text: RECEIPT, buttons: undoButton(store.logs[0]!.id) },
    ]);
    // The nudge is answered, so its own ✅ Done button saves nothing more (rule 5.10).
    await tap(`done:${today}:1140`);
    expect(store.logs).toHaveLength(1);
    expect(telegram.calls.at(-1)).toEqual({ kind: "answer", tapId: expect.any(String), popup: "Already saved." });
  });

  it("K4 a second log of the same behaviour today says 'again today' and that it counts once, with Undo", async () => {
    await say("✅ Showing affection");
    await say("✅ Showing affection");
    expect(store.logs).toHaveLength(2);
    expect(telegram.calls.at(-1)).toEqual({ kind: "send", chatId: ME, text: AGAIN, buttons: undoButton(store.logs[1]!.id) });
  });

  it("K5 logging still works after 😴 Not today (the nudge is already answered, so the log is on the parent's own initiative)", async () => {
    await sendNudge();
    await tap(`skip:${today}:1140`);
    telegram.calls = [];
    await say("✅ Showing affection");
    expect(store.logs).toEqual([expect.objectContaining({ nudgeId: 2, messageId: null, via: "keyboard" })]);
    expect(telegram.calls).toEqual([{ kind: "send", chatId: ME, text: RECEIPT, buttons: undoButton(store.logs[0]!.id) }]);
  });

  it("K6 a failed save says so and never shows a receipt (rule 1.3)", async () => {
    store.failWrites = true;
    await say("✅ Showing affection");
    expect(store.logs).toEqual([]);
    expect(telegram.calls).toEqual([{ kind: "send", chatId: ME, text: SORRY_SAVE, buttons: [] }]);
  });

  it("K7 a label for a behaviour not chosen (or any other ✅ text) is not logged: 'Unrecognised text.'", async () => {
    await say("✅ Descriptive praise");
    await say("✅ Hug");
    expect(store.logs).toEqual([]);
    expect(telegram.sentTexts()).toEqual(["Unrecognised text.", "Unrecognised text."]);
  });
});

describe("Undo, for 10 minutes (rule 5.8, B1-D1)", () => {
  it("U1 within 10 minutes: the log is kept and flagged undone, the Undo button goes, 'Undone. It won't count.'", async () => {
    await say("✅ Showing affection");
    const logId = store.logs[0]!.id;
    store.clock = minutesLater(9);
    telegram.calls = [];
    await tap(`undo:${logId}`, 900);
    expect(store.logs).toEqual([expect.objectContaining({ id: logId, undoneAt: minutesLater(9) })]);
    expect(store.events).toContainEqual(expect.objectContaining({ parentId, type: "log_undone" }));
    expect(telegram.calls).toEqual([
      { kind: "removeButtons", chatId: ME, messageId: 900 },
      { kind: "send", chatId: ME, text: "Undone. It won't count.", buttons: [] },
      { kind: "answer", tapId: expect.any(String), popup: null },
    ]);
  });

  it("U2 after 10 minutes: nothing changes, the button is removed on the spot, pop-up 'Undo expired.'", async () => {
    await say("✅ Showing affection");
    store.clock = minutesLater(11);
    telegram.calls = [];
    await tap(`undo:${store.logs[0]!.id}`, 900);
    expect(store.logs[0]!.undoneAt).toBeNull();
    expect(telegram.calls).toEqual([
      { kind: "removeButtons", chatId: ME, messageId: 900 },
      { kind: "answer", tapId: expect.any(String), popup: "Undo expired." },
    ]);
  });

  it("U3 a failed undo says so, and Undo stays so the parent can try again (rule 1.3)", async () => {
    await say("✅ Showing affection");
    store.failWrites = true;
    telegram.calls = [];
    await tap(`undo:${store.logs[0]!.id}`, 900);
    expect(store.logs[0]!.undoneAt).toBeNull();
    expect(telegram.calls).toEqual([
      { kind: "send", chatId: ME, text: SORRY, buttons: [] },
      { kind: "answer", tapId: expect.any(String), popup: null },
    ]);
  });

  it("U4 only the parent's own log can be undone", async () => {
    const other = store.addParent({ telegramId: OTHER, firstName: "Ann", agreed: true });
    store.picks.push({ parentId: other, nudgeId: 2, frequency: "every_2_days" });
    await say("✅ Showing affection", OTHER);
    telegram.calls = [];
    await tap(`undo:${store.logs[0]!.id}`, 900); // ME taps an Undo carrying the other parent's log
    expect(store.logs[0]!.undoneAt).toBeNull();
    expect(telegram.calls).toEqual([{ kind: "answer", tapId: expect.any(String), popup: null }]);
  });
});

describe("/log (rules 5.1, 5.7)", () => {
  it("L1 /log shows the chosen behaviours; a tap logs (via log_command) with no Undo, and the /log message loses its buttons", async () => {
    await say("/log");
    expect(telegram.calls).toEqual([
      {
        kind: "send",
        chatId: ME,
        text: "Which one did you do today?",
        buttons: [[{ text: "Showing affection", data: "log:2" }], [{ text: "Spending quality time", data: "log:5" }]],
      },
    ]);
    telegram.calls = [];
    await tap("log:2", 901);
    expect(store.logs).toEqual([expect.objectContaining({ nudgeId: 2, messageId: null, via: "log_command" })]);
    expect(telegram.calls).toEqual([
      { kind: "removeButtons", chatId: ME, messageId: 901 },
      { kind: "send", chatId: ME, text: RECEIPT, buttons: [] },
      { kind: "answer", tapId: expect.any(String), popup: null },
    ]);
  });

  it("L2 a /log tap while a nudge is waiting answers it, as K3", async () => {
    await sendNudge();
    await tap("log:2", 901);
    expect(store.logs).toEqual([expect.objectContaining({ messageId: store.sentNudges[0]!.id, via: "log_command" })]);
    expect(telegram.calls.slice(0, 2)).toEqual([
      { kind: "removeButtons", chatId: ME, messageId: 777 },
      { kind: "removeButtons", chatId: ME, messageId: 901 },
    ]);
  });

  it("L3 a /log button for a behaviour not chosen saves nothing", async () => {
    await tap("log:3", 901);
    expect(store.logs).toEqual([]);
    expect(telegram.calls).toEqual([{ kind: "answer", tapId: expect.any(String), popup: null }]);
  });
});

describe("The Menu (rule 5.7, B1-D3, B1-D8)", () => {
  it("M1 /mypage, /settings and /pause reply with a link button to the placeholder page", async () => {
    await say("/mypage");
    await say("/settings");
    await say("/pause");
    expect(telegram.calls).toEqual([
      { kind: "send", chatId: ME, text: "Here's your page.", buttons: [[{ text: "Open my page ↗", url: WEB_PAGES.myPage }]] },
      { kind: "send", chatId: ME, text: "Change your times and habits in Settings.", buttons: [[{ text: "Open Settings ↗", url: WEB_PAGES.settings }]] },
      { kind: "send", chatId: ME, text: "To pause your reminders, open Settings.", buttons: [[{ text: "Open Settings ↗", url: WEB_PAGES.settings }]] },
    ]);
  });

  it("M2 /resume while paused asks 'Resume your reminders?'; ✅ Resume turns them back on and switches the Menu back to /pause", async () => {
    store.parents[0]!.paused = true;
    await say("/resume");
    expect(telegram.calls).toEqual([
      {
        kind: "send",
        chatId: ME,
        text: "Resume your reminders?",
        buttons: [[{ text: "✅ Resume", data: "resume:yes" }, { text: "Cancel", data: "resume:no" }]],
      },
    ]);
    telegram.calls = [];
    await tap("resume:yes", 902);
    expect(store.parents[0]!.paused).toBe(false);
    expect(store.events).toContainEqual(expect.objectContaining({ parentId, type: "settings_changed" }));
    expect(telegram.calls).toEqual([
      { kind: "removeButtons", chatId: ME, messageId: 902 },
      { kind: "send", chatId: ME, text: "✅ Your reminders are back on.", buttons: [] },
      { kind: "menu", chatId: ME, commands: null }, // back to everyone's default Menu
      { kind: "answer", tapId: expect.any(String), popup: null },
    ]);
  });

  it("M2 Cancel keeps reminders paused; /resume while not paused says they are already on", async () => {
    store.parents[0]!.paused = true;
    await tap("resume:no", 902);
    expect(store.parents[0]!.paused).toBe(true);
    expect(telegram.sentTexts()).toEqual(["OK, your reminders stay paused."]);
    store.parents[0]!.paused = false;
    await say("/resume");
    expect(telegram.sentTexts().at(-1)).toBe("Your reminders are already on.");
  });

  it("M2 a failed resume says so and keeps the buttons (rule 1.3)", async () => {
    store.parents[0]!.paused = true;
    store.failWrites = true;
    await tap("resume:yes", 902);
    expect(store.parents[0]!.paused).toBe(true);
    expect(telegram.calls).toEqual([
      { kind: "send", chatId: ME, text: SORRY, buttons: [] },
      { kind: "answer", tapId: expect.any(String), popup: null },
    ]);
  });

  it("M3 /help replies with the help text and brings back the keyboard", async () => {
    await say("/help");
    expect(telegram.calls).toEqual([
      {
        kind: "send",
        chatId: ME,
        text:
          "How this works:\n• Tap a behaviour on the keyboard below to log it for today.\n• Reminders come at your chosen times. Tap ✅ Done or 😴 Not today.\n• Menu: /log to log · /mypage your page · /settings your times and habits · /pause and /resume your reminders.",
        buttons: [],
        keyboard: ["✅ Showing affection", "✅ Spending quality time"],
      },
    ]);
  });

  it("M4 the plain words work too, in any capitals; a command with extra words gets 'Unrecognised text.'", async () => {
    await say("LOG");
    await say("Help");
    await say(" mypage ");
    await say("/log hug");
    expect(telegram.sentTexts()).toEqual([
      "Which one did you do today?",
      expect.stringMatching(/^How this works:/),
      "Here's your page.",
      "Unrecognised text.",
    ]);
  });

  it("M5 the default Menu is /log, /mypage, /settings, /pause, /help; a paused person's shows /resume instead of /pause", async () => {
    expect(menuCommands(false).map((c) => c.command)).toEqual(["log", "mypage", "settings", "pause", "help"]);
    expect(menuCommands(true).map((c) => c.command)).toEqual(["log", "mypage", "settings", "resume", "help"]);
    // The owner sets the default Menu once in BotFather (UAT-b1.md, S3): those lines must match the code's.
    const uat = readFileSync("src/telegram-bot/UAT-b1.md", "utf8");
    for (const c of menuCommands(false)) expect(uat).toContain(`\n  ${c.command} - ${c.description}\n`);
    // Typed anyway while paused: /pause says so, and that person's Menu switches to /resume.
    store.parents[0]!.paused = true;
    await say("/pause");
    expect(telegram.calls).toEqual([
      { kind: "send", chatId: ME, text: "Your reminders are already paused.", buttons: [] },
      { kind: "menu", chatId: ME, commands: menuCommands(true) },
    ]);
  });
});

describe("Welcome back removes the earlier copy's buttons (10e addition)", () => {
  let s: FakeStore;
  let t: FakeTelegram;
  const NEW = 8888;
  beforeEach(() => {
    s = new FakeStore();
    s.invites.set("WELCOME-1", null);
    t = new FakeTelegram();
  });

  it("W1 /start again halfway: the earlier copy of the screen loses its buttons, then 'Welcome back!' and the screen again", async () => {
    const d = { store: s, telegram: t, now: evening };
    await goTo("children", d, NEW);
    const earlier = t.lastSentId;
    t.calls = [];
    await handleUpdate(parseUpdate(textUpdate(NEW, "John", "/start WELCOME-1")), d);
    expect(t.calls).toEqual([
      { kind: "removeButtons", chatId: NEW, messageId: earlier },
      { kind: "send", chatId: NEW, text: "Welcome back! Let's carry on.", buttons: [] },
      { kind: "send", chatId: NEW, text: "Mia. Any other children?", buttons: expect.any(Array) },
    ]);
    // The new copy is now the one to clear next time.
    expect(s.drafts.get(NEW)!.screenMessageId).toBe(t.lastSentId);
  });

  it("W2 Continue on the sign-up reminder does the same", async () => {
    const d = { store: s, telegram: t, now: evening };
    await goTo("quick", d, NEW);
    const earlier = t.lastSentId;
    t.calls = [];
    await handleUpdate(parseUpdate(tapUpdate(NEW, "signup:continue", 950)), d);
    expect(t.calls.filter((c) => c.kind !== "answer").slice(0, 2)).toEqual([
      { kind: "removeButtons", chatId: NEW, messageId: earlier },
      { kind: "send", chatId: NEW, text: "Welcome back! Let's carry on.", buttons: [] },
    ]);
  });
});
