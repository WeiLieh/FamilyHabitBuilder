// =============================================================================
// tests/telegram-bot-start-now.test.ts: screens 10 ("Start right now") and 11 ("All set")
//
// [2026-11-12] What a person sees right after tapping "✅ I agree"
// (src/telegram-bot/SPEC.md, "Recorded: group A finished", Q3). Until the
// planner is live (pull request 3), the only reminder is the 7:00 pm one, so
// that is the time these screens state (owner's decision D1, 12 Nov). The
// numbers in the test names are the owner's agreed test list of 12 Nov.
// =============================================================================

import { beforeEach, describe, expect, it } from "vitest";
import { handleUpdate } from "../src/telegram-bot/handle-update.js";
import { parseUpdate } from "../src/telegram-bot/updates.js";
import { sgtInstant } from "../src/sgt.js";
import { DELIBERATE, FakeStore, QUICK } from "./helpers/datastore-fake-store.js";
import { FakeTelegram, tapUpdate } from "./helpers/telegram-bot-fakes.js";
import { goTo } from "./helpers/telegram-bot-onboarding.js";

const ME = 4242;
let store: FakeStore;
let telegram: FakeTelegram;
let now = sgtInstant("2026-11-11", 10 * 60); // Wednesday 10:00 am, Singapore time

const deps = () => ({ store, telegram, now });
const tap = (data: string, messageId = 55) => handleUpdate(parseUpdate(tapUpdate(ME, data, messageId)), deps());
const START_LINE = "Start right now, and get on the scoreboard straight away by showing Mia some affection. Give Mia a hug!";
const PAGE = "Your page is here whenever you want to look back. It's empty for now.";

beforeEach(() => {
  store = new FakeStore();
  telegram = new FakeTelegram();
  store.invites.set("WELCOME-1", null);
  now = sgtInstant("2026-11-11", 10 * 60);
});

describe("F. Start right now and All set", () => {
  it("23. with a quick pick, screen 10 shows the fixed line for the first quick behaviour picked, with the first child's name, recorded as its own kind of message", async () => {
    await goTo("finished", deps(), ME, { quick: [QUICK[1]!.id, QUICK[0]!.id] });
    const parentId = store.parents[0]!.id;
    expect(telegram.calls.at(-1)).toMatchObject({
      kind: "send",
      text: START_LINE,
      buttons: [[{ text: "✅ I've started!", data: "start:done" }, { text: "Not now", data: "start:notnow" }]],
    });
    expect(store.startNow).toEqual([{ id: expect.any(Number), parentId, nudgeId: QUICK[1]!.id, day: "2026-11-11" }]);
  });

  it("24. 'I've started!' saves today's log as 'start now', removes the buttons, then the receipt, 'All set' and the page link", async () => {
    await goTo("finished", deps(), ME);
    telegram.calls = [];
    await tap("start:done", 900);
    expect(store.logs).toEqual([expect.objectContaining({ nudgeId: QUICK[1]!.id, day: "2026-11-11", messageId: store.startNow[0]!.id, via: "start_now" })]);
    expect(telegram.calls[0]).toEqual({ kind: "removeButtons", chatId: ME, messageId: 900 });
    expect(telegram.sentTexts()).toEqual(["✅ Saved: Showing affection today.", "You're all set, John. Your next reminder is today at 7:00 pm.", PAGE]);
    const page = telegram.calls.find((c) => c.kind === "send" && c.text === PAGE);
    expect(page).toMatchObject({ buttons: [[{ text: "Open my page ↗", url: "https://family-habit-builder.vercel.app/my-page.html" }]] });
  });

  it("25. a second tap on 'I've started!' saves nothing more", async () => {
    await goTo("finished", deps(), ME);
    await tap("start:done", 900);
    telegram.calls = [];
    await tap("start:done", 900);
    expect(store.logs).toHaveLength(1);
    expect(telegram.calls).toEqual([{ kind: "answer", tapId: expect.any(String), popup: "Already saved." }]);
  });

  it("26. 'Not now' is recorded, then the first reminder's time and 'All set' without a receipt", async () => {
    await goTo("finished", deps(), ME);
    telegram.calls = [];
    await tap("start:notnow", 900);
    expect(store.logs).toEqual([]);
    expect(store.events).toContainEqual(expect.objectContaining({ type: "start_now_not_now" }));
    expect(telegram.calls[0]).toEqual({ kind: "removeButtons", chatId: ME, messageId: 900 });
    expect(telegram.sentTexts()).toEqual([
      "No problem. Your first reminder is today at 7:00 pm.",
      "You're all set, John. Your next reminder is today at 7:00 pm.",
      PAGE,
    ]);
    await tap("start:done", 900); // the other button, if it was still showing
    expect(store.logs).toEqual([]);
    expect(telegram.calls.at(-1)).toMatchObject({ kind: "answer", popup: "Already answered." });
  });

  it("27. with only a deliberate pick, screen 10 is skipped and 'All set' follows the agreement", async () => {
    await goTo("agreement", deps(), ME, { quick: [], deliberate: DELIBERATE[0]!.id });
    telegram.calls = [];
    await tap("agree", 800);
    expect(store.startNow).toEqual([]);
    expect(telegram.sentTexts()).toEqual(["You're all set, John. Your next reminder is today at 7:00 pm.", PAGE]);
  });

  it("28. the reminder time is the real 7:00 pm one: 'today' before 7 pm, 'tomorrow' from 7 pm (D1, until pull request 3)", async () => {
    now = sgtInstant("2026-11-11", 19 * 60); // 7:00 pm: tonight's reminder has gone
    await goTo("finished", deps(), ME);
    telegram.calls = [];
    await tap("start:notnow", 900);
    expect(telegram.sentTexts().slice(0, 2)).toEqual([
      "No problem. Your first reminder is tomorrow at 7:00 pm.",
      "You're all set, John. Your next reminder is tomorrow at 7:00 pm.",
    ]);
  });

  it("if recording the start-now message fails, its buttons are replaced by an honest note and sign-up still ends with 'All set'", async () => {
    await goTo("agreement", deps(), ME);
    store.failStartNow = true;
    telegram.calls = [];
    await tap("agree", 800);
    expect(store.parents).toHaveLength(1); // the sign-up itself was saved
    expect(telegram.calls).toContainEqual(expect.objectContaining({ kind: "edit", text: "Sorry, this couldn't be saved, so its buttons won't work." }));
    expect(telegram.sentTexts().slice(-2)).toEqual(["You're all set, John. Your next reminder is today at 7:00 pm.", PAGE]);
  });

  // [2026-11-12] Review fixes F2 to F4 (owner agreed, 12 Nov).
  it("F4. once 'I agree' is saved, a Telegram failure is never reported as 'didn't save' (rule 1.3)", async () => {
    await goTo("agreement", deps(), ME);
    telegram.failEdits = true; // updating the agreement message fails
    telegram.calls = [];
    await tap("agree", 800);
    expect(store.parents).toHaveLength(1);
    expect(telegram.sentTexts()).not.toContain("Sorry, that didn't save. Please try again.");
    expect(telegram.sentTexts()[0]).toBe(START_LINE); // sign-up carries on
  });

  it("F3. if the behaviours can't be read after 'I agree', the parent is told Start right now couldn't be shown, then All set", async () => {
    await goTo("agreement", deps(), ME);
    store.failReadsOf.add("behaviours");
    telegram.calls = [];
    await tap("agree", 800);
    expect(store.parents).toHaveLength(1);
    expect(telegram.sentTexts()).toEqual([
      "Sorry, Start right now couldn't be shown. You're signed up.",
      "You're all set, John. Your next reminder is today at 7:00 pm.",
      PAGE,
    ]);
  });

  it("F2. a missing first name is never shown as a blank: the greeting is left out (rule 1.3)", async () => {
    await goTo("children", deps(), ME);
    delete store.drafts.get(ME)!.answers.first_name; // a damaged draft
    telegram.calls = [];
    await tap("kids:done", 501);
    expect(telegram.sentTexts()).toEqual(["These are quick behaviours. Pick up to 2 to work on."]);
  });

  it("if saving 'I've started!' fails, the person sees 'didn't save' and the buttons stay", async () => {
    await goTo("finished", deps(), ME);
    store.failWrites = true;
    telegram.calls = [];
    await tap("start:done", 900);
    expect(store.logs).toEqual([]);
    expect(telegram.sentTexts()).toEqual(["Sorry, that didn't save. Please try again."]);
    expect(telegram.calls.some((c) => c.kind === "removeButtons")).toBe(false);
  });
});
