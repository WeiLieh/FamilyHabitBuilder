// =============================================================================
// tests/telegram-bot-demo.test.ts: demo mode (the Demo module, rules 12.1 to 12.7), driven through the bot
// (named after the Telegram bot, whose code it calls: structure rule S5)
//
// What it checks: [2026-11-24] the owner-approved tests DM1 to DM13 (24 Nov):
//   DM1 only the owner can start a demo
//   DM2 /demo starts fresh (an earlier demo's photo files and rows go) and shows the real sign-up, no invite
//   DM3 finishing sign-up records the agreement for the demo parent; the Menu gains /next and /demo_stop
//   DM4 during the demo, the owner's messages act on the demo parent; the real account is untouched
//   DM5 the alarm sends nothing to the demo parent, or to the owner while the demo runs
//   DM6 /next: each chosen habit's reminder once, then the summary, then the question, then "the whole week"
//   DM7 a habit logged already is skipped; after Not today, /next goes on to the Wrap Up
//   DM8 every reply works as for a real parent (receipt, photo, "how you felt", 1 to 5, moment, View wrap up)
//   DM9 /mypage opens the demo parent's page
//   DM10 /demo stop deletes everything of the demo (photo files first) and puts the owner back
//   DM11 a message that isn't part of the demo gets the gentle note
//   DM12 /demo while a demo runs starts afresh (with DM2)
//   DM13 a failure to start or end says so, and nothing changes
// =============================================================================

import { beforeEach, describe, expect, it } from "vitest";
import { handleUpdate, type BotDeps } from "../src/telegram-bot/handle-update.js";
import { runScheduler } from "../src/telegram-bot/scheduler.js";
import { parseUpdate } from "../src/telegram-bot/updates.js";
import { sgtInstant } from "../src/sgt.js";
import { DEFAULT_SCHEDULES } from "../src/settings.js";
import { FakeStore } from "./helpers/datastore-fake-store.js";
import { FakeTelegram, photoUpdate, tapUpdate, textUpdate } from "./helpers/telegram-bot-fakes.js";

const OWNER = 4242;
const OTHER = 5151;
const DEMO = -OWNER;
const today = "2026-11-11"; // a Wednesday
const evening = sgtInstant(today, 19 * 60 + 5); // 7:05 pm, inside the real 7:00 pm slot

let store: FakeStore;
let telegram: FakeTelegram;
let ownerId: number;
const deps = (now = evening): BotDeps => {
  store.clock = now;
  return { store, telegram, now, demoOwners: [OWNER] };
};
const say = (text: string, who = OWNER) => handleUpdate(parseUpdate(textUpdate(who, "Wei Lieh", text)), deps());
const tap = (data: string, messageId = 55, who = OWNER) => handleUpdate(parseUpdate(tapUpdate(who, data, messageId)), deps());
const texts = () => telegram.sentTexts();
const lastText = () => texts().at(-1);
const demoParent = () => store.parents.find((p) => p.telegramId === DEMO);

// The real sign-up, after /demo: one child, two quick habits and one deliberate, the default times, "I agree".
async function signUpDemo(): Promise<void> {
  await say("Mia");
  await tap("kids:done");
  await tap("q:2");
  await tap("q:1");
  await tap("q:next");
  await tap("d:5");
  await tap("times:school");
  await tap("times:weekend");
  await tap("plan:ok");
  await tap("agree");
}
const reminderFor = (name: string) => texts().filter((t) => t.startsWith(`<b>${name}</b>`));

beforeEach(() => {
  store = new FakeStore();
  store.today = today;
  telegram = new FakeTelegram();
  // The owner's own account: Showing affection every day, default times.
  ownerId = store.addParent({ telegramId: OWNER, firstName: "Wei Lieh", agreed: true });
  store.picks.push({ parentId: ownerId, nudgeId: 2, frequency: "every_day" });
  store.slots.push({ parentId: ownerId, ...DEFAULT_SCHEDULES });
  store.children.push({ parentId: ownerId, firstName: "Ethan" });
});

describe("Starting and the switch (DM1 to DM5)", () => {
  it("DM1 /demo from anyone but the owner is just an unknown command; nothing is created", async () => {
    store.addParent({ telegramId: OTHER, firstName: "Ann", agreed: true });
    await say("/demo", OTHER);
    expect(lastText()).toBe("Unrecognised text.");
    expect(store.drafts.size).toBe(0);
  });

  it("DM2 and DM12 /demo starts the real sign-up with no invite; a second /demo removes the earlier demo, photo files first", async () => {
    await say("/demo");
    expect(store.drafts.has(DEMO)).toBe(true);
    expect(texts().slice(-2)).toEqual([expect.stringContaining("Wei Lieh"), "<b>What's your child's name?</b>\nType their first name. A nickname works too."]);
    await signUpDemo();
    const first = demoParent()!.id;
    store.photoConsents.push({ parentId: first, answer: "agreed" });
    store.photoFiles.set(`${DEMO}/old.jpg`, new Uint8Array([1]));
    store.photos.push({ id: 999, parentId: first, logId: 1, path: `${DEMO}/old.jpg`, check: "not_checked" });
    await say("/demo");
    expect(store.photoFiles.size).toBe(0);
    expect(demoParent()).toBeUndefined(); // the old demo parent is gone
    expect(store.drafts.has(DEMO)).toBe(true); // and a fresh sign-up has started
  });

  it("DM3 finishing sign-up records the agreement for the demo parent only; 'You're all set' as usual; the Menu gains /next and /demo_stop", async () => {
    const before = store.consents.filter((c) => c.parentId === ownerId).length;
    await say("/demo");
    expect(telegram.calls.find((c) => c.kind === "menu")).toMatchObject({
      commands: expect.arrayContaining([expect.objectContaining({ command: "next" }), expect.objectContaining({ command: "demo_stop" })]),
    });
    await signUpDemo();
    const demo = demoParent()!;
    expect(demo.demoOf).toBe(ownerId);
    expect(store.consents.filter((c) => c.parentId === demo.id && c.topic === "recording")).toHaveLength(1);
    expect(store.consents.filter((c) => c.parentId === ownerId)).toHaveLength(before);
    await tap("start:notnow"); // "Start right now" (screen 10), as in a real sign-up; then "You're all set"
    expect(texts().some((t) => t.startsWith("🎉 <b>You're all set"))).toBe(true);
    expect(telegram.calls.filter((c) => "chatId" in c && c.chatId !== OWNER)).toEqual([]); // every reply in the owner's own chat
  });

  it("DM4 during the demo, a keyboard log is saved for the demo parent; the real account is untouched", async () => {
    await say("/demo");
    await signUpDemo();
    await say("✅ Spending quality time");
    expect(store.logs).toEqual([expect.objectContaining({ parentId: demoParent()!.id, nudgeId: 5 })]);
  });

  it("DM5 the alarm sends nothing to the demo parent or to the owner while the demo runs; after /demo stop, the owner's reminders resume", async () => {
    await say("/demo");
    await signUpDemo();
    telegram.calls = [];
    await runScheduler(deps());
    expect(telegram.calls.filter((c) => c.kind === "send")).toEqual([]);
    await say("/demo stop");
    telegram.calls = [];
    await runScheduler(deps());
    expect(reminderFor("Showing affection")).toHaveLength(1); // the owner's own 7:00 pm reminder
  });
});

describe("The short week (DM6 to DM9)", () => {
  beforeEach(async () => {
    await say("/demo");
    await signUpDemo();
  });

  it("DM6 each /next sends the next step: each habit's reminder once in the order picked, the summary, the question, then 'the whole week'", async () => {
    await say("/next");
    expect(reminderFor("Showing affection")).toHaveLength(1);
    const sent = store.sentNudges.find((n) => n.parentId === demoParent()!.id)!;
    await tap(`done:${today}:${sent.slotMinute}`, sent.telegramMessageId!);
    await say("/next");
    expect(reminderFor("Talking with children")).toHaveLength(1);
    await say("/next");
    expect(reminderFor("Spending quality time")).toHaveLength(1);
    await say("/next");
    expect(lastText()).toMatch(/^<b>Your week, Wei Lieh<\/b>\n\nHabits logged: 1/);
    await say("/next");
    expect(lastText()).toContain("How connected did you feel with your child?");
    await say("/next");
    expect(lastText()).toBe("That's the whole week. Type /demo stop to finish.");
  });

  it("DM7 a habit already logged gets no reminder; after Not today, /next goes on to the Wrap Up", async () => {
    await say("✅ Talking with children"); // logged before its reminder
    await say("/next");
    expect(reminderFor("Showing affection")).toHaveLength(1);
    await say("/next");
    expect(reminderFor("Talking with children")).toHaveLength(0); // rule 3.6
    expect(reminderFor("Spending quality time")).toHaveLength(1);
    const sent = store.sentNudges.filter((n) => n.parentId === demoParent()!.id).at(-1)!;
    await tap(`skip:${today}:${sent.slotMinute}`, sent.telegramMessageId!);
    await say("/next");
    expect(lastText()).toMatch(/^<b>Your week, Wei Lieh<\/b>/);
  });

  it("DM8 every reply works as for a real parent: receipt with the photo line, a photo, 'how you felt', 1 to 5, Add a moment, View wrap up", async () => {
    const demo = demoParent()!;
    await say("/next");
    await say("/next");
    await say("/next"); // Spending quality time (allows photos)
    const sent = store.sentNudges.filter((n) => n.parentId === demo.id).at(-1)!;
    await tap(`done:${today}:${sent.slotMinute}`, sent.telegramMessageId!);
    expect(lastText()).toContain("📷 Send a photo of what you did.");
    store.photoConsents.push({ parentId: demo.id, answer: "agreed" });
    await handleUpdate(parseUpdate(photoUpdate(OWNER, "demo-photo")), deps());
    expect(store.photos).toEqual([expect.objectContaining({ parentId: demo.id })]);
    const logId = store.logs.find((l) => l.parentId === demo.id)!.id;
    await tap(`felt:${logId}`);
    await say("We built a fort");
    expect(store.lines.get(logId)?.text).toBe("We built a fort");
    await say("/next"); // the summary
    await say("/next"); // the question
    const week = "2026-11-09";
    await tap(`conn:${week}:5`, 800);
    expect(store.answers).toEqual([expect.objectContaining({ parentId: demo.id, score: 5 })]);
    await tap("moment:ask");
    await say("Pancakes for dinner");
    expect(store.momentLines).toEqual([expect.objectContaining({ parentId: demo.id, text: "Pancakes for dinner" })]);
    await tap("wrapup:view");
    expect(store.signInLinks).toEqual([expect.objectContaining({ parentId: demo.id })]);
  });

  it("DM9 /mypage during the demo makes a link for the demo parent, not the owner", async () => {
    await say("/mypage");
    expect(store.signInLinks).toEqual([expect.objectContaining({ parentId: demoParent()!.id })]);
  });
});

describe("Ending, the note and failures (DM10, DM11, DM13)", () => {
  it("DM10 /demo stop deletes everything of the demo, photo files first, and puts the owner back (Menu, keyboard, own account)", async () => {
    await say("/demo");
    await signUpDemo();
    const demo = demoParent()!;
    await say("✅ Spending quality time");
    store.photoFiles.set(`${DEMO}/a.jpg`, new Uint8Array([1]));
    store.photos.push({ id: 998, parentId: demo.id, logId: store.logs[0]!.id, path: `${DEMO}/a.jpg`, check: "not_checked" });
    telegram.calls = [];
    await say("/demo stop");
    expect(store.photoFiles.size).toBe(0);
    expect(demoParent()).toBeUndefined();
    expect(store.logs.some((l) => l.parentId === demo.id)).toBe(false);
    expect(telegram.calls).toContainEqual({ kind: "menu", chatId: OWNER, commands: null });
    expect(telegram.calls).toContainEqual(expect.objectContaining({ kind: "send", text: expect.stringContaining("Demo ended"), keyboard: ["✅ Showing affection"] }));
    await say("✅ Showing affection");
    expect(store.logs).toEqual([expect.objectContaining({ parentId: ownerId })]);
  });

  it("DM11 during the demo, a message that isn't part of it gets the gentle note; /next with no demo says none is running", async () => {
    await say("/next");
    expect(lastText()).toBe("No demo is running. Type /demo to start one.");
    await say("/demo");
    await say("/next");
    expect(lastText()).toBe("Finish the demo's sign-up first, then type /next.");
    await signUpDemo();
    await say("hello everyone");
    expect(lastText()).toBe("You're in demo mode. Type /demo stop to go back.");
  });

  it("DM13 if starting or ending the demo fails, the bot says so and nothing changes", async () => {
    store.failDemo = true;
    await say("/demo");
    expect(lastText()).toBe("🙇 Sorry, that didn't work. Please try again.");
    expect(store.drafts.size).toBe(0);
    store.failDemo = false;
    await say("/demo");
    await signUpDemo();
    store.failDemo = true;
    await say("/demo stop");
    expect(lastText()).toBe("🙇 Sorry, that didn't work. Please try again.");
    expect(demoParent()).toBeDefined(); // still in demo mode
  });
});
