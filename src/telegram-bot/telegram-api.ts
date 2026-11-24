// =============================================================================
// src/telegram-bot/telegram-api.ts: talking to Telegram with plain web requests
//
// What it does: [2026-11-11] the things the bot asks Telegram to do in
// thin slice 1: send a message (with buttons; [2026-11-12] in rows, or link buttons), edit a message the bot sent
// (which also removes its buttons), [2026-11-12] remove only a message's
// buttons while keeping its words (rule 5.10), and answer a button tap
// (optionally with a short pop-up). Telegram is called with plain web requests, no library
// (docs/CONTEXT.md, "Approved libraries").
// [2026-11-14] B1: send a message with the keyboard of behaviour buttons under
// the chat (a "reply keyboard", rule 5.1), and change one person's Menu (the
// list of commands next to the typing box, B1-D8).
// [2026-11-15] Style C: messages and edits are sent in Telegram's formatting
// mode (HTML), so <b>bold</b> shows as bold; the words make anything typed safe
// first (src/telegram-bot/words.ts, esc). And a reaction on one of the parent's
// messages (rule 5.14).
//
// [2026-11-24] Photos: download the photo a parent sent (getFile, then the
// file itself), so it can be saved in our own private store.
//
// Why it is an interface: the tests swap in a pretend Telegram that only
// writes down what would have been sent (tests/helpers/telegram-bot-fakes.ts).
// A refused request is thrown as an error, never ignored (rule 1.3).
// =============================================================================

// One button under a message: the words shown, and the short code Telegram
// sends back to us when it is tapped (e.g. "done:2026-11-11").
// [2026-11-12] Or a link button, which opens a web page instead (e.g. "Open my page ↗").
export type Button = { text: string; data: string } | { text: string; url: string };
// [2026-11-12] Buttons can be one row side by side (a plain list), or several
// rows, one list per row (a list of lists), e.g. one behaviour per row.
export type Buttons = Button[] | Button[][];
// [2026-11-14] One line of the Menu: the command without its "/", and what it does.
export type MenuCommand = { command: string; description: string };

export interface TelegramApi {
  // Returns Telegram's number for the new message, so it can be edited later.
  sendMessage(chatId: number, text: string, buttons?: Buttons): Promise<number>;
  // Change a message's words. [2026-11-12] With buttons, they replace the old
  // ones (a tick on screen 4); without, the buttons are removed.
  editMessage(chatId: number, messageId: number, text: string, buttons?: Buttons): Promise<void>;
  // [2026-11-12] Keep the message's words, take away its buttons (rule 5.10).
  removeButtons(chatId: number, messageId: number): Promise<void>;
  answerTap(tapId: string, popup?: string): Promise<void>;
  // [2026-11-14] Send a message and put the keyboard under the chat: one button
  // per label, one per row, kept until replaced (rule 5.1). Returns its number.
  sendWithKeyboard(chatId: number, text: string, labels: string[]): Promise<number>;
  // [2026-11-14] Give this one chat its own Menu; null takes it back to
  // everyone's default Menu (B1-D8).
  setMenu(chatId: number, commands: MenuCommand[] | null): Promise<void>;
  // [2026-11-15] Add one emoji reaction to a message in this chat (rule 5.14).
  react(chatId: number, messageId: number, emoji: string): Promise<void>;
  // [2026-11-24] The bytes of a photo the parent sent, by Telegram's file number.
  downloadPhoto(fileId: string): Promise<Uint8Array>;
}

// The real Telegram. The bot token is a secret: it only ever comes from Vercel's
// settings, and is never written to a log.
export function createTelegramApi(botToken: string, fetchFn: typeof fetch = fetch): TelegramApi {
  // Every Telegram Bot API call is a POST to https://api.telegram.org/bot<token>/<method>.
  async function call(method: string, body: Record<string, unknown>): Promise<unknown> {
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
    return res.json();
  }
  // Buttons are sent as rows ("inline keyboard"); a plain list is one row.
  // A tap button carries its code ("callback_data"); a link button its web address.
  const keyboard = (buttons: Buttons) => {
    const rows = (buttons.length > 0 && Array.isArray(buttons[0]) ? buttons : [buttons]) as Button[][];
    return { inline_keyboard: rows.map((row) => row.map((b) => ("url" in b ? { text: b.text, url: b.url } : { text: b.text, callback_data: b.data }))) };
  };
  // Telegram answers { ok: true, result: { message_id: … } }; anything else is a failure.
  const messageNumber = (reply: unknown): number => {
    const id = (reply as { result?: { message_id?: unknown } }).result?.message_id;
    if (typeof id !== "number") throw new Error("Telegram sendMessage gave no message number");
    return id;
  };
  return {
    async sendMessage(chatId, text, buttons = []) {
      return messageNumber(await call("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...(buttons.length > 0 ? { reply_markup: keyboard(buttons) } : {}) }));
    },
    // [2026-11-14] A "reply keyboard": buttons that sit in place of the phone's
    // keyboard. A tap sends the label as an ordinary message. is_persistent
    // keeps it showing; resize_keyboard makes it only as tall as it needs.
    async sendWithKeyboard(chatId, text, labels) {
      const reply_markup = { keyboard: labels.map((label) => [{ text: label }]), is_persistent: true, resize_keyboard: true };
      return messageNumber(await call("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", reply_markup }));
    },
    // [2026-11-14] A Menu for one chat only ("scope" chat); deleting it shows the default again.
    async setMenu(chatId, commands) {
      const scope = { type: "chat", chat_id: chatId };
      if (commands === null) await call("deleteMyCommands", { scope });
      else await call("setMyCommands", { commands, scope });
    },
    // Editing without reply_markup removes the buttons; with it, they are replaced.
    async editMessage(chatId, messageId, text, buttons) {
      await call("editMessageText", { chat_id: chatId, message_id: messageId, text, parse_mode: "HTML", ...(buttons ? { reply_markup: keyboard(buttons) } : {}) });
    },
    // [2026-11-12] editMessageReplyMarkup changes only the buttons; an empty
    // list of buttons leaves the words exactly as they were (rule 5.10).
    async removeButtons(chatId, messageId) {
      await call("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
    },
    // [2026-11-15] setMessageReaction: one emoji under the parent's message (rule 5.14).
    async react(chatId, messageId, emoji) {
      await call("setMessageReaction", { chat_id: chatId, message_id: messageId, reaction: [{ type: "emoji", emoji }] });
    },
    // [2026-11-24] Two steps: getFile says where Telegram keeps the file, then
    // the file is fetched. The address holds the bot token, so it is never
    // written into an error or a log.
    async downloadPhoto(fileId) {
      const reply = (await call("getFile", { file_id: fileId })) as { result?: { file_path?: unknown } };
      const path = reply.result?.file_path;
      if (typeof path !== "string" || path === "") throw new Error("Telegram getFile gave no file path");
      const res = await fetchFn(`https://api.telegram.org/file/bot${botToken}/${path}`);
      if (!res.ok) throw new Error(`Downloading the photo from Telegram failed (${res.status})`);
      return new Uint8Array(await res.arrayBuffer());
    },
    async answerTap(tapId, popup) {
      await call("answerCallbackQuery", { callback_query_id: tapId, ...(popup ? { text: popup, show_alert: true } : {}) });
    },
  };
}
