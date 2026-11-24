// =============================================================================
// tests/telegram-bot-sunday.test.ts: the Sunday Wrap Up, the 1 to 5 question and "Add a moment"
//
// What it checks: [2026-11-24] the owner-approved tests W1 to W12 (24 Nov;
// rules 3.12, 3.15, 5.6, 7.7, 7.8; defaults D6 to D8):
//   W1 the summary and the question on Sunday at the Wrap Up time
//   W2 no activity: only the question
//   W3 paused, not Sunday, too early, not agreed: nothing; once a week only
//   W4 a nudge in the same run goes first, then the summary, then the question
//   W5 a tap saves the answer and edits the message ("Answered: 4, …")
//   W6 a second tap is ignored; after 24 hours "This question has closed."
//   W7 after 24 hours the question is edited once to "Question expired"
//   W8 "Add a moment": the prompt; one photo and one line saved; the receipt
//   W9 other prompts win; commands, keyboard and forwards are never a moment
//   W10 after 24 hours: "Moment has expired…" with the button again
//   W11 "View wrap up" sends a fresh My page link
//   W12 failures: a refused send isn't recorded; a failed save says so
// The days: Sunday 22 Nov 2026 is the Wrap Up day (week of Monday 16 Nov).
// =============================================================================

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleUpdate } from "../src/telegram-bot/handle-update.js";
import { runScheduler } from "../src/telegram-bot/scheduler.js";
import { parseUpdate } from "../src/telegram-bot/updates.js";
import { sgtInstant } from "../src/sgt.js";
import { FakeStore } from "./helpers/datastore-fake-store.js";
import { FakeTelegram, forwardedUpdate, photoUpdate, tapUpdate, textUpdate } from "./helpers/telegram-bot-fakes.js";

const ME = 4242;
const SUNDAY = "2026-11-22";
const WEEK = "2026-11-16";
const at = (day: string, minutes: number) => sgtInstant(day, minutes);
const eightPm = at(SUNDAY, 20 * 60 + 2);
const hoursAfter = (h: number, from = eightPm) => new Date(from.getTime() + h * 3600_000);

let store: FakeStore;
let telegram: FakeTelegram;
let parentId: number;
// Every step moves the pretend database's clock too.
const deps = (now: Date) => {
  store.clock = now;
  store.today = new Date(now.getTime() + 8 * 3600_000).toISOString().slice(0, 10);
  return { store, telegram, now };
};
const run = (now = eightPm) => runScheduler(deps(now));
const tap = (data: string, now = eightPm, messageId = 55) => handleUpdate(parseUpdate(tapUpdate(ME, data, messageId)), deps(now));
const say = (text: string, now = eightPm) => handleUpdate(parseUpdate(textUpdate(ME, "Wei Lieh", text)), deps(now));
const sendPhoto = (fileId: string, now = eightPm) => handleUpdate(parseUpdate(photoUpdate(ME, fileId)), deps(now));
const sends = () => telegram.calls.filter((c) => c.kind === "send") as { text: string; buttons: unknown }[];
const lastText = () => telegram.sentTexts().at(-1);

const SUMMARY_BUTTONS = [[{ text: "Add a moment from this week", data: "moment:ask" }], [{ text: "View wrap up", data: "wrapup:view" }]];
const QUESTION = "<b>How connected did you feel with your child?</b>\n(1 = not much, 5 = very)\n\n<i>Question expires in 24 hrs</i>";
const QUESTION_BUTTONS = [[1, 2, 3, 4, 5].map((n) => ({ text: String(n), data: `conn:${WEEK}:${n}` }))];
const SAVED = "✅ Saved as this week's moment.";
const EXPIRED_MOMENT = "Moment has expired. Tap Add a moment from this week to try again.";

// A log this week, added as the database would have it.
let nextUpdate = 70_000;
const addLog = (day: string, nudgeId = 2, loggedAt = at(day, 9 * 60)) => {
  const id = 9000 + store.logs.length;
  store.logs.push({ id, parentId, nudgeId, day, messageId: null, updateId: ++nextUpdate, via: "keyboard", loggedAt, undoneAt: null });
  return id;
};

beforeEach(() => {
  store = new FakeStore();
  telegram = new FakeTelegram();
  parentId = store.addParent({ telegramId: ME, firstName: "John", agreed: true });
  store.picks.push({ parentId, nudgeId: 2, frequency: "every_day" }, { parentId, nudgeId: 5, frequency: "once_a_week" });
});
afterEach(() => vi.restoreAllMocks());

describe("Sending on Sunday (W1 to W4)", () => {
  it("W1 with activity: the summary (days logged, feelings, photos; two buttons), then the question as its own message, both recorded", async () => {
    const a = addLog("2026-11-17");
    addLog("2026-11-17"); // the same day twice: still one day
    addLog("2026-11-19", 5);
    store.lines.set(a, { text: "A line", updateId: 1 });
    store.photoConsents.push({ parentId, answer: "agreed" });
    store.photos.push({ id: 1, parentId, logId: a, path: "x.jpg", check: "not_checked" });
    await run();
    expect(sends()).toEqual([
      { kind: "send", chatId: ME, text: "<b>Your week, John</b>\n\nHabits logged: 2\nFeelings logged: 1\nPhotos: 1", buttons: SUMMARY_BUTTONS },
      { kind: "send", chatId: ME, text: QUESTION, buttons: QUESTION_BUTTONS },
    ]);
    expect(store.sundaySent.map((m) => m.kind)).toEqual(["wrap_up", "connection_question"]);
  });

  it("W2 with no activity that week, only the question is sent", async () => {
    addLog("2026-11-12"); // last week
    await run();
    expect(sends()).toEqual([{ kind: "send", chatId: ME, text: QUESTION, buttons: QUESTION_BUTTONS }]);
  });

  it("W3 (review) on the other six days, Sunday's data isn't read at all", async () => {
    store.failReadsOf.add("sundayData"); // would count as a failure if it were asked
    const r = await run(at("2026-11-21", 21 * 60)); // Saturday
    expect(r.failed).toBe(0);
  });

  it("W3 nothing when paused, not Sunday, before the time or not agreed; later that Sunday is fine; once a week only", async () => {
    addLog("2026-11-17");
    await run(at(SUNDAY, 19 * 60 + 55)); // before 8:00 pm
    await run(at("2026-11-21", 21 * 60)); // Saturday
    expect(sends()).toEqual([]);
    store.parents[0]!.paused = true;
    await run();
    expect(sends()).toEqual([]);
    store.parents[0]!.paused = false;
    await run(at(SUNDAY, 22 * 60)); // late alarm, still Sunday
    expect(sends()).toHaveLength(2);
    await run(at(SUNDAY, 22 * 60 + 10));
    expect(sends()).toHaveLength(2); // once a week
    const other = store.addParent({ telegramId: 777, firstName: "Ann", agreed: false });
    store.logs.push({ id: 1, parentId: other, nudgeId: 2, day: "2026-11-17", messageId: null, updateId: 1, via: "keyboard", undoneAt: null });
    await run(at(SUNDAY, 22 * 60 + 20));
    expect(telegram.calls.some((c) => c.kind === "send" && c.chatId === 777)).toBe(false);
  });

  it("W4 a nudge due in the same run goes first, then the summary, then the question (rule 3.15)", async () => {
    store.slots.push({ parentId, school: [], nonSchool: [20 * 60] });
    store.children.push({ parentId, firstName: "Mia" });
    store.examples.set(2, [{ id: 21, active: true, example: "Give a long hug." }]);
    addLog("2026-11-18", 5);
    await run();
    expect(sends().map((s) => s.text.split("\n")[0])).toEqual(["<b>Showing affection</b> · with Mia", "<b>Your week, John</b>", "<b>How connected did you feel with your child?</b>"]);
  });
});

describe("Answering the question (W5 to W7)", () => {
  it("W5 tapping 4 saves it for that week and edits the message: 'Answered: 4, quite connected'; after midnight it names the week", async () => {
    await run();
    await tap(`conn:${WEEK}:4`, hoursAfter(1), 600);
    expect(store.answers).toEqual([{ parentId, week: WEEK, score: 4, updateId: expect.any(Number) }]);
    expect(telegram.calls).toContainEqual({ kind: "edit", chatId: ME, messageId: 600, text: "<b>How connected did you feel with your child?</b>\n(1 = not much, 5 = very)\n\nAnswered: 4, quite connected" });
    store.answers = [];
    await tap(`conn:${WEEK}:2`, hoursAfter(5), 600); // Monday 1:02 am
    expect(telegram.calls.at(-2)).toMatchObject({ kind: "edit", text: expect.stringContaining("Answered (week of Mon 16 Nov)") });
  });

  it("W6 a second tap is ignored (the first counts); after 24 hours a tap isn't saved: 'This question has closed.'", async () => {
    await run();
    await tap(`conn:${WEEK}:3`, hoursAfter(1));
    await tap(`conn:${WEEK}:5`, hoursAfter(2));
    expect(store.answers.map((x) => x.score)).toEqual([3]);
    store.answers = [];
    await tap(`conn:${WEEK}:5`, hoursAfter(25));
    expect(store.answers).toEqual([]);
    expect(telegram.calls.at(-1)).toEqual({ kind: "answer", tapId: expect.any(String), popup: "This question has closed." });
  });

  it("W7 after 24 hours the alarm edits the unanswered question once to 'Question expired'; a failed edit is a failure", async () => {
    await run();
    const questionId = store.sundaySent.find((m) => m.kind === "connection_question")!.telegramMessageId;
    await run(hoursAfter(23));
    expect(telegram.calls.some((c) => c.kind === "edit")).toBe(false);
    await run(hoursAfter(25));
    await run(hoursAfter(26));
    expect(telegram.calls.filter((c) => c.kind === "edit")).toEqual([
      { kind: "edit", chatId: ME, messageId: questionId, text: "<b>How connected did you feel with your child?</b>\n(1 = not much, 5 = very)\n\nQuestion expired" },
    ]);
    // Another week, with a failed edit.
    const errors: string[] = [];
    vi.spyOn(console, "error").mockImplementation((line: string) => void errors.push(line));
    const nextSunday = at("2026-11-29", 20 * 60 + 2);
    await run(nextSunday);
    telegram.failEdits = true;
    const r = await run(hoursAfter(25, nextSunday));
    expect(r.failed).toBeGreaterThan(0);
    expect(errors.join("\n")).toContain("Marking the question expired failed");
  });
});

describe("Add a moment (W8 to W10)", () => {
  beforeEach(async () => {
    addLog("2026-11-17");
    store.photoConsents.push({ parentId, answer: "agreed" });
    await run();
  });

  it("W8 the prompt, then one line and one photo, never checked, each with the receipt; then the window is closed", async () => {
    await tap("moment:ask", hoursAfter(1));
    expect(lastText()).toBe("Send a photo, or type one line about a moment from this week.\n\n<i>Upload within 24 hrs</i>");
    await say("Pancakes on Saturday", hoursAfter(2));
    expect(store.momentLines).toEqual([expect.objectContaining({ week: WEEK, text: "Pancakes on Saturday" })]);
    expect(lastText()).toBe(SAVED);
    await sendPhoto("moment-photo", hoursAfter(3));
    expect(store.momentPhotos).toEqual([expect.objectContaining({ week: WEEK })]);
    expect(lastText()).toBe(SAVED);
    await say("Another line", hoursAfter(4));
    expect(lastText()).toBe("Unrecognised text."); // one photo and one line: closed
    expect(store.momentLines).toHaveLength(1);
  });

  it("W9 other prompts win: a photo log in its 10 minutes and a waiting 'how you felt' line; commands, keyboard and forwards are never a moment", async () => {
    await tap("moment:ask", hoursAfter(1));
    const t = hoursAfter(2);
    await say("✅ Spending quality time", t); // a keyboard log of a behaviour that allows photos
    await sendPhoto("for-the-log", new Date(t.getTime() + 60_000));
    expect(store.photos.at(-1)).toMatchObject({ logId: store.logs.at(-1)!.id });
    await tap(`felt:${store.logs.at(-1)!.id}`, new Date(t.getTime() + 120_000));
    await say("It felt great", new Date(t.getTime() + 180_000));
    expect(store.lines.get(store.logs.at(-1)!.id)?.text).toBe("It felt great");
    await say("/help", new Date(t.getTime() + 240_000));
    await handleUpdate(parseUpdate(forwardedUpdate(ME, "Someone else's moment")), deps(new Date(t.getTime() + 300_000)));
    expect(store.momentLines).toEqual([]);
    expect(store.momentPhotos).toEqual([]);
  });

  it("W10 after 24 hours a photo or line isn't saved: 'Moment has expired…' with the button, which starts a fresh 24 hours", async () => {
    await tap("moment:ask", hoursAfter(1));
    await say("Too late", hoursAfter(26));
    expect(sends().at(-1)).toEqual({ kind: "send", chatId: ME, text: EXPIRED_MOMENT, buttons: [[{ text: "Add a moment from this week", data: "moment:ask" }]] });
    await sendPhoto("late", hoursAfter(26));
    expect(lastText()).toBe(EXPIRED_MOMENT);
    expect(store.momentLines).toEqual([]);
    expect(store.momentPhotos).toEqual([]);
    await tap("moment:ask", hoursAfter(27));
    await say("Now it counts", hoursAfter(28));
    expect(store.momentLines).toEqual([expect.objectContaining({ text: "Now it counts" })]);
  });
});

describe("View wrap up and failures (W11, W12)", () => {
  it("W11 'View wrap up' sends a fresh My page link, the same as /mypage", async () => {
    addLog("2026-11-17");
    await run();
    await tap("wrapup:view", hoursAfter(1));
    expect(store.signInLinks).toHaveLength(1);
    expect(sends().at(-1)).toMatchObject({ text: "Here's your page.", buttons: [[{ text: "Open my page ↗", url: expect.stringMatching(/page=open#/) }]] });
  });

  it("W12 a refused send isn't recorded; a question sent but not recorded says its buttons won't work; failed saves say so", async () => {
    addLog("2026-11-17");
    telegram.failFor.add(ME);
    const r = await run();
    expect(r.failed).toBe(2);
    expect(store.sundaySent).toEqual([]);
    telegram.failFor.delete(ME);
    store.failSundayRecord = true;
    await run(hoursAfter(0.1));
    const edits = telegram.calls.filter((c) => c.kind === "edit").map((c) => (c as { text: string }).text);
    expect(edits).toEqual(["🙇 Sorry, this Wrap Up couldn't be saved, so its buttons won't work.", "🙇 Sorry, this question couldn't be saved, so its buttons won't work."]); // review fix: both say so
    store.failSundayRecord = false;
    await run(hoursAfter(0.2));
    store.failAnswers = true;
    await tap(`conn:${WEEK}:4`, hoursAfter(1));
    expect(lastText()).toBe("🙇 Sorry, that didn't save. Please try again.");
    expect(telegram.calls.some((c) => c.kind === "edit" && c.text.includes("Answered"))).toBe(false);
  });
});
