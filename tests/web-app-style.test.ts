// =============================================================================
// tests/web-app-style.test.ts: My page carries the owner's look, and only that
//
// What it checks: [2026-11-24] the owner-approved tests ST1 to ST7 for the
// look of 24 Nov (docs/CONTEXT.md, "UI decisions"; CLAUDE.md rule 6):
//   ST1 My page's four pages carry the one stylesheet, and the security rule
//       lets through exactly that stylesheet, by its fingerprint (option A)
//   ST2 the stylesheet uses only the approved colours and the system font
//   ST3 the page stays white in dark mode
//   ST4 nothing relies on a one-off style="…" attribute (it would be blocked)
//   ST5 the tab bar marks the tab you are on
//   ST6 the sign-in, expired-link, signed-out and error pages stay plain
//   ST7 on "Are you sure?", only Delete is the warning-red button
// These check that the look is applied and kept to what was approved, not
// how it looks to the eye: the owner checks that on the phone (UAT).
// =============================================================================

import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { sgtInstant } from "../src/sgt.js";
import { createWebAppHandler, type WebResponse } from "../src/web-app/handler.js";
import { STYLESHEET } from "../src/web-app/style.js";
import { FakeWebDb } from "./helpers/web-app-fake-db.js";

const now = sgtInstant("2026-11-12", 20 * 60); // Thursday 12 Nov 2026, 8:00 pm Singapore time
const COOKIE_SECRET = "Ck3_9xVq2mZ8pR1tY6wB4nH7cJ0sD5fG8aE2uK9iO1l";
const HOST = "family-habit-builder.vercel.app";

// The colours the owner approved on 24 Nov (L2 to L8 and the warning red).
const APPROVED_COLOURS = ["#1F2328", "#4F5660", "#1F6F5C", "#9CC7BC", "#D5D9DE", "#E6E9ED", "#FFFFFF", "#B42318"];

let db: FakeWebDb;
let handle: ReturnType<typeof createWebAppHandler>;
beforeEach(() => {
  db = new FakeWebDb();
  db.now = now;
  db.signIns.set(COOKIE_SECRET, { parentId: 7, ended: false });
  db.firstName = "Cara";
  db.weekData = {
    children: ["Riley"],
    logs: [{ log_id: 1, habit: "Talking with children", day: "2026-11-10", line: "We laughed a lot", photo: null }],
    reflections: [{ reflection_id: 11, day: "2026-11-11", text: "A good week" }],
    moment: { photo: null, line: { moment_line_id: 21, text: "Best week so far" } },
    olderWeeks: 0,
  };
  db.connection = [{ monday: "2026-11-02", rating: 4 }];
  handle = createWebAppHandler({ db, jwtSecret: "test-signing-secret-not-real-0123456789", now: () => now, photoOrigin: "https://abcd.supabase.co", tellPause: async () => {} });
});

const signedIn = { host: HOST, cookie: `__Host-fhb_sign_in=${COOKIE_SECRET}` };
const get = (query: string, headers: Record<string, string> = signedIn) => handle({ method: "GET", url: `/api/web-app?${query}`, headers, body: "" });
const myPages = () => Promise.all(["page=week", "page=confirm&kind=line&id=1", "page=habits", "page=settings"].map((q) => get(q)));
const fingerprint = `'sha256-${createHash("sha256").update(STYLESHEET).digest("base64")}'`;

describe("My page's look (owner, 24 Nov; CLAUDE.md rule 6)", () => {
  it("ST1 Week so far, 'Are you sure?', Habits so far and Settings carry the one stylesheet; the security rule allows exactly it", async () => {
    for (const r of await myPages()) {
      expect(r.status).toBe(200);
      expect(r.body).toContain(`<style>${STYLESHEET}</style>`);
      expect(r.body.match(/<style>/g)).toHaveLength(1); // one stylesheet, no other
      expect(r.body).not.toMatch(/<link[^>]*stylesheet/i); // nothing fetched from elsewhere
      const policy = r.headers["content-security-policy"]!;
      expect(policy).toContain(`style-src ${fingerprint};`);
      expect(policy).not.toContain("unsafe-inline"); // option A, not the looser option B
      expect(policy).toContain("default-src 'none'"); // everything else still blocked
    }
  });

  it("ST2 the stylesheet uses only the approved colours and the phone's system font", () => {
    const colours = STYLESHEET.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? [];
    expect(colours.length).toBeGreaterThan(0);
    for (const c of colours) expect(APPROVED_COLOURS).toContain(c.toUpperCase());
    expect(STYLESHEET).not.toMatch(/rgba?\(|hsla?\(/); // no colour written another way
    expect(STYLESHEET).toContain("font:14px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif");
    expect(STYLESHEET.match(/font-family|system-ui/g)).toHaveLength(1); // the one font, set once
    expect(STYLESHEET).not.toMatch(/@import|@font-face|url\(/); // nothing downloaded
  });

  it("ST3 the page stays white in dark mode", () => {
    expect(STYLESHEET).toContain("color-scheme:light");
    expect(STYLESHEET).not.toContain("prefers-color-scheme");
  });

  it("ST4 no element relies on a one-off style attribute (the security rule would block it)", async () => {
    for (const r of await myPages()) expect(r.body).not.toMatch(/\sstyle=/i);
  });

  it("ST5 the tab bar marks the tab you are on, and only that one", async () => {
    const [week, , habits, settings] = await myPages();
    const current = (r: WebResponse) => [...r.body.matchAll(/page=(\w+)" aria-current="page"/g)].map((m) => m[1]);
    expect(current(week!)).toEqual(["week"]);
    expect(current(habits!)).toEqual(["habits"]);
    expect(current(settings!)).toEqual(["settings"]);
  });

  it("ST6 the sign-in, expired-link, signed-out and error pages stay plain", async () => {
    const open = await get("page=open", { host: HOST });
    const expired = await handle({ method: "POST", url: "/api/web-app?page=sign-in", headers: { host: HOST, "sec-fetch-site": "same-origin" }, body: "secret=" });
    const signedOut = await handle({ method: "POST", url: "/api/web-app?page=sign-out", headers: { host: HOST, "sec-fetch-site": "same-origin" }, body: "" });
    const notSignedIn = await get("page=week", { host: HOST });
    db.fail = "week";
    const failed = await get("page=week");
    expect([open.status, expired.status, signedOut.status, notSignedIn.status, failed.status]).toEqual([200, 410, 200, 401, 503]);
    for (const r of [open, expired, signedOut, notSignedIn, failed]) expect(r.body).not.toContain("<style>");
  });

  it("ST7 on 'Are you sure?', only Delete is the warning-red button; Cancel is the outlined one", async () => {
    const ask = await get("page=confirm&kind=line&id=1");
    const markup = ask.body.replace(/<style>[\s\S]*<\/style>/, ""); // the page itself, without the stylesheet
    expect(markup.match(/\bdanger\b/g)).toHaveLength(1);
    expect(ask.body).toMatch(/<button class="pill danger" type="submit">Delete<\/button>/);
    expect(ask.body).toMatch(/<a class="pill" href="[^"]*">Cancel<\/a>/);
    // The red is used by that one class only.
    expect(STYLESHEET.match(/var\(--danger\)/g)).toHaveLength(2); // its fill and its border
    expect(STYLESHEET).toMatch(/\.pill\.danger\{background:var\(--danger\);border-color:var\(--danger\);/);
  });
});
