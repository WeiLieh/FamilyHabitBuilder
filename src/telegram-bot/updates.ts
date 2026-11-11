// =============================================================================
// src/telegram-bot/updates.ts: making sense of what Telegram sends us
//
// What it does: [2026-11-11] Telegram sends every event as a JSON "update".
// parseUpdate checks its shape with zod (an approved library that checks data
// from outside before we trust it) and turns it into one of four plain kinds:
//   - start: someone sent /start, perhaps with an invite code
//   - message: a person sent something else (text, a sticker, a photo)
//   - tap: a person tapped one of our buttons
//   - ignore: anything that isn't a person's message in a private chat (an
//     edited message, the bot being blocked or added to a group, broken data)
// Why: the rest of the bot never has to deal with Telegram's raw format, and a
// strange update can't crash it.
// =============================================================================

import { z } from "zod";

export type Incoming =
  | { kind: "start"; updateId: number; chatId: number; telegramId: number; firstName: string; code: string | null }
  | { kind: "message"; updateId: number; chatId: number }
  | { kind: "tap"; updateId: number; tapId: string; chatId: number; messageId: number; telegramId: number; data: string }
  | { kind: "ignore" };

// The parts of a Telegram update we use. Everything else is allowed but ignored.
const Person = z.object({ id: z.number(), is_bot: z.boolean().optional(), first_name: z.string().optional() });
const Chat = z.object({ id: z.number(), type: z.string() });
const UpdateShape = z.object({
  update_id: z.number(),
  message: z.object({ message_id: z.number(), chat: Chat, from: Person.optional(), text: z.string().optional() }).optional(),
  callback_query: z
    .object({
      id: z.string(),
      from: Person,
      data: z.string().optional(),
      message: z.object({ message_id: z.number(), chat: Chat }).optional(),
    })
    .optional(),
});

export function parseUpdate(body: unknown): Incoming {
  const parsed = UpdateShape.safeParse(body);
  if (!parsed.success) return { kind: "ignore" };
  const u = parsed.data;

  // A button tap in a private chat with the bot.
  const tap = u.callback_query;
  // In a private chat the chat is the person; anything else is ignored (an extra safeguard).
  if (tap && tap.message && tap.message.chat.type === "private" && tap.message.chat.id === tap.from.id && tap.data !== undefined) {
    return {
      kind: "tap",
      updateId: u.update_id,
      tapId: tap.id,
      chatId: tap.message.chat.id,
      messageId: tap.message.message_id,
      telegramId: tap.from.id,
      data: tap.data,
    };
  }

  // A message from a person (not a bot) in a private chat.
  const m = u.message;
  if (m && m.chat.type === "private" && m.from && !m.from.is_bot) {
    // "/start" or "/start CODE" (the invite link t.me/<bot>?start=CODE arrives like this).
    const start = /^\/start(?:\s+(\S+))?\s*$/.exec(m.text ?? "");
    // Telegram always sends a first name; without one, we ignore the message rather
    // than save a made-up name (rule 1.3).
    const firstName = (m.from.first_name ?? "").trim();
    if (start && firstName === "") return { kind: "ignore" };
    if (start) {
      return {
        kind: "start",
        updateId: u.update_id,
        chatId: m.chat.id,
        telegramId: m.from.id,
        firstName,
        code: start[1] ?? null,
      };
    }
    return { kind: "message", updateId: u.update_id, chatId: m.chat.id };
  }
  return { kind: "ignore" };
}
