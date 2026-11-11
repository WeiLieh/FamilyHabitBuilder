// =============================================================================
// src/telegram-bot/telegram-api.ts: talking to Telegram with plain web requests
//
// What it does: [2026-11-11] the three things the bot asks Telegram to do in
// thin slice 1: send a message (with buttons), edit a message the bot sent
// (which also removes its buttons), and answer a button tap (optionally with a
// short pop-up). Telegram is called with plain web requests, no library
// (docs/CONTEXT.md, "Approved libraries").
//
// Why it is an interface: the tests swap in a pretend Telegram that only
// writes down what would have been sent (tests/helpers/telegram-bot-fakes.ts).
// A refused request is thrown as an error, never ignored (rule 1.3).
// =============================================================================

// One button under a message: the words shown, and the short code Telegram
// sends back to us when it is tapped (e.g. "done:2026-11-11").
export type Button = { text: string; data: string };

export interface TelegramApi {
  sendMessage(chatId: number, text: string, buttons?: Button[]): Promise<void>;
  editMessage(chatId: number, messageId: number, text: string): Promise<void>;
  answerTap(tapId: string, popup?: string): Promise<void>;
}

// The real Telegram. The bot token is a secret: it only ever comes from Vercel's
// settings, and is never written to a log.
export function createTelegramApi(botToken: string, fetchFn: typeof fetch = fetch): TelegramApi {
  // Every Telegram Bot API call is a POST to https://api.telegram.org/bot<token>/<method>.
  async function call(method: string, body: Record<string, unknown>): Promise<void> {
    const res = await fetchFn(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Telegram explains the problem in "description"; the token is not in it.
      const detail = await res.text().catch(() => "");
      throw new Error(`Telegram ${method} failed (${res.status}): ${detail.slice(0, 200)}`);
    }
  }
  // Buttons are sent as one row, side by side ("inline keyboard").
  const keyboard = (buttons: Button[]) => ({
    inline_keyboard: [buttons.map((b) => ({ text: b.text, callback_data: b.data }))],
  });
  return {
    sendMessage: (chatId, text, buttons = []) =>
      call("sendMessage", { chat_id: chatId, text, ...(buttons.length > 0 ? { reply_markup: keyboard(buttons) } : {}) }),
    // Editing without reply_markup removes the buttons.
    editMessage: (chatId, messageId, text) => call("editMessageText", { chat_id: chatId, message_id: messageId, text }),
    answerTap: (tapId, popup) =>
      call("answerCallbackQuery", { callback_query_id: tapId, ...(popup ? { text: popup, show_alert: true } : {}) }),
  };
}
