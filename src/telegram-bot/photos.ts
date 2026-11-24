// =============================================================================
// src/telegram-bot/photos.ts: a photo sent after a log (owner, 24 Nov)
//
// What it does: [2026-11-24] owner-approved tests PH2 to PH9
// (src/telegram-bot/SPEC.md, "Owner decisions for tonight's builds"):
//   - The first photo ever asks for photo consent (rule 5.5), with OK and
//     "Don't save my photos". That photo is not kept: nothing is downloaded
//     before the parent agrees (D3). OK asks them to send it again.
//   - With consent, a photo joins the parent's latest log from the last 10
//     minutes whose behaviour allows photos (D2; PHOTO_WAIT_SECONDS). It is
//     taken from Telegram, put in the private photo store in the parent's own
//     folder, and added to the log as "not checked". No Claude check and no
//     "Did you do it?" (owner, 24 Nov: the photo check is parked).
//   - No log to join (D4), or a log that already has a photo (D5): nothing is
//     kept, and the bot says why.
//   - Undo of a log with a photo removes the photo file first (rule 8.5), then
//     undoes the log (PH9; in log-any-time.ts).
// Honest failures (rule 1.3): if any step fails, the parent is told it didn't
// save, never "Photo added". A file saved before a later step failed is removed
// again, so no stray copy is left in the store.
//
// Analogy: a photo is a print handed to the front desk. The desk first checks
// you've said prints may be kept, then clips it to the form you filled in in
// the last ten minutes. No form, or the form already has a print: it hands the
// print back and says why.
// =============================================================================

import { PHOTO_WAIT_SECONDS } from "../settings.js";
import type { BotDeps } from "./handle-update.js";
import { logFailure } from "./log-failure.js";
import type { Incoming } from "./updates.js";
import { WORDS } from "./words.js";

type Parent = { id: number };
type Tap = Extract<Incoming, { kind: "tap" }>;

const quietly = (what: string, work: () => Promise<unknown>) => work().catch((error) => logFailure(what, error));

// The two consent buttons' codes.
export const PHOTO_CONSENT_OK = "photos:ok";
export const PHOTO_CONSENT_NO = "photos:no";

// A photo from a parent. fileId is Telegram's number for its biggest size.
export async function photoMessage(chatId: number, parent: Parent, fileId: string, deps: BotDeps): Promise<void> {
  const { store, telegram, now } = deps;
  const sorry = (what: string) => async (error: unknown) => {
    logFailure(what, error);
    await quietly("Sending 'didn't save' failed", () => telegram.sendMessage(chatId, WORDS.didNotSave));
  };

  // 1. Consent first: without "agreed", ask, and keep nothing (D3).
  let consent: "agreed" | "opted_out" | "missing";
  try {
    consent = await store.photoConsent(parent.id);
  } catch (error) {
    return sorry("Reading the photo consent failed")(error);
  }
  if (consent !== "agreed") {
    await quietly("Sending the photo consent question failed", () => telegram.sendMessage(chatId, WORDS.photoConsent, [
      { text: WORDS.photoConsentOk, data: PHOTO_CONSENT_OK },
      { text: WORDS.photoConsentNo, data: PHOTO_CONSENT_NO },
    ]));
    return;
  }

  // 2. Which log does it join? (D2) None, or one with a photo already: say so (D4, D5).
  let target: { logId: number; hasPhoto: boolean } | null;
  try {
    target = await store.photoLogSince(parent.id, new Date(now.getTime() - PHOTO_WAIT_SECONDS * 1000));
  } catch (error) {
    return sorry("Finding the log for a photo failed")(error);
  }
  if (target === null) return void (await quietly("Sending 'no log for this photo' failed", () => telegram.sendMessage(chatId, WORDS.photoNoLog)));
  if (target.hasPhoto) return void (await quietly("Sending 'already has a photo' failed", () => telegram.sendMessage(chatId, WORDS.photoHasOne)));

  // 3. Take it from Telegram, put it in the private store, add it to the log.
  let path: string;
  try {
    const bytes = await telegram.downloadPhoto(fileId);
    path = await store.savePhotoFile(parent.id, bytes);
  } catch (error) {
    return sorry("Saving a photo failed")(error);
  }
  let added: "saved" | "has_photo";
  try {
    added = await store.addLogPhoto(parent.id, target.logId, path);
  } catch (error) {
    // The file is in the store but on no log: remove it, so no stray copy stays.
    await quietly("Removing a photo file after a failed save failed", () => store.removePhotoFile(path));
    return sorry("Adding a photo to its log failed")(error);
  }
  if (added === "has_photo") {
    // Another copy of the same photo got there first (Telegram resent it): keep one (PH8).
    await quietly("Removing a second copy of a photo failed", () => store.removePhotoFile(path));
    return void (await quietly("Sending 'already has a photo' failed", () => telegram.sendMessage(chatId, WORDS.photoHasOne)));
  }
  await quietly("Photo saved, but sending the reply failed", () => telegram.sendMessage(chatId, WORDS.photoAdded));
}

// OK or "Don't save my photos" on the consent question (PH3). Either answer is
// recorded (add-only, rule 8.4); the question's buttons go, so it is answered once.
export async function photoConsentTap(t: Tap, parent: Parent, { store, telegram }: BotDeps): Promise<void> {
  const answer = t.data === PHOTO_CONSENT_OK ? "agreed" : "opted_out";
  try {
    await store.recordPhotoConsent(parent.id, answer);
  } catch (error) {
    logFailure("Recording the photo consent failed", error);
    await quietly("Sending 'didn't save' failed", () => telegram.sendMessage(t.chatId, WORDS.didNotSave));
    await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
    return;
  }
  await quietly("Consent saved, but removing its buttons failed", () => telegram.removeButtons(t.chatId, t.messageId));
  await quietly("Consent saved, but sending the reply failed", () =>
    telegram.sendMessage(t.chatId, answer === "agreed" ? WORDS.photoConsentThanks : WORDS.photoNotSaved),
  );
  await quietly("Answering the tap failed", () => telegram.answerTap(t.tapId));
}

// The receipt's extra line for a behaviour that allows photos (PH1). If the
// question can't be answered, the receipt goes without it: the log is saved
// either way, and nothing is made up (rule 1.3).
export async function withPhotoPrompt(receipt: string, nudgeId: number, { store }: BotDeps): Promise<string> {
  try {
    return (await store.photoAllowed(nudgeId)) ? `${receipt}\n\n${WORDS.photoPrompt}` : receipt;
  } catch (error) {
    logFailure("Reading whether a behaviour allows photos failed", error);
    return receipt;
  }
}
