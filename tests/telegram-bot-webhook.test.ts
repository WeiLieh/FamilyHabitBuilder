// =============================================================================
// tests/telegram-bot-webhook.test.ts: the bot's doorway (thin slice 1)
//
// [2026-11-11] Every Telegram message arrives at this web address. Only
// Telegram, which knows our secret, may use it (rule 5.9). Telegram must always
// get "received" back for real updates, or it keeps resending them.
// =============================================================================

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createWebhookHandler } from "../src/telegram-bot/web-handlers.js";
import { sgtInstant } from "../src/sgt.js";
import { FakeStore } from "./helpers/datastore-fake-store.js";
import { FakeTelegram, textUpdate } from "./helpers/telegram-bot-fakes.js";

const SECRET = "our-webhook-secret";
let store: FakeStore;
let telegram: FakeTelegram;
let server: Server;
let url: string;

beforeAll(async () => {
  server = createServer(
    createWebhookHandler({ webhookSecret: SECRET, makeDeps: () => ({ store, telegram, now: sgtInstant("2026-11-11", 600) }) }),
  );
  await new Promise<void>((r) => server.listen(0, r));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/telegram-bot`;
});
afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
});
beforeEach(() => {
  store = new FakeStore();
  telegram = new FakeTelegram();
  store.invites.set("WELCOME-1", null);
});

function post(body: unknown, secret: string | null = SECRET): Promise<Response> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret !== null) headers["x-telegram-bot-api-secret-token"] = secret;
  return fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
}

describe("The webhook doorway (rule 5.9, thin slice 1)", () => {
  it("refuses a request without our secret, or with the wrong one, and saves or sends nothing", async () => {
    expect((await post(textUpdate(4242, "Wei Lieh", "/start WELCOME-1"), null)).status).toBe(401);
    expect((await post(textUpdate(4242, "Wei Lieh", "/start WELCOME-1"), "guess")).status).toBe(401);
    expect(store.parents).toEqual([]);
    expect(telegram.calls).toEqual([]);
  });

  it("answers text it doesn't handle with 'Unrecognised text.', and saves nothing", async () => {
    const res = await post(textUpdate(4242, "Wei Lieh", "hello"));
    expect(res.status).toBe(200);
    expect(telegram.sentTexts()).toEqual(["Unrecognised text."]);
    expect(store.parents).toEqual([]);
  });

  it("answers 'received' and stays silent for updates that aren't a person's message (an edit, a block)", async () => {
    const edited = { update_id: 9001, edited_message: { message_id: 1, chat: { id: 4242, type: "private" }, text: "x" } };
    const blocked = { update_id: 9002, my_chat_member: { chat: { id: 4242, type: "private" } } };
    expect((await post(edited)).status).toBe(200);
    expect((await post(blocked)).status).toBe(200);
    expect((await post("not even json")).status).toBe(200);
    expect(telegram.calls).toEqual([]);
  });

  it("saves the same Telegram message only once if Telegram delivers it twice", async () => {
    const once = textUpdate(4242, "Wei Lieh", "/start WELCOME-1", 7777);
    await post(once);
    await post(once);
    expect(store.parents).toHaveLength(1);
    expect(store.events.filter((e) => e.type === "signed_up")).toHaveLength(1);
  });
});
