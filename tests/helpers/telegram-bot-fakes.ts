// =============================================================================
// tests/helpers/telegram-bot-fakes.ts: a pretend Telegram, and Telegram updates for tests
//
// What it does: [2026-11-11] the bot's tests (thin slice 1) must run here,
// without a real Telegram bot, like a flight simulator stands in for a plane.
// FakeTelegram writes down every message the bot sends, edits or answers, so a
// test can check exactly what the parent would see. It can be told to fail, so
// tests can check the bot never pretends a failure worked (rule 1.3). The
// builders make Telegram updates shaped like Telegram's own JSON. The pretend
// database is in datastore-fake-store.ts.
// =============================================================================

import type { Button, TelegramApi } from "../../src/telegram-bot/telegram-api.js";

// One thing the bot did in Telegram, as the parent would see it.
export type TelegramCall =
  | { kind: "send"; chatId: number; text: string; buttons: Button[] }
  | { kind: "edit"; chatId: number; messageId: number; text: string }
  | { kind: "removeButtons"; chatId: number; messageId: number } // [2026-11-12] the text stays, only the buttons go
  | { kind: "answer"; tapId: string; popup: string | null };

export class FakeTelegram implements TelegramApi {
  calls: TelegramCall[] = [];
  // Telegram IDs whose messages fail to send (e.g. the parent blocked the bot).
  failFor = new Set<number>();
  // [2026-11-12] When true, removing a message's buttons fails (e.g. Telegram is briefly down).
  failRemoveButtons = false;

  private nextMessageId = 500;
  async sendMessage(chatId: number, text: string, buttons: Button[] = []): Promise<number> {
    if (this.failFor.has(chatId)) throw new Error(`Telegram refused to send to ${chatId}`);
    this.calls.push({ kind: "send", chatId, text, buttons });
    return this.nextMessageId++; // Telegram's number for the new message
  }
  async editMessage(chatId: number, messageId: number, text: string): Promise<void> {
    this.calls.push({ kind: "edit", chatId, messageId, text });
  }
  // [2026-11-12] Keep the message's words, take away only its buttons.
  async removeButtons(chatId: number, messageId: number): Promise<void> {
    if (this.failRemoveButtons) throw new Error("Telegram refused to remove the buttons");
    this.calls.push({ kind: "removeButtons", chatId, messageId });
  }
  async answerTap(tapId: string, popup?: string): Promise<void> {
    this.calls.push({ kind: "answer", tapId, popup: popup ?? null });
  }
  sentTexts(): string[] {
    return this.calls.flatMap((c) => (c.kind === "send" ? [c.text] : []));
  }
}

// Builders for the Telegram updates our tests send in (shaped like Telegram's own JSON).
let updateCounter = 100;
export function textUpdate(telegramId: number, firstName: string, text: string, updateId = ++updateCounter): unknown {
  return {
    update_id: updateId,
    message: { message_id: updateId, chat: { id: telegramId, type: "private" }, from: { id: telegramId, is_bot: false, first_name: firstName }, text },
  };
}
export function tapUpdate(telegramId: number, data: string, messageId = 55, updateId = ++updateCounter): unknown {
  return {
    update_id: updateId,
    callback_query: {
      id: `tap-${updateId}`,
      from: { id: telegramId, is_bot: false, first_name: "Wei Lieh" },
      data,
      message: { message_id: messageId, chat: { id: telegramId, type: "private" } },
    },
  };
}
