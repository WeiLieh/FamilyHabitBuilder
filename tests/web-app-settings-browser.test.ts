// =============================================================================
// tests/web-app-settings-browser.test.ts: the Settings fixes in a real browser
//
// What it checks: [2026-11-26] the two things only a real browser can show
// (owner-approved Settings fixes of 26 Nov, rule 9.9; Playwright approved as a
// test-only library, owner's Q1 A):
//   SB1 Behaviours (W2): with 2 quick boxes ticked, the 3rd is greyed out and
//       can't be ticked; unticking one brings it back.
//   SB2 Pause (W6, DEF-3): one tap slides the switch at once; a second tap
//       sends nothing more; the page reloads once, with the pause saved.
// Why a real browser: the greying and the slide are done by the page's one
// small script, which the other tests can't run. The browser (Chromium, with
// no window) asks for our pages, and every request is answered by our own
// handler with a pretend database, so nothing leaves this computer. The
// security rule (the Content Security Policy) is sent as on the real site, so
// these tests also prove the script is allowed by its fingerprint.
// =============================================================================

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import { sgtInstant } from "../src/sgt.js";
import { createWebAppHandler } from "../src/web-app/handler.js";
import { FakeWebDb } from "./helpers/web-app-fake-db.js";

const SITE = "https://fhb.test";
const COOKIE_SECRET = "Ck3_9xVq2mZ8pR1tY6wB4nH7cJ0sD5fG8aE2uK9iO1l";
const now = sgtInstant("2026-11-25", 21 * 60); // Wednesday 25 Nov 2026, 9:00 pm Singapore time

let browser: Browser;
let page: Page;
let db: FakeWebDb;
let told: boolean[];
let posts: string[];
let scriptErrors: string[];

beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
});

beforeEach(async () => {
  db = new FakeWebDb();
  db.now = now;
  db.signIns.set(COOKIE_SECRET, { parentId: 7, ended: false });
  told = [];
  posts = [];
  scriptErrors = [];
  const handle = createWebAppHandler({
    db,
    jwtSecret: "test-signing-secret-not-real-0123456789",
    now: () => now,
    photoOrigin: "https://abcd.supabase.co",
    tellPause: async (_chat, paused) => {
      told.push(paused);
    },
    tellHabits: async () => {},
  });
  const context = await browser.newContext();
  await context.addCookies([{ name: "__Host-fhb_sign_in", value: COOKIE_SECRET, url: SITE, secure: true, httpOnly: true, sameSite: "Lax" }]);
  // Every request the browser makes is answered by our handler, as Vercel would.
  await context.route(`${SITE}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    // Chromium labels a form sent from our own page "Sec-Fetch-Site: same-origin",
    // but Playwright's interception doesn't pass that label on, so the stand-in
    // adds it for pages on our test site (the forged-form check, SE14, stays
    // tested in tests/web-app-settings.test.ts).
    const fromOurPage = (req.frame().url() || "").startsWith(SITE);
    const headers = { ...(await req.allHeaders()), ...(fromOurPage ? { "sec-fetch-site": "same-origin" } : {}) };
    if (req.method() === "POST") posts.push(req.postData() ?? "");
    let r = await handle({ method: req.method(), url: url.pathname + url.search, headers: { ...headers, host: url.host }, body: req.postData() ?? "" });
    // After a save our answer says "go to this page" (a redirect). The browser
    // would fetch it from the made-up test address, which our stand-in can't
    // catch, so the stand-in fetches it from our handler instead. Only the
    // pause tests use this, and a pause sets no cookie.
    if (r.status === 303 && r.headers.location) {
      r = await handle({ method: "GET", url: r.headers.location, headers: { ...headers, host: url.host }, body: "" });
    }
    await route.fulfill({ status: r.status, headers: r.headers, body: r.body });
  });
  page = await context.newPage();
  // A script blocked by the security rule shows up here; there must be none.
  page.on("console", (m) => {
    if (m.type() === "error") scriptErrors.push(m.text());
  });
  page.on("pageerror", (e) => scriptErrors.push(e.message));
});

describe("Settings fixes in a real browser (rule 9.9, W2 and W6)", () => {
  it("SB1 with 2 quick behaviours ticked, the 3rd is greyed out and can't be ticked; unticking one brings it back", async () => {
    await page.goto(`${SITE}/api/web-app?page=settings&part=behaviours`);
    const box = (name: string) => page.getByRole("checkbox", { name });
    // Behaviour 1 is ticked already; tick a 2nd.
    await box("Praising effort").check();
    expect(await box("Bedtime chat").isDisabled()).toBe(true);
    expect(await page.locator("label.greyed").count()).toBe(1);
    await box("Bedtime chat").click({ force: true }); // a tap on a greyed box does nothing
    expect(await box("Bedtime chat").isChecked()).toBe(false);
    // Untick one: the 3rd can be chosen again.
    await box("Showing affection").uncheck();
    expect(await box("Bedtime chat").isDisabled()).toBe(false);
    expect(await page.locator("label.greyed").count()).toBe(0);
    await box("Bedtime chat").check();
    expect(await box("Bedtime chat").isChecked()).toBe(true);
    expect(scriptErrors).toEqual([]);
  });

  it("SB2 the pause switch slides at once, a second tap sends nothing more, and the page reloads once with the pause saved", async () => {
    await page.goto(`${SITE}/api/web-app?page=settings&part=pause`);
    const toggle = page.getByRole("switch");
    expect(await toggle.getAttribute("aria-checked")).toBe("false");
    // The reload: the form is sent, and our answer sends the browser back to the pause page.
    const reloaded = page.waitForResponse((r) => r.request().method() === "POST");
    await toggle.click();
    // It slides straight away, before the page is sent (0.2 seconds later).
    expect(await toggle.getAttribute("aria-checked")).toBe("true");
    await toggle.click(); // a repeated tap, ignored
    await reloaded;
    await page.waitForLoadState("load");
    expect(posts).toEqual(["part=pause&paused=on"]);
    expect(told).toEqual([true]);
    expect(db.settingsData.paused).toBe(true);
    expect(await page.getByRole("switch").getAttribute("aria-checked")).toBe("true");
    expect(await page.getByRole("dialog").count()).toBe(0); // no pop-up after a pause (W6)
    expect(scriptErrors).toEqual([]);
  });
});
