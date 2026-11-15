// =============================================================================
// src/telegram-bot/preview-sender.ts: send the style C preview to a phone
//
// What it does: [2026-11-15] reads every message in the readability preview
// (docs/handoffs/2026-11-15-readability-style-c-preview.html) and sends each one,
// numbered, to the owner's Telegram chat through a SEPARATE "preview bot", so the
// owner can see the new house style in real Telegram before the live words change.
//
// Why a separate bot: the live bot's token stays in Vercel only. The preview
// bot's token is a GitHub secret (PREVIEW_BOT_TOKEN), and this file runs in a
// GitHub Actions job (.github/workflows/preview-messages.yml), never in the app.
// Nothing here touches the live bot, the database or any real family.
//
// What a bot cannot do, and how the preview shows it instead:
//   - a bot can't send "as the parent": a parent's message is shown as
//     "👤 You send: …" (and gets the proposed random reaction, rule 5.14 draft);
//   - a pop-up only appears after a real tap, so it is shown as text;
//   - the preview bot has no server behind it, so its buttons do nothing.
// A request Telegram refuses is reported and makes the job fail (rule 1.3).
// Run it with Node.js 24, which understands this TypeScript file directly.
// =============================================================================

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

// One entry in the preview file: a group title, or one thing the parent sees.
// A button is plain words, or { go: words } for a button that moves sign-up on.
type PreviewButton = string | { go: string };
export type PreviewItem =
  | { group: string }
  | {
      name: string;
      kind: "in" | "out" | "alert" | "menu";
      text?: string;
      changed?: boolean;
      buttons?: PreviewButton[][];
      keyboard?: string[];
      react?: string;
      photo?: boolean;
      rows?: [string, string][];
    };

// One request to Telegram's Bot API: the method name and what to send.
// "react" asks the sender to add a reaction to the message once it is sent.
export type TelegramCall = { method: string; params: Record<string, unknown>; react?: string };

// The nine reaction emoji the owner chose (15 Nov). Telegram's list spells the
// red heart without the colour marker, so it is "❤" here. In the live build this
// set moves to src/settings.ts (rule 1.4); this copy only serves the preview.
export const PREVIEW_REACTIONS = ["❤", "🥰", "🤗", "👏", "💯", "🏆", "🎉", "🔥", "🤩"] as const;

// The page the agreement's "Terms & Conditions" link will open (a plain page,
// to be built with the live change).
export const TERMS_URL = "https://family-habit-builder.vercel.app/terms";

// Read the list of messages out of the preview page. The page keeps them in a
// small script (so it can draw them); we run only that part, in a sealed-off
// sandbox with nothing from this computer, and take the list it builds.
export function readPreviewItems(html: string): PreviewItem[] {
  const start = html.indexOf("const QUICK");
  const end = html.indexOf("// Draw the chat");
  if (start < 0 || end < 0) throw new Error("The preview file's message list was not found.");
  const items = vm.runInNewContext(`${html.slice(start, end)}\nM;`, {}) as PreviewItem[];
  if (!Array.isArray(items) || items.length === 0) throw new Error("The preview file has no messages.");
  return items;
}

// Make the text safe for Telegram's formatting mode: Telegram understands only a
// few tags (<b>, <i>, <a href>). The preview uses <b> and a bare <a>, which gets
// the Terms & Conditions address.
const forTelegram = (text: string) => text.replaceAll("<a>", `<a href="${TERMS_URL}">`);

// Turn the preview's buttons into Telegram's inline buttons (a list of rows).
// They need a short code to send back when tapped; the preview bot ignores it.
const inlineButtons = (rows: PreviewButton[][]) => ({
  inline_keyboard: rows.map((row) =>
    row.map((b) => ({ text: typeof b === "string" ? b : b.go, callback_data: "preview" })),
  ),
});

// Turn the whole preview into the requests to send, in order. Each message gets
// a small italic label first ("#12 · …"), so the owner can comment by number,
// and the message itself is sent exactly as the parent would see it.
// pickReaction chooses the emoji (random in real use; fixed in tests).
export function toTelegramCalls(
  items: PreviewItem[],
  chatId: number,
  pickReaction: () => string = () => PREVIEW_REACTIONS[Math.floor(Math.random() * PREVIEW_REACTIONS.length)]!,
): TelegramCall[] {
  const send = (text: string, extra: Record<string, unknown> = {}): TelegramCall => ({
    method: "sendMessage",
    params: { chat_id: chatId, text, parse_mode: "HTML", ...extra },
  });
  const calls: TelegramCall[] = [send("<b>Style C preview</b>\nEvery bot message, numbered. Comment by number. Buttons here do nothing.")];
  let n = 0;
  for (const item of items) {
    if ("group" in item) {
      calls.push(send(`<b>── ${item.group} ──</b>`));
      continue;
    }
    n += 1;
    const tag = item.changed ? " · words changed" : "";
    calls.push(send(`<i>#${n} · ${item.name}${tag}</i>`));
    if (item.kind === "alert") {
      calls.push(send(`<i>Pop-up box, with OK:</i>\n${item.text ?? ""}`));
    } else if (item.kind === "menu") {
      const lines = (item.rows ?? []).map(([c, d]) => `${c} · ${d}`).join("\n");
      calls.push(send(`<i>The Menu button lists:</i>\n${lines}`));
    } else if (item.kind === "out") {
      const what = item.photo ? "a photo" : (item.text ?? "");
      const call = send(`<i>👤 You send:</i> ${what}`);
      calls.push(item.react ? { ...call, react: pickReaction() } : call);
    } else {
      const extra: Record<string, unknown> = {};
      if (item.buttons) extra.reply_markup = inlineButtons(item.buttons);
      else if (item.keyboard) extra.reply_markup = { keyboard: item.keyboard.map((k) => [{ text: k }]), resize_keyboard: true };
      calls.push(send(forTelegram(item.text ?? ""), extra));
    }
  }
  return calls;
}

// ---- Listening mode: react to the owner's real keyboard taps -----------------
// [2026-11-15] So the owner can see the reaction animation (proposed rule 5.14)
// on a real tap: the job sends the keyboard, then listens for a few minutes.

// The keyboard the preview shows (the same labels as the live bot's keyboard).
export const PREVIEW_KEYBOARD = ["✅ Showing affection", "✅ Talking with children"];

// One incoming update from Telegram (only the parts we look at).
export type IncomingUpdate = { update_id: number; message?: { message_id: number; chat: { id: number }; text?: string } };

// Decide whether a message gets a reaction: only a keyboard tap (its text is
// exactly a keyboard label) from the owner's chat. Typed text gets nothing,
// as the owner decided (15 Nov). Returns the reaction request, or null.
export function reactionFor(
  update: IncomingUpdate,
  chatId: number,
  pickReaction: () => string = () => PREVIEW_REACTIONS[Math.floor(Math.random() * PREVIEW_REACTIONS.length)]!,
): TelegramCall | null {
  const message = update.message;
  if (!message || message.chat.id !== chatId || !PREVIEW_KEYBOARD.includes(message.text ?? "")) return null;
  return {
    method: "setMessageReaction",
    params: { chat_id: chatId, message_id: message.message_id, reaction: [{ type: "emoji", emoji: pickReaction() }] },
  };
}

// How long the job listens, in seconds (a preview tool setting, not an app value).
const LISTEN_SECONDS = 300;

async function listen(token: string, chatId: number, startAfter: number) {
  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text: `<b>Try it:</b> tap a habit on the keyboard below. For the next ${LISTEN_SECONDS / 60} minutes, each tap gets a reaction.`,
    parse_mode: "HTML",
    reply_markup: { keyboard: PREVIEW_KEYBOARD.map((k) => [{ text: k }]), resize_keyboard: true },
  });
  let offset = startAfter;
  const end = Date.now() + LISTEN_SECONDS * 1000;
  let reacted = 0;
  while (Date.now() < end) {
    // Long polling: Telegram holds the request open until a message arrives (up to 25 s).
    const updates = (await callTelegram(token, "getUpdates", { offset, timeout: 25 })) as IncomingUpdate[];
    for (const update of updates) {
      offset = update.update_id + 1;
      const call = reactionFor(update, chatId);
      if (!call) continue;
      try {
        await callTelegram(token, call.method, call.params);
        reacted += 1;
      } catch (error) {
        console.error("A reaction failed (logged only; the parent sees nothing)", error);
      }
    }
  }
  await callTelegram(token, "sendMessage", { chat_id: chatId, text: `Listening finished (${reacted} reaction(s)).` });
  console.log(`Listened for ${LISTEN_SECONDS} s; reacted ${reacted} time(s).`);
}

// ---- Running it (GitHub Actions) ---------------------------------------------

// Ask Telegram to do one thing; a refusal is thrown as an error, never ignored.
async function callTelegram(token: string, method: string, params: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const body = (await response.json()) as { ok: boolean; result?: unknown; description?: string };
  if (!body.ok) throw new Error(`${method} refused: ${body.description ?? response.status}`);
  return body.result;
}

// Find the owner's chat: the person who last sent /start to the preview bot.
async function findChatId(token: string): Promise<{ chatId: number; nextUpdate: number }> {
  // [2026-11-15] Say which bot the token belongs to (its public username, not
  // the token) and how many waiting messages Telegram has for it, so a wrong
  // token or a missing /start is easy to spot in the job's log.
  const me = (await callTelegram(token, "getMe", {})) as { username?: string };
  const updates = (await callTelegram(token, "getUpdates", {})) as (IncomingUpdate & { message?: { chat: { type?: string } } })[];
  console.log(`Connected as @${me.username ?? "?"}; Telegram has ${updates.length} waiting message(s) for it.`);
  const chats = updates.map((u) => u.message?.chat).filter((c) => c?.type === "private");
  const last = chats.at(-1);
  if (!last) throw new Error("No chat found: open the preview bot in Telegram and send /start first.");
  // The listening mode starts after these, so old messages never get a reaction.
  return { chatId: last.id, nextUpdate: (updates.at(-1)?.update_id ?? 0) + 1 };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const token = process.env.PREVIEW_BOT_TOKEN;
  if (!token) throw new Error("PREVIEW_BOT_TOKEN is missing (add it as a GitHub secret).");
  const found = await findChatId(token);
  const chatId = process.env.PREVIEW_CHAT_ID ? Number(process.env.PREVIEW_CHAT_ID) : found.chatId;
  // PREVIEW_MODE "listen": skip the full preview and only react to keyboard taps.
  if (process.env.PREVIEW_MODE === "listen") {
    await listen(token, chatId, found.nextUpdate);
    return;
  }
  const html = readFileSync(new URL("../../docs/handoffs/2026-11-15-readability-style-c-preview.html", import.meta.url), "utf8");
  const calls = toTelegramCalls(readPreviewItems(html), chatId);
  // Put the commands behind the preview bot's real Menu button, as the live bot has.
  await callTelegram(token, "setMyCommands", {
    commands: [
      { command: "log", description: "Log a behaviour for today" },
      { command: "mypage", description: "Your page" },
      { command: "settings", description: "Your times and habits" },
      { command: "pause", description: "Pause your reminders" },
      { command: "help", description: "How this works" },
    ],
  });
  let failures = 0;
  for (const call of calls) {
    try {
      const sent = (await callTelegram(token, call.method, call.params)) as { message_id: number };
      if (call.react) {
        await callTelegram(token, "setMessageReaction", {
          chat_id: chatId,
          message_id: sent.message_id,
          reaction: [{ type: "emoji", emoji: call.react }],
        });
      }
    } catch (error) {
      failures += 1;
      console.error(`Failed: ${String(call.params.text ?? call.method).slice(0, 60)}`, error);
    }
    // Telegram allows about one message a second to one chat; stay under it.
    await wait(1100);
  }
  console.log(`Sent ${calls.length - failures} of ${calls.length} messages.`);
  if (failures > 0) process.exit(1);
}

// Run main() only when this file is started directly, not when tests import it.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
