// =============================================================================
// tests/web-app-sign-in.test.ts: the Web app's sign-in, per-parent pass and safe pages
//
// What it checks: [2026-11-15] the owner-approved tests W2 to W10 (W1, the
// /mypage link, is in tests/telegram-bot-log-any-time.test.ts), plus P1 and P2
// for the per-parent pass (rule 9.8, option A):
//   W2  opening the link shows one button and nothing personal, and uses nothing up
//   W3  pressing it signs in with a protected cookie for the sign-in's length
//   W4  a used, expired or missing link says "This link has expired. …"
//   W5  the link's secret never reaches the logs
//   W6  a page that needs sign-in, without one, is refused and says so
//   W7  every page tells browsers and caches not to keep a copy
//   W8  Sign out ends the sign-in in the database and clears the cookie
//   W9  no Web app file uses the master key
//   W10 a database failure is shown as a failure, never as made-up data
//   W11 a sign-in or sign-out posted from another website is refused (privacy review)
//   P1  the pass is signed, names one parent, and expires after 10 minutes
//   P2  each signed-in page asks the database with that parent's pass only
// The database is a pretend one (a "fake") with the same menu as the real
// one (src/datastore/web-app-store.ts), so no real data is touched.
// [2026-11-15] The fake moved to tests/helpers/web-app-fake-db.ts (shared with
// the Week so far tests). P2 was rewritten when Sign out moved to the Settings
// tab (rule 9.2); the other tests are unchanged.
// =============================================================================

import { createHmac } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PASS_SECONDS, SIGN_IN_DAYS } from "../src/settings.js";
import { sgtInstant } from "../src/sgt.js";
import { createWebAppHandler, type WebRequest, type WebResponse } from "../src/web-app/handler.js";
import { FakeWebDb } from "./helpers/web-app-fake-db.js";

const JWT_SECRET = "test-signing-secret-not-real-0123456789";
const LINK_SECRET = "Lk3_9xVq2mZ8pR1tY6wB4nH7cJ0sD5fG8aE2uK9iO1l"; // 43 characters, as the bot makes them
const COOKIE = "__Host-fhb_sign_in";
const now = sgtInstant("2026-11-12", 20 * 60); // Thursday 12 Nov, 8:00 pm Singapore time
const EXPIRED = "This link has expired. Tap My page in Telegram for a new one.";

let db: FakeWebDb;
let handle: (req: WebRequest) => Promise<WebResponse>;
let logged: string[];
beforeEach(() => {
  db = new FakeWebDb();
  db.now = now;
  db.links.set(LINK_SECRET, 7);
  handle = createWebAppHandler({ db, jwtSecret: JWT_SECRET, now: () => now, photoOrigin: "https://abcd.supabase.co", tellPause: async () => {}, tellHabits: async () => {} });
  logged = [];
  vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => void logged.push(a.join(" ")));
  vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => void logged.push(a.join(" ")));
});
afterEach(() => vi.restoreAllMocks());

const get = (page: string, cookie?: string) =>
  handle({ method: "GET", url: `/api/web-app?page=${page}`, headers: cookie ? { cookie: `${COOKIE}=${cookie}` } : {}, body: "" });
const post = (page: string, body: string, cookie?: string) =>
  handle({
    method: "POST",
    url: `/api/web-app?page=${page}`,
    headers: { "content-type": "application/x-www-form-urlencoded", ...(cookie ? { cookie: `${COOKIE}=${cookie}` } : {}) },
    body,
  });
// Sign in through the button and return the cookie's value.
async function signIn(): Promise<string> {
  const r = await post("sign-in", `secret=${LINK_SECRET}`);
  const value = /__Host-fhb_sign_in=([^;]*)/.exec(r.headers["set-cookie"] ?? "")?.[1];
  if (!value) throw new Error("no cookie set");
  return value;
}
// Read a pass (a JWT: three dot-separated parts) and check its signature.
function readPass(pass: string): { header: Record<string, unknown>; payload: Record<string, unknown>; signedRight: boolean } {
  const [h, p, sig] = pass.split(".");
  const expected = createHmac("sha256", JWT_SECRET).update(`${h}.${p}`).digest("base64url");
  return {
    header: JSON.parse(Buffer.from(h!, "base64url").toString()),
    payload: JSON.parse(Buffer.from(p!, "base64url").toString()),
    signedRight: sig === expected,
  };
}

describe("Opening the link (rule 9.3)", () => {
  it("W2 shows one button and nothing personal, and doesn't use the link up (so Telegram's preview can't)", async () => {
    const r = await get("open");
    expect(r.status).toBe(200);
    expect(r.body.match(/<button/g)).toHaveLength(1);
    expect(db.calls).toEqual([]); // nothing asked of the database: no name to show, nothing used up
    expect(r.body).not.toContain("Cara");
    // The secret is read in the browser from the part after "#" and posted with the button.
    expect(r.body).toContain("location.hash");
    expect(r.body).toContain('action="/api/web-app?page=sign-in"');
  });

  it("W3 pressing the button signs in: a protected cookie for the sign-in's 30 days, then on to My page", async () => {
    const r = await post("sign-in", `secret=${LINK_SECRET}`);
    expect(r.status).toBe(303);
    expect(r.headers.location).toBe("/api/web-app?page=week");
    const [linkSecret, cookieSecret] = db.calls[0]!.args as string[];
    expect(linkSecret).toBe(LINK_SECRET);
    expect(cookieSecret).toMatch(/^[A-Za-z0-9_-]{43}$/); // a new random secret, not the link's
    expect(cookieSecret).not.toBe(LINK_SECRET);
    expect(r.headers["set-cookie"]).toBe(`${COOKIE}=${cookieSecret}; Max-Age=${SIGN_IN_DAYS * 86_400}; Path=/; Secure; HttpOnly; SameSite=Lax`);
  });

  it("W4 a used link, an unknown link and a press with no secret all say the link has expired, and set no cookie", async () => {
    await signIn(); // uses the link
    const again = await post("sign-in", `secret=${LINK_SECRET}`);
    const unknown = await post("sign-in", `secret=${"x".repeat(43)}`);
    const missing = await post("sign-in", "");
    for (const r of [again, unknown, missing]) {
      expect(r.status).toBe(410);
      expect(r.body).toContain(EXPIRED);
      expect(r.headers["set-cookie"]).toBeUndefined();
    }
    expect(db.calls.filter((c) => c.what === "redeem")).toHaveLength(3); // the empty press never reaches the database
  });

  it("W5 the link's secret and the cookie never reach the logs, even when the database repeats them in an error", async () => {
    db.fail = "redeem";
    db.errorText = `could not use link ${LINK_SECRET}`;
    const r = await post("sign-in", `secret=${LINK_SECRET}`);
    expect(r.status).toBe(503);
    expect(logged.length).toBeGreaterThan(0); // the failure is logged (rule 1.3)…
    expect(logged.join("\n")).not.toContain(LINK_SECRET); // …without the secret
    db.fail = null;
    const cookie = await signIn().catch(() => "");
    db.links.set(LINK_SECRET, 7);
    db.fail = "signInParent";
    db.errorText = `bad sign-in ${cookie}`;
    await get("week", cookie || "Zz9_".repeat(11));
    expect(logged.join("\n")).not.toMatch(/[A-Za-z0-9_-]{43}/);
  });
});

describe("Signed-in pages (rules 9.3, 9.8)", () => {
  it("W6 without a sign-in, or with an unknown or ended one, My page is refused and says so; the database isn't read", async () => {
    const none = await get("week");
    const unknown = await get("week", "Q".repeat(43));
    const cookie = await signIn();
    db.signIns.get(cookie)!.ended = true;
    const ended = await get("week", cookie);
    for (const r of [none, unknown, ended]) {
      expect(r.status).toBe(401);
      expect(r.body).toContain("Tap My page in Telegram");
    }
    expect(db.calls.some((c) => c.what === "week")).toBe(false);
  });

  it("P1 the pass is signed with the signing secret, names only this parent, and expires after 10 minutes", async () => {
    const cookie = await signIn();
    await get("week", cookie);
    const [pass, monday] = db.calls.find((c) => c.what === "week")!.args as string[];
    const { header, payload, signedRight } = readPass(pass!);
    expect(signedRight).toBe(true);
    expect(header).toEqual({ alg: "HS256", typ: "JWT" });
    const seconds = Math.floor(now.getTime() / 1000);
    expect(payload).toEqual({ role: "authenticated", aud: "authenticated", parent_id: "7", iat: seconds, exp: seconds + PASS_SECONDS });
    expect(PASS_SECONDS).toBe(600);
    expect(monday).toBe("2026-11-09"); // this week's Monday, Singapore time
  });

  it("P2 My page asks the database with that parent's pass and shows only that parent's first name, made safe for the page", async () => {
    db.firstName = "<b>Cara</b>";
    const cookie = await signIn();
    const r = await get("week", cookie);
    expect(r.status).toBe(200);
    expect(r.body).toContain("Hi &lt;b&gt;Cara&lt;/b&gt;");
    expect(r.body).not.toContain("<b>Cara</b>");
    // [2026-11-15] Rewritten (Week so far, rule 9.2): Sign out moved to the Settings tab; My page links to it.
    expect(r.body).toContain('href="/api/web-app?page=settings"');
    // The week was read with this parent's pass only (rule 9.8).
    const [pass] = db.calls.find((c) => c.what === "week")!.args as string[];
    expect(readPass(pass!).payload.parent_id).toBe("7");
  });

  it("W8 Sign out ends the sign-in in the database and clears the cookie; the old cookie no longer works", async () => {
    const cookie = await signIn();
    const r = await post("sign-out", "", cookie);
    expect(db.calls.at(-1)).toEqual({ what: "endSignIn", args: [cookie] });
    expect(r.headers["set-cookie"]).toBe(`${COOKIE}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`);
    expect(r.body).toContain("You're signed out.");
    expect((await get("week", cookie)).status).toBe(401);
  });

  it("W10 when the database fails, the page says it didn't work: no name, no made-up page, and not 'signed out'", async () => {
    const cookie = await signIn();
    db.fail = "week";
    const weekFails = await get("week", cookie);
    db.fail = "signInParent";
    const checkFails = await get("week", cookie);
    db.fail = "endSignIn";
    const signOutFails = await post("sign-out", "", cookie);
    for (const r of [weekFails, checkFails, signOutFails]) {
      expect(r.status).toBe(503);
      expect(r.body).toContain("Sorry, that didn't work. Please try again.");
      expect(r.body).not.toContain("Cara");
      expect(r.body).not.toContain("signed out");
    }
    expect(signOutFails.headers["set-cookie"]).toBeUndefined(); // the sign-in still stands, so the cookie stays
  });
});

describe("Forged forms (privacy review, 15 Nov)", () => {
  it("W11 a sign-in or sign-out posted from another website is refused, and nothing is used up or ended", async () => {
    const cookie = await signIn();
    db.links.set(LINK_SECRET, 7);
    const before = db.calls.length;
    const forged = (page: string, body: string, headers: Record<string, string>) =>
      handle({ method: "POST", url: `/api/web-app?page=${page}`, headers: { host: "family-habit-builder.vercel.app", cookie: `${COOKIE}=${cookie}`, ...headers }, body });
    const answers = [
      await forged("sign-in", `secret=${LINK_SECRET}`, { "sec-fetch-site": "cross-site" }),
      await forged("sign-in", `secret=${LINK_SECRET}`, { origin: "https://evil.example" }),
      await forged("sign-out", "", { "sec-fetch-site": "same-site" }),
      await forged("sign-out", "", { origin: "null" }),
    ];
    for (const r of answers) {
      expect(r.status).toBe(403);
      expect(r.headers["set-cookie"]).toBeUndefined();
    }
    expect(db.calls.length).toBe(before); // nothing reached the database
    // Our own page's form still works.
    const own = await forged("sign-out", "", { "sec-fetch-site": "same-origin", origin: "https://family-habit-builder.vercel.app" });
    expect(own.status).toBe(200);
  });
});

// [2026-11-15] New after the owner's UAT (U58 refused with 403): a real
// iPhone press from our own page says Sec-Fetch-Site "same-origin" but
// Origin "null" (because our pages ask for no referrer). It must be let in.
describe("Our own page's button on a phone (UAT U58, 15 Nov)", () => {
  it("W12 a press labelled same-origin is let in even when its Origin is 'null', and signs in", async () => {
    const r = await handle({
      method: "POST",
      url: "/api/web-app?page=sign-in",
      headers: { host: "family-habit-builder.vercel.app", "sec-fetch-site": "same-origin", origin: "null", "content-type": "application/x-www-form-urlencoded" },
      body: `secret=${LINK_SECRET}`,
    });
    expect(r.status).toBe(303);
    expect(r.headers["set-cookie"]).toMatch(/^__Host-fhb_sign_in=/);
  });
});

describe("Every page (rules 9.6, 9.8)", () => {
  it("W7 every answer tells browsers and caches not to keep a copy", async () => {
    const cookie = await signIn();
    db.links.set(LINK_SECRET, 7);
    const answers = [
      await get("open"),
      await post("sign-in", `secret=${LINK_SECRET}`),
      await post("sign-in", "secret=used"),
      await get("week", cookie),
      await get("week"),
      await post("sign-out", "", cookie),
      await get("no-such-page"),
      await handle({ method: "PUT", url: "/api/web-app?page=week", headers: {}, body: "" }),
    ];
    for (const r of answers) {
      expect(r.headers["cache-control"]).toBe("no-store, private");
      expect(r.headers.pragma).toBe("no-cache");
      expect(r.headers["referrer-policy"]).toBe("no-referrer");
    }
    expect(answers[6]!.status).toBe(404);
    expect(answers[7]!.status).toBe(405);
  });

  it("W9 no Web app file uses the master key (the Supabase service role key) or the bot's database connection", () => {
    const files = [
      ...readdirSync("src/web-app").filter((f) => f.endsWith(".ts")).map((f) => `src/web-app/${f}`),
      "src/datastore/web-app-store.ts",
      "api/web-app.ts",
    ];
    expect(files.length).toBeGreaterThan(3);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toContain("SERVICE_ROLE");
      expect(text, file).not.toContain("createSupabaseStore");
    }
  });
});
