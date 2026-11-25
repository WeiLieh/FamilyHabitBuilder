// =============================================================================
// tests/telegram-bot-log-any-time.test.ts: B1, log any time (keyboard, /log, Undo, the Menu)
//
// [2026-11-14] What a parent can do without waiting for a reminder
// (src/telegram-bot/SPEC.md, "Build: B1", tests agreed with the owner on 14 Nov):
//   - K1 to K7: the keyboard under the chat, one button per chosen behaviour (rule 5.1);
//     [2026-11-14] K8 to K10 added after the B1 reviews (owner chose these fixes)
//   - U1 to U4: Undo under a keyboard log's receipt, for 10 minutes (rule 5.8, B1-D1)
//   - L1 to L3: /log, the same choice as buttons (rules 5.1, 5.7; no Undo, B1-D5)
//   - M1 to M5: the Menu: /mypage, /settings, /pause, /resume, /help (rule 5.7, B1-D3, B1-D8)
//   - [2026-11-15] WA1: /mypage sends a new one-time sign-in link to the Web app (rule 9.3; the owner's test W1)
//   - W1, W2: "Welcome back" and Continue remove the earlier copy's buttons (10e addition)
// Each test checks what the parent would see in Telegram and what was saved.
// =============================================================================

import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { handleUpdate, type BotDeps } from "../src/telegram-bot/handle-update.js";
import { menuCommands, tellPauseChange } from "../src/telegram-bot/menu.js";
import { parseUpdate } from "../src/telegram-bot/updates.js";
import { createHash } from "node:crypto";
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
const RECEIPT = "✅ <b>Saved</b>\nShowing affection today.";
const AGAIN = "✅ <b>Saved</b>\nShowing affection, again today.\nIt counts once for your week.";
const SORRY_SAVE = "🙇 Sorry, that didn't save. Please try again.";
const SORRY = "🙇 Sorry, that didn't work. Please try again.";
// [2026-11-24] Rewritten (rule 5.3, F1): a keyboard receipt has Undo and, below it, "Add how you felt" (K2 to K5, K9 use it).
const undoButton = (logId: number) => [[{ text: "Undo", data: `undo:${logId}` }], [{ text: "Add how you felt", data: `felt:${logId}` }]];
// [2026-11-15] Rule 5.14: a saved keyboard tap also gets one reaction on the parent's message (checked in detail by R1 to R4 in tests/telegram-bot-style-c.test.ts).
const REACTION = { kind: "react", chatId: ME, messageId: expect.any(Number), emoji: expect.any(String) };
const lastSend = () => telegram.calls.filter((c) => c.kind === "send").at(-1);

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
    const allSet = t.calls.find((c) => c.kind === "send" && c.text.startsWith("🎉 <b>You're all set"));
    expect(allSet).toMatchObject({ keyboard: ["✅ Talking with children", "✅ Showing affection", "✅ Spending quality time"] });
  });

  it("K2 a keyboard tap with no nudge waiting saves today's log (via keyboard) and replies with the receipt and Undo", async () => {
    await say("✅ Showing affection");
    expect(store.logs).toEqual([expect.objectContaining({ parentId, nudgeId: 2, day: today, messageId: null, via: "keyboard" })]);
    expect(telegram.calls).toEqual([{ kind: "send", chatId: ME, text: RECEIPT, buttons: undoButton(store.logs[0]!.id) }, REACTION]);
  });

  it("K3 a keyboard tap while today's nudge for that behaviour is waiting answers it: linked, its buttons go, the receipt is a new message with Undo", async () => {
    await sendNudge();
    await say("✅ Showing affection");
    expect(store.logs).toEqual([expect.objectContaining({ messageId: store.sentNudges[0]!.id, via: "keyboard" })]);
    expect(telegram.calls).toEqual([
      { kind: "removeButtons", chatId: ME, messageId: 777 },
      { kind: "send", chatId: ME, text: RECEIPT, buttons: undoButton(store.logs[0]!.id) },
      REACTION,
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
    expect(lastSend()).toEqual({ kind: "send", chatId: ME, text: AGAIN, buttons: undoButton(store.logs[1]!.id) });
  });

  it("K5 logging still works after 😴 Not today (the nudge is already answered, so the log is on the parent's own initiative)", async () => {
    await sendNudge();
    await tap(`skip:${today}:1140`);
    telegram.calls = [];
    await say("✅ Showing affection");
    expect(store.logs).toEqual([expect.objectContaining({ nudgeId: 2, messageId: null, via: "keyboard" })]);
    expect(telegram.calls).toEqual([{ kind: "send", chatId: ME, text: RECEIPT, buttons: undoButton(store.logs[0]!.id) }, REACTION]);
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

describe("Keyboard, after the B1 review (owner, 14 Nov)", () => {
  it("K8 the same keyboard message saved twice (Telegram resent it) replies 'Already saved.', never a second receipt", async () => {
    await handleUpdate(parseUpdate(textUpdate(ME, "Wei Lieh", "✅ Showing affection", 9999)), deps());
    await handleUpdate(parseUpdate(textUpdate(ME, "Wei Lieh", "✅ Showing affection", 9999)), deps());
    expect(store.logs).toHaveLength(1);
    expect(telegram.sentTexts()).toEqual([RECEIPT, "Already saved."]);
  });

  it("K9 a nudge sent before migration 010 (no Telegram number) is still answered; only its buttons can't be removed", async () => {
    await store.recordNudgeSent({ parentId, nudgeId: 2, exampleId: 21, day: today, slotMinute: 1140 });
    await say("✅ Showing affection");
    expect(store.logs).toEqual([expect.objectContaining({ messageId: store.sentNudges[0]!.id })]);
    expect(telegram.calls).toEqual([{ kind: "send", chatId: ME, text: RECEIPT, buttons: undoButton(store.logs[0]!.id) }, REACTION]);
  });

  it("K10 once saved, a Telegram failure removing the nudge's buttons never says 'didn't save' (rule 1.3)", async () => {
    await sendNudge();
    telegram.failRemoveButtons = true;
    await say("✅ Showing affection");
    expect(store.logs).toHaveLength(1);
    expect(telegram.sentTexts()).toEqual([RECEIPT]);
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
        text: "<b>Which one did you do today?</b>",
        buttons: [[{ text: "Showing affection", data: "log:2" }], [{ text: "Spending quality time", data: "log:5" }]],
      },
    ]);
    telegram.calls = [];
    await tap("log:2", 901);
    expect(store.logs).toEqual([expect.objectContaining({ nudgeId: 2, messageId: null, via: "log_command" })]);
    expect(telegram.calls).toEqual([
      { kind: "removeButtons", chatId: ME, messageId: 901 },
      // [2026-11-24] Rewritten (rule 5.3, F1): no Undo, but "Add how you felt".
      { kind: "send", chatId: ME, text: RECEIPT, buttons: [[{ text: "Add how you felt", data: `felt:${store.logs[0]!.id}` }]] },
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
  // [2026-11-15] Rewritten (Web app sign-in, rule 9.3): /mypage now sends a one-time sign-in link (W1 below), so it left this test.
  // [2026-11-25] Rewritten (rule 9.9, owner-approved tests PZ1 to PZ4): Settings is built, so /settings sends a
  // one-time sign-in link that opens Settings, and /pause now pauses in Telegram (owner: "both ways").
  it("M1 /settings sends a one-time sign-in link that opens Settings; only its fingerprint is stored", async () => {
    await say("/settings");
    const send = telegram.calls[0] as { kind: "send"; text: string; buttons: { text: string; url: string }[][] };
    expect(send.text).toBe("Change your times and habits in Settings.");
    expect(send.buttons[0]![0]!.text).toBe("Open Settings ↗");
    const url = send.buttons[0]![0]!.url;
    expect(url.startsWith(`${WEB_PAGES.signIn}&next=settings#`)).toBe(true);
    const secret = url.split("#")[1]!;
    expect(store.signInLinks).toEqual([{ parentId, fingerprint: createHash("sha256").update(secret).digest("hex") }]);
  });

  it("PZ1 /pause, or typing 'pause', asks 'Pause your reminders?' with ⏸ Pause and Cancel", async () => {
    await say("/pause");
    await say("Pause");
    const question = {
      kind: "send",
      chatId: ME,
      text: "<b>Pause your reminders?</b>",
      buttons: [[{ text: "⏸ Pause", data: "pause:yes" }, { text: "Cancel", data: "pause:no" }]],
    };
    expect(telegram.calls).toEqual([question, question]);
    expect(store.parents[0]!.paused).toBe(false);
  });

  it("PZ2 ⏸ Pause pauses, says so, and the Menu shows /resume; Cancel keeps reminders on", async () => {
    await tap("pause:yes", 903);
    expect(store.parents[0]!.paused).toBe(true);
    expect(store.events).toContainEqual(expect.objectContaining({ parentId, type: "settings_changed" }));
    expect(telegram.calls).toEqual([
      { kind: "removeButtons", chatId: ME, messageId: 903 },
      { kind: "send", chatId: ME, text: "⏸ <b>Your reminders are paused.</b>\nSend /resume any time to restart them.", buttons: [] },
      { kind: "menu", chatId: ME, commands: menuCommands(true) },
      { kind: "answer", tapId: expect.any(String), popup: null },
    ]);
    store.parents[0]!.paused = false;
    telegram.calls = [];
    await tap("pause:no", 904);
    expect(store.parents[0]!.paused).toBe(false);
    expect(telegram.sentTexts()).toEqual(["OK, your reminders stay on."]);
  });

  it("PZ3 a pause or resume made in Settings is told in Telegram, and the Menu follows", async () => {
    await tellPauseChange(telegram, ME, true);
    await tellPauseChange(telegram, ME, false);
    expect(telegram.calls).toEqual([
      { kind: "send", chatId: ME, text: "⏸ <b>Your reminders are paused.</b>\nSend /resume any time to restart them.", buttons: [] },
      { kind: "menu", chatId: ME, commands: menuCommands(true) },
      { kind: "send", chatId: ME, text: "✅ <b>Your reminders are back on.</b>", buttons: [] },
      { kind: "menu", chatId: ME, commands: null },
    ]);
  });

  it("PZ4 a pause that doesn't save says so, keeps the buttons, and leaves the Menu alone (rule 1.3)", async () => {
    store.failWrites = true;
    await tap("pause:yes", 903);
    expect(store.parents[0]!.paused).toBe(false);
    expect(telegram.calls).toEqual([
      { kind: "send", chatId: ME, text: SORRY, buttons: [] },
      { kind: "answer", tapId: expect.any(String), popup: null },
    ]);
  });

  // [2026-11-15] New (rule 9.3, owner-approved test W1, named WA1 here: this file's W1 and W2 are "Welcome back"): each /mypage makes a new
  // link that works once; the secret travels only after the "#" (browsers never
  // send that part to a server, so it can't land in server logs), and the
  // database is given only its fingerprint.
  it("WA1 each /mypage sends a new one-time sign-in link; only its fingerprint is stored", async () => {
    await say("/mypage");
    await say("/mypage");
    const sends = telegram.calls.filter((c) => c.kind === "send");
    expect(sends).toHaveLength(2);
    const urls = sends.map((c) => /"url":"([^"]+)"/.exec(JSON.stringify(c))?.[1] ?? "");
    const secrets = urls.map((u) => u.split("#")[1] ?? "");
    for (const [i, url] of urls.entries()) {
      expect(sends[i]).toMatchObject({ text: "Here's your page.", buttons: [[{ text: "Open my page ↗" }]] });
      expect(url.startsWith(`${WEB_PAGES.signIn}#`)).toBe(true);
      expect(secrets[i]).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
    expect(secrets[0]).not.toBe(secrets[1]);
    expect(store.signInLinks).toEqual(secrets.map((secret) => ({ parentId, fingerprint: createHash("sha256").update(secret).digest("hex") })));
    expect(JSON.stringify(store.signInLinks)).not.toContain(secrets[0]);
  });

  it("WA1 if the link can't be saved, /mypage says it didn't work and sends no link (rule 1.3)", async () => {
    store.failWrites = true;
    await say("/mypage");
    expect(telegram.calls).toEqual([{ kind: "send", chatId: ME, text: SORRY, buttons: [] }]);
  });

  it("M2 /resume while paused asks 'Resume your reminders?'; ✅ Resume turns them back on and switches the Menu back to /pause", async () => {
    store.parents[0]!.paused = true;
    await say("/resume");
    expect(telegram.calls).toEqual([
      {
        kind: "send",
        chatId: ME,
        text: "<b>Resume your reminders?</b>",
        buttons: [[{ text: "✅ Resume", data: "resume:yes" }, { text: "Cancel", data: "resume:no" }]],
      },
    ]);
    telegram.calls = [];
    await tap("resume:yes", 902);
    expect(store.parents[0]!.paused).toBe(false);
    expect(store.events).toContainEqual(expect.objectContaining({ parentId, type: "settings_changed" }));
    expect(telegram.calls).toEqual([
      { kind: "removeButtons", chatId: ME, messageId: 902 },
      { kind: "send", chatId: ME, text: "✅ <b>Your reminders are back on.</b>", buttons: [] },
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
          "<b>How this works</b>\n\n✍️ <b>Log:</b> tap a habit on the keyboard below.\n\n⏰ <b>Reminders</b> come at your chosen times.\nTap ✅ Done or 😴 Not today.\n\n☰ <b>Menu</b>\n/log · log a habit\n/mypage · your page\n/settings · your times and habits\n/pause · /resume · your reminders",
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
      "<b>Which one did you do today?</b>",
      expect.stringMatching(/^<b>How this works<\/b>/),
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
      { kind: "send", chatId: NEW, text: "👋 <b>Welcome back!</b> Let's carry on.", buttons: [] },
      { kind: "send", chatId: NEW, text: "<b>Mia.</b> Any other children?", buttons: expect.any(Array) },
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
      { kind: "send", chatId: NEW, text: "👋 <b>Welcome back!</b> Let's carry on.", buttons: [] },
    ]);
  });
});
