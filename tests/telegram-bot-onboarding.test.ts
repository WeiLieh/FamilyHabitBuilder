// =============================================================================
// tests/telegram-bot-onboarding.test.ts: sign-up screens 2 to 9, on the sign-up draft
//
// [2026-11-12] What a person sees from opening their invite link to tapping
// "✅ I agree" (src/telegram-bot/SPEC.md, "Recorded: group A finished" and
// "Build: pull request 2, onboarding screens"). Answers are held in a sign-up
// draft and only become a parent at "I agree" (rule 8.13). The numbers in the
// test names are the owner's agreed test list of 12 Nov.
// Uses the pretend Telegram (tests/helpers/telegram-bot-fakes.ts) and database
// (tests/helpers/datastore-fake-store.ts). Screens 10 and 11 are in
// tests/telegram-bot-start-now.test.ts.
// =============================================================================

import { beforeEach, describe, expect, it } from "vitest";
import { handleUpdate } from "../src/telegram-bot/handle-update.js";
import { parseUpdate } from "../src/telegram-bot/updates.js";
import { sgtInstant } from "../src/sgt.js";
import { FakeStore, QUICK, DELIBERATE } from "./helpers/datastore-fake-store.js";
import { FakeTelegram, tapUpdate, textUpdate } from "./helpers/telegram-bot-fakes.js";
import { goTo } from "./helpers/telegram-bot-onboarding.js";

const ME = 4242; // a Telegram user ID
let store: FakeStore;
let telegram: FakeTelegram;
const now = sgtInstant("2026-11-11", 10 * 60); // Wednesday 10:00 am, Singapore time

async function send(body: unknown): Promise<void> {
  await handleUpdate(parseUpdate(body), { store, telegram, now });
}
const type = (text: string) => send(textUpdate(ME, "John", text));
const tap = (data: string, messageId = 55) => send(tapUpdate(ME, data, messageId));
const lastSend = () => [...telegram.calls].reverse().find((c) => c.kind === "send")!;
const buttonTexts = (call: ReturnType<typeof lastSend>) =>
  call.kind === "send" ? call.buttons.flat().map((b) => b.text) : [];

const WELCOME =
  "Thanks for joining, John!\n\nWe'll keep your answers for 7 days while you set up. Nothing is saved for good until you agree.";
const CHILD_QUESTION = "What's your child's name? Type their first name, a nickname works too.";

beforeEach(() => {
  store = new FakeStore();
  telegram = new FakeTelegram();
  store.invites.set("WELCOME-1", null);
});

describe("A. Starting with /start", () => {
  it("1. a valid code is held, a draft starts with the Telegram first name, and screens 2 and 3 are shown; no parent yet", async () => {
    await type("/start WELCOME-1");
    expect(store.parents).toEqual([]); // nothing personal in the real tables (rule 8.13)
    expect(store.holds.get("WELCOME-1")).toBe(ME);
    expect(store.drafts.get(ME)).toEqual({ step: "name", answers: { first_name: "John" } });
    expect(telegram.calls[0]).toMatchObject({ kind: "send", text: WELCOME, buttons: [[{ text: "Change name", data: "name:change" }]] });
    expect(telegram.sentTexts()[1]).toBe(CHILD_QUESTION);
  });

  it("2. no code at all: told it is invite-only, nothing saved", async () => {
    await type("/start");
    expect(store.drafts.size).toBe(0);
    expect(telegram.sentTexts()).toEqual(["Hi! This app is invite-only for now. Please use the invite link you were sent."]);
  });

  it("3. an unknown, used or held code: a polite refusal, nothing saved", async () => {
    store.invites.set("USED-1", 999);
    store.invites.set("HELD-1", null);
    store.holds.set("HELD-1", 777);
    for (const code of ["NOPE", "USED-1", "HELD-1"]) await type(`/start ${code}`);
    expect(store.drafts.size).toBe(0);
    expect(telegram.sentTexts()).toEqual(
      Array(3).fill("Sorry, that invite code doesn't work. Please ask the person who invited you for your own link."),
    );
  });

  it("4. someone halfway who taps any link again: 'Welcome back! Let's carry on.' and the screen they were on; they keep their first code", async () => {
    store.invites.set("WELCOME-2", null);
    await goTo("children", { store, telegram, now }, ME); // has typed one child's name
    telegram.calls = [];
    await type("/start WELCOME-2");
    expect(telegram.sentTexts()).toEqual(["Welcome back! Let's carry on.", "Mia. Any other children?"]);
    expect(store.holds.get("WELCOME-1")).toBe(ME);
    expect(store.holds.has("WELCOME-2")).toBe(false);
  });

  it("5. someone already signed up: 'You're already signed up.'", async () => {
    await goTo("finished", { store, telegram, now }, ME);
    telegram.calls = [];
    await type("/start WELCOME-1");
    expect(store.parents).toHaveLength(1);
    expect(telegram.sentTexts()).toEqual(["You're already signed up."]);
  });

  it("6. the database fails at /start: an honest 'didn't work', nothing saved (rule 1.3)", async () => {
    store.failReads = true;
    await type("/start WELCOME-1");
    store.failReads = false;
    store.failWrites = true;
    await type("/start WELCOME-1");
    expect(store.drafts.size).toBe(0);
    expect(telegram.sentTexts()).toEqual(["Sorry, that didn't work. Please try again.", "Sorry, that didn't work. Please try again."]);
  });

  it("ignores a /start without a first name, rather than saving a made-up name", async () => {
    const body = textUpdate(ME, "John", "/start WELCOME-1") as { message: { from: { first_name?: string } } };
    delete body.message.from.first_name;
    await send(body);
    expect(store.drafts.size).toBe(0);
    expect(telegram.calls).toEqual([]);
  });
});

describe("B. Name and children", () => {
  it("7. Change name asks for the name; the typed name is saved and thanked, then the child question again", async () => {
    await type("/start WELCOME-1");
    await tap("name:change", 500);
    expect(telegram.calls).toContainEqual({ kind: "removeButtons", chatId: ME, messageId: 500 });
    expect(lastSend()).toMatchObject({ text: "What should we call you? Type your first name." });
    await type("  Wei  ");
    expect(store.drafts.get(ME)?.answers.first_name).toBe("Wei");
    expect(telegram.sentTexts().slice(-2)).toEqual(["Thanks, Wei!", CHILD_QUESTION]);
  });

  it("8. a name over 40 characters is politely refused and asked for again; nothing is saved", async () => {
    await type("/start WELCOME-1");
    await type("A".repeat(41));
    expect(store.drafts.get(ME)?.answers.children).toBeUndefined();
    expect(lastSend()).toMatchObject({ text: "Please type a name of up to 40 characters." });
    await tap("name:change", 500);
    await type("B".repeat(41));
    expect(store.drafts.get(ME)?.answers.first_name).toBe("John");
  });

  it("9. a child's name gives 'Mia. Any other children?' with two buttons", async () => {
    await type("/start WELCOME-1");
    await type("Mia");
    expect(store.drafts.get(ME)).toMatchObject({ step: "children", answers: { children: ["Mia"] } });
    expect(lastSend()).toMatchObject({
      text: "Mia. Any other children?",
      buttons: [[{ text: "+ Add another child", data: "kids:add" }, { text: "That's all", data: "kids:done" }]],
    });
  });

  it("10. adding a second child asks for the other name, then lists both", async () => {
    await type("/start WELCOME-1");
    await type("Mia");
    await tap("kids:add", 502);
    expect(lastSend()).toMatchObject({ text: "What's your other child's name?" });
    await type("Leo");
    expect(lastSend()).toMatchObject({ text: "Mia and Leo. Any other children?" });
  });

  it("11. after the third child, only 'That's all' is offered", async () => {
    await type("/start WELCOME-1");
    for (const name of ["Mia", "Leo"]) {
      await type(name);
      await tap("kids:add");
    }
    await type("Ava");
    expect(lastSend()).toMatchObject({ text: "Mia, Leo and Ava. Any other children?", buttons: [[{ text: "That's all", data: "kids:done" }]] });
    await tap("kids:add"); // an old button: nothing changes
    expect(store.drafts.get(ME)?.answers.children).toEqual(["Mia", "Leo", "Ava"]);
  });

  it("12. with 2 or 3 children, 'That's all' explains taking turns once; with 1 child it doesn't", async () => {
    await type("/start WELCOME-1");
    await type("Mia");
    await tap("kids:add");
    await type("Leo");
    await tap("kids:done");
    expect(telegram.sentTexts()).toContain(
      "Mia and Leo. Lovely! To keep things fresh, we'll take turns naming one of them in each reminder. It's just a suggestion: do it with whoever you like.",
    );
    const other = 5151;
    store.invites.set("WELCOME-3", null);
    await send(textUpdate(other, "Ann", "/start WELCOME-3"));
    await send(textUpdate(other, "Ann", "Zoe"));
    await send(tapUpdate(other, "kids:done"));
    expect(telegram.calls.filter((c) => c.kind === "send" && c.chatId === other && c.text.includes("take turns"))).toEqual([]);
  });

  it("typing something on a screen that expects a button gets 'Unrecognised text.'", async () => {
    await goTo("quick", { store, telegram, now }, ME);
    await type("hello");
    expect(telegram.sentTexts().at(-1)).toBe("Unrecognised text.");
  });
});

describe("C. Choosing behaviours", () => {
  it("13. screen 4 greets by the child for 1 child, by name alone for 2 or more, with the 4 quick behaviours and Next", async () => {
    await goTo("quick", { store, telegram, now }, ME);
    expect(telegram.sentTexts()).toContain("Nice to meet you, Mia's parent, John!");
    expect(lastSend()).toMatchObject({ text: "These are quick behaviours. Pick up to 2 to work on." });
    expect(buttonTexts(lastSend())).toEqual([...QUICK.map((b) => b.name), "Next"]);

    const other = 5151;
    store.invites.set("WELCOME-3", null);
    await send(textUpdate(other, "Ann", "/start WELCOME-3"));
    await send(textUpdate(other, "Ann", "Zoe"));
    await send(tapUpdate(other, "kids:add"));
    await send(textUpdate(other, "Ann", "Max"));
    await send(tapUpdate(other, "kids:done"));
    expect(telegram.sentTexts()).toContain("Nice to meet you, Ann!");
  });

  it("14. a tap ticks a behaviour in place, a second tap unticks it, and a third tick is refused", async () => {
    await goTo("quick", { store, telegram, now }, ME);
    await tap(`q:${QUICK[1]!.id}`, 600);
    const edit = telegram.calls.at(-2);
    expect(edit).toMatchObject({ kind: "edit", messageId: 600 });
    expect(edit?.kind === "edit" && edit.buttons?.flat().map((b) => b.text)).toContain(`✓ ${QUICK[1]!.name}`);
    await tap(`q:${QUICK[0]!.id}`, 600);
    await tap(`q:${QUICK[2]!.id}`, 600);
    expect(telegram.calls.at(-1)).toMatchObject({ kind: "answer", popup: "You can pick up to 2." });
    await tap(`q:${QUICK[1]!.id}`, 600); // untick
    expect(store.drafts.get(ME)?.answers.picks).toEqual([{ nudge_id: QUICK[0]!.id, frequency: "every_2_days" }]);
  });

  it("15. Next shows the 5 deliberate behaviours and Skip for now; tapping one moves on", async () => {
    await goTo("quick", { store, telegram, now }, ME);
    await tap(`q:${QUICK[1]!.id}`, 600);
    await tap("q:next", 600);
    expect(lastSend()).toMatchObject({ text: "Now pick 1 deliberate behaviour. These take some planning. So we've made it optional." });
    expect(buttonTexts(lastSend())).toEqual([...DELIBERATE.map((b) => b.name), "Skip for now"]);
    await tap(`d:${DELIBERATE[0]!.id}`, 601);
    expect(store.drafts.get(ME)?.answers.picks).toEqual([
      { nudge_id: QUICK[1]!.id, frequency: "every_2_days" },
      { nudge_id: DELIBERATE[0]!.id, frequency: "once_a_week" },
    ]);
    expect(store.drafts.get(ME)?.step).toBe("school_times");
  });

  it("16. with no quick behaviour ticked, screen 5 has no Skip button (rule 2.1: at least one behaviour)", async () => {
    await goTo("quick", { store, telegram, now }, ME);
    await tap("q:next", 600);
    expect(lastSend()).toMatchObject({ text: "Now pick 1 deliberate behaviour. Pick 1 to get started." });
    expect(buttonTexts(lastSend())).toEqual(DELIBERATE.map((b) => b.name));
    await tap("d:skip", 601); // an old or forged button: nothing moves on
    expect(store.drafts.get(ME)?.step).toBe("deliberate");
  });
});

describe("D. Times and plan", () => {
  it("17. screens 6 and 7 show the default times, the Settings line, and one OK each", async () => {
    await goTo("school_times", { store, telegram, now }, ME);
    expect(lastSend()).toMatchObject({
      text: "For school days, we'll suggest reminders at these 3 times.\n7:00 am · 7:00 pm · 9:00 pm\n1 reminder each time. A maximum of 3 in total a day.\nYou can change these anytime in Settings.",
      buttons: [[{ text: "OK", data: "times:school" }]],
    });
    await tap("times:school", 700);
    expect(lastSend()).toMatchObject({
      text: "For weekends and school holidays, we'll remind you at these times.\n9:00 am · 12:30 pm · 7:00 pm\n1 reminder each time. A maximum of 3 in total a day.\nYou can change these anytime in Settings.",
      buttons: [[{ text: "OK", data: "times:weekend" }]],
    });
    await tap("times:weekend", 701);
    expect(store.drafts.get(ME)?.answers.slots).toEqual({ school: [420, 1140, 1260], non_school: [540, 750, 1140] });
  });

  it("18. screen 8 shows the plan from what was chosen, with one OK", async () => {
    await goTo("plan", { store, telegram, now }, ME, { quick: [QUICK[1]!.id, QUICK[0]!.id], deliberate: DELIBERATE[0]!.id });
    expect(lastSend()).toMatchObject({
      text:
        "From what you chose, your reminders are:\n" +
        `${QUICK[1]!.name}, ${QUICK[0]!.name}: every 2 days\n` +
        `${DELIBERATE[0]!.name}: once a week\n` +
        "A wrap up for the week will be sent on Sunday at 8:00 pm.\n" +
        "Change these anytime in Settings.",
      buttons: [[{ text: "OK", data: "plan:ok" }]],
    });
  });

  it("19. a button from an earlier screen saves nothing", async () => {
    await goTo("plan", { store, telegram, now }, ME);
    const before = structuredClone(store.drafts.get(ME));
    for (const data of ["name:change", "kids:add", `q:${QUICK[2]!.id}`, `d:${DELIBERATE[1]!.id}`, "times:school", "agree"]) await tap(data);
    expect(store.drafts.get(ME)).toEqual(before);
    expect(store.parents).toEqual([]);
  });

  it("20. each answer is saved in the draft as the person goes", async () => {
    await goTo("agreement", { store, telegram, now }, ME);
    expect(store.drafts.get(ME)).toEqual({
      step: "agreement",
      answers: {
        first_name: "John",
        children: ["Mia"],
        picks: [{ nudge_id: QUICK[1]!.id, frequency: "every_2_days" }],
        slots: { school: [420, 1140, 1260], non_school: [540, 750, 1140] },
      },
    });
    expect(lastSend()).toMatchObject({ buttons: [[{ text: "✅ I agree", data: "agree" }]] });
  });
});

describe("E. Agreeing", () => {
  it("21. 'I agree' turns the draft into the parent, children, picks, times, agreement and used invite, and removes the draft", async () => {
    await goTo("agreement", { store, telegram, now }, ME);
    await tap("agree", 800);
    expect(store.drafts.has(ME)).toBe(false);
    const parent = store.parents[0]!;
    expect(parent).toMatchObject({ telegramId: ME, firstName: "John" });
    expect(store.children).toEqual([{ parentId: parent.id, firstName: "Mia" }]);
    expect(store.picks).toEqual([{ parentId: parent.id, nudgeId: QUICK[1]!.id, frequency: "every_2_days" }]);
    expect(store.slots).toEqual([{ parentId: parent.id, school: [420, 1140, 1260], nonSchool: [540, 750, 1140] }]);
    expect(store.consents).toEqual([{ parentId: parent.id, topic: "recording", answer: "agreed" }]);
    expect(store.invites.get("WELCOME-1")).toBe(parent.id);
    expect(telegram.calls).toContainEqual(expect.objectContaining({ kind: "edit", messageId: 800, text: expect.stringContaining("✅ You agreed.") }));
  });

  it("22. if finishing fails, the person sees 'didn't save', the button stays and the draft is kept", async () => {
    await goTo("agreement", { store, telegram, now }, ME);
    store.failWrites = true;
    await tap("agree", 800);
    expect(store.parents).toEqual([]);
    expect(store.drafts.get(ME)?.step).toBe("agreement");
    expect(telegram.sentTexts().at(-1)).toBe("Sorry, that didn't save. Please try again.");
    expect(telegram.calls.some((c) => (c.kind === "edit" || c.kind === "removeButtons") && c.messageId === 800)).toBe(false);
  });

  it("if saving a step fails, the person is told and the step doesn't move on", async () => {
    await type("/start WELCOME-1");
    store.failWrites = true;
    await type("Mia");
    expect(store.drafts.get(ME)?.answers.children).toBeUndefined();
    expect(telegram.sentTexts().at(-1)).toBe("Sorry, that didn't save. Please try again.");
  });
});
