// =============================================================================
// tests/telegram-bot-photos.test.ts: a photo after a log, in Telegram (owner, 24 Nov)
//
// What it checks: [2026-11-24] the owner-approved tests PH1 to PH10
// (src/telegram-bot/SPEC.md, "Owner decisions for tonight's builds"; defaults
// D1 to D5 approved with them):
//   PH1 a receipt asks for a photo only when the behaviour allows photos
//   PH2 the first photo ever asks for consent and takes nothing
//   PH3 OK and "Don't save my photos"
//   PH4 with consent, a photo joins the latest log from the last 10 minutes,
//       saved in the parent's own folder, "not checked", with no check or question
//   PH5 no log to join: nothing kept, and the bot says so
//   PH6 a log that already has a photo: nothing kept, and the bot says so
//   PH7 a failed download, store or save is shown as a failure, never "added"
//   PH8 the same photo message delivered twice is saved once
//   PH9 Undo of a log with a photo removes its file first
//   PH10 no file number, photo name or caption reaches the logs
// =============================================================================

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleUpdate, type BotDeps } from "../src/telegram-bot/handle-update.js";
import { parseUpdate } from "../src/telegram-bot/updates.js";
import { sgtInstant } from "../src/sgt.js";
import { FakeStore } from "./helpers/datastore-fake-store.js";
import { FakeTelegram, photoUpdate, tapUpdate, textUpdate } from "./helpers/telegram-bot-fakes.js";

const ME = 4242;
const today = "2026-11-11";
const evening = sgtInstant(today, 19 * 60 + 5); // 7:05 pm
const minutesLater = (m: number) => new Date(evening.getTime() + m * 60_000);

let store: FakeStore;
let telegram: FakeTelegram;
let parentId: number;
const deps = (now = evening): BotDeps => ({ store, telegram, now });
const say = (text: string, now = evening) => handleUpdate(parseUpdate(textUpdate(ME, "Wei Lieh", text)), deps(now));
const tap = (data: string, messageId = 55, now = evening) => handleUpdate(parseUpdate(tapUpdate(ME, data, messageId)), deps(now));
const sendPhoto = (fileId = "AgACAgUAAxkBAAIBc2Zfile", now = evening, caption?: string, updateId?: number) =>
  handleUpdate(parseUpdate(photoUpdate(ME, fileId, caption, updateId)), deps(now));

// The words the parent sees (src/telegram-bot/words.ts).
const PROMPT = "📷 Send a photo of what you did.";
const CONSENT_BUTTONS = [{ text: "OK", data: "photos:ok" }, { text: "Don't save my photos", data: "photos:no" }];
const ADDED = "✅ Photo added to today's log.";
const NO_LOG = "I couldn't match this photo to a log from the last 10 minutes.\nLog the habit first, then send the photo.";
const HAS_ONE = "This log already has a photo.\nYou can delete it on My page and send another.";
const SORRY_SAVE = "🙇 Sorry, that didn't save. Please try again.";
const lastText = () => telegram.sentTexts().at(-1);

beforeEach(() => {
  store = new FakeStore();
  store.today = today;
  store.clock = evening;
  telegram = new FakeTelegram();
  // Showing affection (quick, no photos) and Spending quality time (deliberate, photos allowed).
  parentId = store.addParent({ telegramId: ME, firstName: "Wei Lieh", agreed: true });
  store.picks.push({ parentId, nudgeId: 2, frequency: "every_2_days" }, { parentId, nudgeId: 5, frequency: "once_a_week" });
});

// A parent who has already said OK to photos.
const agreeToPhotos = () => store.photoConsents.push({ parentId, answer: "agreed" });

describe("Asking for a photo (PH1)", () => {
  it("PH1 the receipt of a log that allows photos asks for one (keyboard, /log and ✅ Done); one that doesn't, doesn't", async () => {
    await say("✅ Spending quality time");
    expect(lastText()).toBe(`✅ <b>Saved</b>\nSpending quality time today.\n\n${PROMPT}`);
    await say("✅ Showing affection");
    expect(lastText()).toBe("✅ <b>Saved</b>\nShowing affection today.");
    await tap("log:5", 60);
    expect(lastText()).toContain(PROMPT);
    await store.recordNudgeSent({ parentId, nudgeId: 5, exampleId: 51, day: today, slotMinute: 1140, telegramMessageId: 777 });
    store.logs = []; // a fresh day's worth, so the Done tap answers the nudge
    await tap(`done:${today}:1140`, 777);
    expect(lastText()).toBe(`✅ <b>Saved</b>\nSpending quality time today.\n\n${PROMPT}`);
  });
});

describe("Photo consent at the first photo (PH2, PH3)", () => {
  it("PH2 the first photo ever asks for consent with OK and 'Don't save my photos', and nothing is downloaded or stored", async () => {
    await say("✅ Spending quality time");
    await sendPhoto();
    const ask = telegram.calls.at(-1);
    expect(ask).toMatchObject({ kind: "send", buttons: CONSENT_BUTTONS });
    expect((ask as { text: string }).text).toContain("We save your photos so you can see them on My page. Only you can see them, and you can delete any photo there.");
    expect(telegram.downloads).toEqual([]);
    expect(store.photoFiles.size).toBe(0);
    expect(store.photos).toEqual([]);
  });

  it("PH3 OK records consent and asks for the photo again; 'Don't save' records the answer, keeps nothing, and the next photo asks again", async () => {
    await say("✅ Spending quality time");
    await sendPhoto();
    await tap("photos:no", 600);
    expect(store.photoConsents).toEqual([{ parentId, answer: "opted_out" }]);
    expect(lastText()).toBe("No problem. That photo wasn't saved.");
    expect(telegram.calls).toContainEqual({ kind: "removeButtons", chatId: ME, messageId: 600 });
    expect(store.photoFiles.size).toBe(0);
    await sendPhoto();
    expect(telegram.calls.at(-1)).toMatchObject({ kind: "send", buttons: CONSENT_BUTTONS }); // asked again
    await tap("photos:ok", 601);
    expect(store.photoConsents.at(-1)).toEqual({ parentId, answer: "agreed" });
    expect(lastText()).toBe("Thanks. Please send the photo again.");
    expect(store.photos).toEqual([]); // the photo sent before OK was never kept (D3)
  });
});

describe("Saving a photo onto its log (PH4 to PH8)", () => {
  it("PH4 with consent, a photo within 10 minutes joins the latest photo log: the biggest size, the parent's own folder, not checked, no question", async () => {
    agreeToPhotos();
    await say("✅ Spending quality time");
    const logId = store.logs[0]!.id;
    await sendPhoto("AgACAgUAAxkBAAIBc2Zfile", minutesLater(9));
    expect(telegram.downloads).toEqual(["AgACAgUAAxkBAAIBc2Zfile-big"]);
    expect(store.photos).toEqual([expect.objectContaining({ parentId, logId, check: "not_checked" })]);
    expect(store.photos[0]!.path.startsWith(`${parentId}/`)).toBe(true);
    expect(store.photoFiles.has(store.photos[0]!.path)).toBe(true);
    expect(lastText()).toBe(ADDED);
    expect(telegram.sentTexts().join(" ")).not.toMatch(/Did you do it|Yes, I did it|self-reported/);
  });

  it("PH5 no log to join (none, older than 10 minutes, undone, or a behaviour without photos): nothing kept, and the bot says so", async () => {
    agreeToPhotos();
    await sendPhoto(); // no log at all
    expect(lastText()).toBe(NO_LOG);
    await say("✅ Spending quality time");
    await sendPhoto("late", minutesLater(11)); // too late
    expect(lastText()).toBe(NO_LOG);
    store.logs[0]!.undoneAt = evening; // undone
    await sendPhoto("undone", minutesLater(1));
    expect(lastText()).toBe(NO_LOG);
    await say("✅ Showing affection"); // a behaviour without photos
    await sendPhoto("quick", minutesLater(1));
    expect(lastText()).toBe(NO_LOG);
    expect(telegram.downloads).toEqual([]);
    expect(store.photos).toEqual([]);
  });

  it("PH6 a log that already has a photo keeps it: the second photo is not kept, and the bot says so", async () => {
    agreeToPhotos();
    await say("✅ Spending quality time");
    await sendPhoto("first", minutesLater(1));
    await sendPhoto("second", minutesLater(2));
    expect(lastText()).toBe(HAS_ONE);
    expect(store.photos).toHaveLength(1);
    expect(store.photoFiles.size).toBe(1);
    expect(telegram.downloads).toEqual(["first-big"]);
  });

  it("PH6 (review, 24 Nov) the photo joins the newest log WITHOUT a photo (D2): an earlier log in the 10 minutes still takes one", async () => {
    agreeToPhotos();
    store.picks.push({ parentId, nudgeId: 6, frequency: "once_a_week" }); // Interesting activities (photos allowed)
    await say("✅ Spending quality time");
    const older = store.logs[0]!.id;
    store.clock = minutesLater(1);
    await say("✅ Interesting activities", minutesLater(1));
    const newer = store.logs[1]!.id;
    await sendPhoto("one", minutesLater(2));
    await sendPhoto("two", minutesLater(3));
    expect(store.photos.map((p) => p.logId)).toEqual([newer, older]);
    await sendPhoto("three", minutesLater(4));
    expect(lastText()).toBe(HAS_ONE); // every log in the 10 minutes has its photo now
  });

  it("PH7 a failed download, store or save says it didn't save, never 'added'; a file stored before a failed save is removed", async () => {
    agreeToPhotos();
    await say("✅ Spending quality time");
    telegram.failDownload = true;
    await sendPhoto("a", minutesLater(1));
    expect(lastText()).toBe(SORRY_SAVE);
    telegram.failDownload = false;
    store.failPhotoFile = true;
    await sendPhoto("b", minutesLater(1));
    expect(lastText()).toBe(SORRY_SAVE);
    store.failPhotoFile = false;
    store.failAddPhoto = true;
    await sendPhoto("c", minutesLater(1));
    expect(lastText()).toBe(SORRY_SAVE);
    expect(store.photoFiles.size).toBe(0); // the stored file was removed again
    expect(store.photos).toEqual([]);
    expect(telegram.sentTexts()).not.toContain(ADDED);
    store.failAddPhoto = false;
    store.failReadsOf.add("photoConsent");
    await sendPhoto("d", minutesLater(1));
    expect(lastText()).toBe(SORRY_SAVE);
  });

  it("PH8 the same photo message delivered twice by Telegram is saved once", async () => {
    agreeToPhotos();
    await say("✅ Spending quality time");
    await sendPhoto("same", minutesLater(1), undefined, 9001);
    await sendPhoto("same", minutesLater(1), undefined, 9001);
    expect(store.photos).toHaveLength(1);
    expect(store.photoFiles.size).toBe(1);
    expect(telegram.sentTexts().filter((t) => t === ADDED)).toHaveLength(1);
  });
});

describe("Undo and the logs (PH9, PH10)", () => {
  it("PH9 Undo on a keyboard log with a photo removes the photo file first, then undoes the log; if the file can't be removed, nothing changes", async () => {
    agreeToPhotos();
    await say("✅ Spending quality time");
    const logId = store.logs[0]!.id;
    await sendPhoto("p", minutesLater(1));
    store.failRemovePhotoFile = true;
    await tap(`undo:${logId}`, 700, minutesLater(2));
    expect(store.logs[0]!.undoneAt).toBeNull(); // nothing changed
    expect(store.photos).toHaveLength(1);
    store.failRemovePhotoFile = false;
    await tap(`undo:${logId}`, 700, minutesLater(2));
    expect(store.photoFiles.size).toBe(0);
    expect(store.photos).toEqual([]);
    expect(store.logs[0]!.undoneAt).not.toBeNull();
  });

  it("PH9 (review, 24 Nov) in the last 30 seconds of Undo, a log with a photo says 'Undo expired.' and keeps its photo, so a file is never removed for an Undo the database refuses", async () => {
    agreeToPhotos();
    await say("✅ Spending quality time");
    const logId = store.logs[0]!.id;
    await sendPhoto("p", minutesLater(1));
    await tap(`undo:${logId}`, 700, new Date(evening.getTime() + (10 * 60 - 20) * 1000)); // 9 min 40 s
    expect(telegram.calls.at(-1)).toEqual({ kind: "answer", tapId: expect.any(String), popup: "Undo expired." });
    expect(store.photoFiles.size).toBe(1);
    expect(store.logs[0]!.undoneAt).toBeNull();
  });

  describe("PH10", () => {
    let errors: string[];
    beforeEach(() => {
      errors = [];
      vi.spyOn(console, "error").mockImplementation((line: string) => void errors.push(line));
    });
    afterEach(() => vi.restoreAllMocks());

    it("PH10 no Telegram file number, photo name or caption reaches the logs, even when every step fails", async () => {
      agreeToPhotos();
      await say("✅ Spending quality time");
      const fileId = "AgACAgUAAxkBAAIBc2ZmZmZmZmZmZmZmZmZm";
      store.failAddPhoto = true; // its error names the stored photo's path
      await sendPhoto(fileId, minutesLater(1), "Riley at the park");
      telegram.failDownload = true;
      await sendPhoto(fileId, minutesLater(1), "Riley at the park");
      const all = errors.join("\n");
      expect(errors.length).toBeGreaterThan(0);
      expect(all).not.toContain(fileId);
      expect(all).not.toMatch(/photo-\d+-0123456789abcdef0123/);
      expect(all).not.toContain("Riley");
    });
  });
});
