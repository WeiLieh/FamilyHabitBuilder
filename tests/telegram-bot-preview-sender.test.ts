// =============================================================================
// tests/telegram-bot-preview-sender.test.ts
//
// [2026-11-15] Checks the preview sender (src/telegram-bot/preview-sender.ts):
// that it reads every message from the style C preview page and turns each one
// into the right request for Telegram, so what arrives on the owner's phone
// matches the preview. Nothing is sent: these tests only look at the requests.
// =============================================================================

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PREVIEW_KEYBOARD, PREVIEW_REACTIONS, TERMS_URL, reactionFor, readPreviewItems, toTelegramCalls, type TelegramCall } from "../src/telegram-bot/preview-sender.js";

const html = readFileSync("docs/handoffs/2026-11-15-readability-style-c-preview.html", "utf8");
const items = readPreviewItems(html);
const calls = toTelegramCalls(items, 42, () => "🎉");
// The message sent right after a given "#n · …" label.
const after = (label: string): TelegramCall => {
  const i = calls.findIndex((c) => String(c.params.text).startsWith(`<i>#${label} ·`));
  return calls[i + 1]!;
};

describe("preview sender", () => {
  it("V1: reads all 68 numbered messages and the five group titles from the preview page", () => {
    expect(items.filter((i) => !("group" in i))).toHaveLength(68);
    expect(items.filter((i) => "group" in i)).toHaveLength(5);
  });

  it("V2: sends a label and then the message, in Telegram's formatting mode, to the given chat", () => {
    const welcome = after("1");
    expect(welcome.method).toBe("sendMessage");
    expect(welcome.params).toMatchObject({ chat_id: 42, parse_mode: "HTML" });
    expect(welcome.params.text).toContain("<b>Thanks for joining, John!</b>");
  });

  it("V3: keeps the buttons in their rows, with the same words (a move-on button keeps its arrow)", () => {
    const quick = after("10").params.reply_markup as { inline_keyboard: { text: string }[][] };
    expect(quick.inline_keyboard.map((row) => row.map((b) => b.text))).toEqual([
      ["✅ Talking with children"], ["✅ Showing affection"], ["Descriptive praise"], ["Giving attention"], ["Next ➡️"],
    ]);
    const nudge = after("33").params.reply_markup as { inline_keyboard: { text: string }[][] };
    expect(nudge.inline_keyboard[0]!.map((b) => b.text)).toEqual(["✅ Done", "😴 Not today"]);
  });

  it("V4: sends the keyboard under the chat where the preview shows it", () => {
    expect(after("21").params.reply_markup).toEqual({
      keyboard: [[{ text: "✅ Showing affection" }], [{ text: "✅ Talking with children" }]],
      resize_keyboard: true,
    });
  });

  it("V5: shows a parent's message as 'You send', and only the keyboard tap gets a reaction", () => {
    const tap = after("39");
    expect(tap.params.text).toBe("<i>👤 You send:</i> ✅ Showing affection");
    expect(tap.react).toBe("🎉");
    expect(after("44").react).toBeUndefined();
    expect(after("45").react).toBeUndefined();
  });

  it("V6: shows a pop-up as labelled text", () => {
    expect(after("11").params.text).toBe("<i>Pop-up box, with OK:</i>\nYou can pick up to 2.");
  });

  it("V7: gives the agreement's Terms & Conditions link its address", () => {
    expect(after("18").params.text).toContain(`<a href="${TERMS_URL}">Read the Terms &amp; Conditions</a>`);
  });

  it("V8: uses only the tags Telegram understands (bold, italic, links)", () => {
    for (const call of calls) {
      const tags = String(call.params.text).match(/<\/?([a-z]+)/g) ?? [];
      for (const tag of tags) expect(["<b", "</b", "<i", "</i", "<a", "</a"]).toContain(tag);
    }
  });

  it("V9: picks reactions only from the nine the owner chose", () => {
    const real = toTelegramCalls(items, 42).filter((c) => c.react);
    expect(real.length).toBeGreaterThan(0);
    for (const call of real) expect(PREVIEW_REACTIONS).toContain(call.react);
  });

  it("V10: listening mode reacts to a keyboard tap from the owner's chat, with the chosen emoji", () => {
    const tap = { update_id: 7, message: { message_id: 99, chat: { id: 42 }, text: PREVIEW_KEYBOARD[0]! } };
    expect(reactionFor(tap, 42, () => "🔥")).toEqual({
      method: "setMessageReaction",
      params: { chat_id: 42, message_id: 99, reaction: [{ type: "emoji", emoji: "🔥" }] },
    });
  });

  it("V11: listening mode never reacts to typed text or to another chat", () => {
    expect(reactionFor({ update_id: 8, message: { message_id: 100, chat: { id: 42 }, text: "Hugged Mia" } }, 42)).toBeNull();
    expect(reactionFor({ update_id: 9, message: { message_id: 101, chat: { id: 5 }, text: PREVIEW_KEYBOARD[0]! } }, 42)).toBeNull();
  });
});
