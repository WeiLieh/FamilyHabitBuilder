// =============================================================================
// tests/web-app-settings.test.ts: My page's Settings tab
//
// What it checks: [2026-11-25] the owner-approved tests SE1 to SE15 for rule
// 9.9 (Settings, from the owner's clickable wireframe of 15 Nov): the list in
// four groups, each row's own page with Back, and what each control saves.
//   SE1 the list · SE2 a row's own page · SE3 pause · SE4 reminder times ·
//   SE5 behaviours · SE6 Weekly Wrap Up (a time only, rule 3.12) · SE7 name
//   and children · SE8 What we record · SE9 Coming soon rows · SE10 delete my
//   data · SE11 sign out · SE12 "Saved." · SE13 a failed save says so (rule
//   1.3) · SE14 safety (forged forms, no copies kept) · SE15 the new habit
//   buttons in Telegram after a Behaviours save (owner, 25 Nov).
// [2026-11-26] The Settings fixes (owner, 26 Nov, "all as recommended"; W1
// to W7, DEF-1 to DEF-3; rule 9.9): SE16 the Saved pop-up on the row's own
// page · SE17 its "Telegram wasn't told" line · SE18 the quick boxes grey out
// at 2 · SE19 the server still refuses a 3rd (DEF-1) · SE20 a 🗑 per child ·
// SE21 it asks first · SE22 removing a child · SE23 the one small page
// script, allowed by its fingerprint · SE24 the same picks tell Telegram
// nothing (DEF-2) · SE25 a pause that is already so changes nothing (DEF-3).
// Rewritten for the fixes (CLAUDE.md rule 12): SE3 (pause: no pop-up, back to
// its own page), SE4 (a 🗑 per time), SE12 ("Saved." is a pop-up on the row's
// page, not on the list), SE15 (back to Behaviours). What happens in a real
// browser (greying, the slide) is in tests/web-app-settings-browser.test.ts.
// It checks behaviour and words, not the look. The database is a pretend one
// (tests/helpers/web-app-fake-db.ts) that follows the same counting rules as
// migration 016; the real database is checked by T131 to T145.
// =============================================================================

import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { sgtInstant } from "../src/sgt.js";
import { createWebAppHandler, type WebResponse } from "../src/web-app/handler.js";
import { FakeWebDb } from "./helpers/web-app-fake-db.js";

const now = sgtInstant("2026-11-25", 21 * 60); // Wednesday 25 Nov 2026, 9:00 pm Singapore time
const COOKIE_SECRET = "Ck3_9xVq2mZ8pR1tY6wB4nH7cJ0sD5fG8aE2uK9iO1l";
const HOST = "family-habit-builder.vercel.app";

let db: FakeWebDb;
let told: { chat: number; paused: boolean }[];
let toldHabits: { chat: number; names: string[] }[];
let tellFails: boolean;
let handle: ReturnType<typeof createWebAppHandler>;
beforeEach(() => {
  db = new FakeWebDb();
  db.now = now;
  db.signIns.set(COOKIE_SECRET, { parentId: 7, ended: false });
  told = [];
  toldHabits = [];
  tellFails = false;
  handle = createWebAppHandler({
    db,
    jwtSecret: "test-signing-secret-not-real-0123456789",
    now: () => now,
    photoOrigin: "https://abcd.supabase.co",
    // The bot's short Telegram line after a pause change (owner, 25 Nov).
    tellPause: async (chat, paused) => {
      if (tellFails) throw new Error("Telegram unavailable");
      told.push({ chat, paused });
    },
    // [2026-11-25] The bot's line and new habit buttons after a Behaviours save (owner, 25 Nov).
    tellHabits: async (chat, names) => {
      if (tellFails) throw new Error("Telegram unavailable");
      toldHabits.push({ chat, names });
    },
  });
});

const get = (query: string) => handle({ method: "GET", url: `/api/web-app?${query}`, headers: { host: HOST, cookie: `__Host-fhb_sign_in=${COOKIE_SECRET}` }, body: "" });
const post = (query: string, body: string, extra: Record<string, string> = {}) =>
  handle({
    method: "POST",
    url: `/api/web-app?${query}`,
    headers: { host: HOST, cookie: `__Host-fhb_sign_in=${COOKIE_SECRET}`, "sec-fetch-site": "same-origin", ...extra },
    body,
  });
const save = (body: string) => post("page=settings-save", body);
const text = (r: WebResponse) => r.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
// [2026-11-25] "Saved." travels in a short-lived cookie our server sets, never
// in the address, so a crafted link can't make the page say it (privacy review item 3).
const NOTICE = "__Host-fhb_notice";
const noticeOf = (r: WebResponse) => /__Host-fhb_notice=([a-z-]+);/.exec(r.headers["set-cookie"] ?? "")?.[1] ?? null;
// [2026-11-26] After a save the parent stays on that row's own page (W1).
const savedRedirect = (r: WebResponse, part: string, notice = "saved") => {
  expect(r.status).toBe(303);
  expect(r.headers.location).toBe(`/api/web-app?page=settings&part=${part}`);
  expect(noticeOf(r)).toBe(notice);
  expect(r.headers["set-cookie"]).toContain("Max-Age=60; Path=/; Secure; HttpOnly; SameSite=Lax");
};
// The Saved pop-up (W1, L14): a dialog with a tick, the words and OK.
const popUp = (r: WebResponse) => /<div class="dim" role="dialog"[\s\S]*?<\/div><\/div>/.exec(r.body)?.[0] ?? null;
const calledChange = () => db.calls.filter((c) => c.what === "changeSetting").length;
const getWithNotice = (query: string, notice: string) =>
  handle({ method: "GET", url: `/api/web-app?${query}`, headers: { host: HOST, cookie: `__Host-fhb_sign_in=${COOKIE_SECRET}; ${NOTICE}=${notice}` }, body: "" });

describe("The Settings list (rule 9.9)", () => {
  it("SE1 shows the four groups in the wireframe's order, each row with its current value", async () => {
    const r = await get("page=settings");
    expect(r.status).toBe(200);
    const t = text(r);
    const order = ["About you", "Your name", "Children", "Reminders", "Behaviours", "Reminder times", "Pause reminders", "Weekly Wrap Up",
      "Privacy", "What we record", "Download my memories", "Help us improve", "Delete my data", "Account", "Sign out"];
    let at = -1;
    for (const label of order) {
      const i = t.indexOf(label, at + 1);
      expect(i, `${label} should come after the label before it`).toBeGreaterThan(at);
      at = i;
    }
    expect(t).toContain("Your name Cara");
    expect(t).toContain("Children Riley");
    expect(t).toContain("Behaviours 1 quick");
    expect(t).toContain("Reminder times 2 school-day, 1 weekend");
    expect(t).toContain("Pause reminders Off");
    expect(t).toContain("Weekly Wrap Up Sun 8:00 pm");
    expect(t).toContain("You stay signed in on this phone for 30 days.");
    // The tab bar, with Settings as the current tab.
    expect(r.body).toContain('href="/api/web-app?page=settings" aria-current="page"');
  });

  it("SE2 every row opens its own page with Back, and the tab bar is hidden there", async () => {
    const list = await get("page=settings");
    for (const part of ["name", "children", "behaviours", "times", "pause", "wrap-up", "consent", "delete", "sign-out"]) {
      expect(list.body).toContain(`href="/api/web-app?page=settings&amp;part=${part}"`);
      const r = await get(`page=settings&part=${part}`);
      expect(r.status, part).toBe(200);
      expect(r.body, part).toContain('href="/api/web-app?page=settings"');
      expect(text(r), part).toContain("Back");
      expect(r.body, part).not.toContain("<nav>");
    }
    expect((await get("page=settings&part=nonsense")).status).toBe(404);
  });

  it("SE9 'Download my memories' and 'Help us improve' say Coming soon and can't be tapped", async () => {
    const r = await get("page=settings");
    expect(text(r)).toContain("Download my memories Coming soon");
    expect(text(r)).toContain("Help us improve Coming soon");
    expect(r.body).not.toMatch(/<a[^>]*>[^<]*Download my memories/);
    expect(r.body).not.toMatch(/<a[^>]*>[^<]*Help us improve/);
  });
});

describe("Reminders (rule 9.9)", () => {
  // [2026-11-26] Rewritten (W6, rule 12): no Save button and no pop-up; back to the pause page.
  it("SE3 Pause turns pausing on and off with the switch alone, and the bot tells the parent in Telegram each time", async () => {
    const page = await get("page=settings&part=pause");
    expect(text(page)).toContain("While paused we send no reminders. Your photos, lines and weeks stay exactly as they are.");
    expect(page.body).toContain('role="switch" aria-checked="false"');
    expect(page.body).toContain("data-slide");
    expect(text(page)).not.toContain("Save");
    const on = await save("part=pause&paused=on");
    expect(on.status).toBe(303);
    expect(on.headers.location).toBe("/api/web-app?page=settings&part=pause");
    expect(noticeOf(on)).toBeNull(); // the switch and the Telegram line are the confirmation
    expect(db.settingsData.paused).toBe(true);
    expect(told).toEqual([{ chat: 2001, paused: true }]);
    expect(text(await get("page=settings"))).toContain("Pause reminders On");
    const again = await get("page=settings&part=pause");
    expect(again.body).toContain('role="switch" aria-checked="true"');
    expect(popUp(again)).toBeNull();
    await save("part=pause&paused=off");
    expect(db.settingsData.paused).toBe(false);
    expect(told.at(-1)).toEqual({ chat: 2001, paused: false });
  });

  it("SE3 if the Telegram line can't be sent, the pause is still saved and the pause page says Telegram wasn't told", async () => {
    tellFails = true;
    savedRedirect(await save("part=pause&paused=on"), "pause", "saved-not-told");
    expect(db.settingsData.paused).toBe(true);
    expect(text({ body: popUp(await getWithNotice("page=settings&part=pause", "saved-not-told")) ?? "" } as WebResponse)).toContain(
      "Saved, but we couldn't tell you in Telegram.",
    );
  });

  // [2026-11-26] Rewritten (W5, rule 12): a 🗑 instead of "Remove", and back to the times page.
  it("SE4 reminder times: a 🗑 per time, an Add a time list, and the rules explained in words", async () => {
    const page = await get("page=settings&part=times");
    const t = text(page);
    expect(t).toContain("School days 7:00 am 7:00 pm");
    expect(t).not.toContain("Remove");
    expect(page.body).toMatch(/<button class="bin" type="submit" aria-label="Remove 7:00 am"><svg/);
    expect(page.body).toMatch(/<button class="bin" type="submit" aria-label="Remove 7:00 pm"><svg/);
    expect(t).toContain("Weekends and holidays 9:00 am");
    expect(t).toContain("Up to 3 times a day, at least 1 hour apart. The times are shared by all your behaviours.");
    // The school-day add list offers only allowed times: 7:30 am is less than 1 hour from 7:00 am.
    const [school, weekend] = page.body.split("Weekends and holidays") as [string, string];
    expect(school).toContain('<option value="510">8:30 am</option>');
    expect(school).not.toContain('<option value="450">');
    // Removing the only weekend time is not offered.
    expect(weekend).not.toContain('class="bin"');

    savedRedirect(await save("part=times&schedule=school&action=add&minute=600"), "times");
    expect(db.settingsData.schoolSlots).toEqual([420, 600, 1140]);
    savedRedirect(await save("part=times&schedule=school&action=remove&minute=600"), "times");
    expect(db.settingsData.schoolSlots).toEqual([420, 1140]);

    const tooClose = await save("part=times&schedule=school&action=add&minute=450");
    expect(tooClose.status).toBe(400);
    expect(text(tooClose)).toContain("must be at least 1 hour apart");
    expect(db.settingsData.schoolSlots).toEqual([420, 1140]);
    const notATime = await save("part=times&schedule=school&action=add&minute=1305");
    expect(notATime.status).toBe(400);
    const last = await save("part=times&schedule=non_school&action=remove&minute=540");
    expect(last.status).toBe(400);
    expect(text(last)).toContain("Please keep at least 1 time");
    expect(db.settingsData.nonSchoolSlots).toEqual([540]);
  });

  it("SE5 behaviours: the real names, up to 2 quick, one deliberate or None, how often, at least 1 kept", async () => {
    const page = await get("page=settings&part=behaviours");
    const t = text(page);
    for (const name of ["Showing affection", "Praising effort", "Bedtime chat", "One-on-one time"]) expect(t).toContain(name);
    expect(t).toContain("Choose up to 2.");
    expect(page.body).toMatch(/type="checkbox" name="quick" value="1" checked/);
    expect(page.body).toMatch(/type="radio" name="deliberate" value="none" checked/);
    expect(page.body).toMatch(/type="radio" name="quick_frequency" value="every_2_days" checked/);

    savedRedirect(await save("part=behaviours&quick=1&quick=2&quick_frequency=every_day&deliberate=4&deliberate_frequency=twice_a_week"), "behaviours");
    expect(db.settingsData.picks).toEqual([
      { nudgeId: 1, frequency: "every_day" },
      { nudgeId: 2, frequency: "every_day" },
      { nudgeId: 4, frequency: "twice_a_week" },
    ]);

    const three = await save("part=behaviours&quick=1&quick=2&quick=3&quick_frequency=every_day&deliberate=none&deliberate_frequency=once_a_week");
    expect(three.status).toBe(400);
    expect(text(three)).toContain("Choose up to 2 quick behaviours.");
    const none = await save("part=behaviours&quick_frequency=every_day&deliberate=none&deliberate_frequency=once_a_week");
    expect(none.status).toBe(400);
    expect(text(none)).toContain("Please keep at least 1 behaviour.");
    const madeUp = await save("part=behaviours&quick=1&quick_frequency=hourly&deliberate=none&deliberate_frequency=once_a_week");
    expect(madeUp.status).toBe(400);
    expect(db.settingsData.picks).toHaveLength(3);
  });

  // [2026-11-25] Owner-approved (25 Nov): the keyboard in Telegram follows a Behaviours change.
  // [2026-11-26] Rewritten (W1, rule 12): the parent then stays on Behaviours.
  it("SE15 after a Behaviours save, the bot sends its line with the new habit buttons, in the order chosen", async () => {
    savedRedirect(await save("part=behaviours&quick=2&quick=1&quick_frequency=every_day&deliberate=4&deliberate_frequency=once_a_week"), "behaviours");
    expect(toldHabits).toEqual([{ chat: 2001, names: ["Praising effort", "Showing affection", "One-on-one time"] }]);
    expect(told).toEqual([]);
  });

  it("SE15 if Telegram can't be told, the habits are still saved and the page says Telegram wasn't told", async () => {
    tellFails = true;
    const r = await save("part=behaviours&quick=2&quick_frequency=every_day&deliberate=none&deliberate_frequency=once_a_week");
    savedRedirect(r, "behaviours", "saved-not-told");
    expect(db.settingsData.picks).toEqual([{ nudgeId: 2, frequency: "every_day" }]);
  });

  it("SE15 a Behaviours save that fails sends nothing to Telegram", async () => {
    db.fail = "changeSetting";
    const r = await save("part=behaviours&quick=2&quick_frequency=every_day&deliberate=none&deliberate_frequency=once_a_week");
    expect(r.status).toBe(503);
    expect(toldHabits).toEqual([]);
  });

  it("SE6 the Weekly Wrap Up page sets a Sunday time only, with no on/off switch (rule 3.12)", async () => {
    const page = await get("page=settings&part=wrap-up");
    expect(text(page)).toContain("A short summary of your week, sent on Sunday when you have logged a habit, a reflection or a moment that week.");
    expect(page.body).not.toContain('role="switch"');
    expect(page.body).toContain('<option value="1200" selected>8:00 pm</option>');
    savedRedirect(await save("part=wrap-up&minute=1170"), "wrap-up");
    expect(db.settingsData.wrapUpMinute).toBe(1170);
    expect((await save("part=wrap-up&minute=1185")).status).toBe(400);
    expect(db.settingsData.wrapUpMinute).toBe(1170);
  });
});

describe("About you (rule 9.9)", () => {
  it("SE7 the name and children can be edited and saved; a blank name is refused; no 4th child", async () => {
    expect((await get("page=settings&part=name")).body).toContain('value="Cara"');
    savedRedirect(await save("part=name&first_name=Cara%20Lim"), "name");
    expect(db.settingsData.firstName).toBe("Cara Lim");
    const blank = await save("part=name&first_name=%20%20");
    expect(blank.status).toBe(400);
    expect(text(blank)).toContain("Please type a name.");
    expect(db.settingsData.firstName).toBe("Cara Lim");

    const kids = await get("page=settings&part=children");
    expect(kids.body).toMatch(/name="child-11"[^>]*value="Riley"/);
    expect(text(kids)).toContain("A first name or a nickname is enough.");
    savedRedirect(await save("part=children&child-11=Riley%20J&new=Sam"), "children");
    expect(db.settingsData.children.map((c) => c.firstName)).toEqual(["Riley J", "Sam"]);
    savedRedirect(await save("part=children&child-11=Riley%20J&child-101=Sam&new=Max"), "children");
    expect(db.settingsData.children).toHaveLength(3);
    // With 3 children, no empty box to add another.
    expect((await get("page=settings&part=children")).body).not.toContain('name="new"');
    const tooLong = await save(`part=children&child-11=${"x".repeat(41)}`);
    expect(tooLong.status).toBe(400);
  });
});

describe("Privacy and account (rule 9.9)", () => {
  it("SE8 What we record: the wording, the date agreed, the Terms link, and 'to withdraw, delete your data'", async () => {
    const r = await get("page=settings&part=consent");
    const t = text(r);
    expect(t).toContain("The habits you log, and any lines, reflections or weekly moment you add.");
    expect(t).toContain("You agreed on 12 Nov 2026.");
    expect(t).toContain("To withdraw it, delete your data.");
    expect(r.body).toContain('href="https://family-habit-builder.vercel.app/terms.html"');
  });

  it("SE10 delete my data: what goes, then 'Are you sure?' with a box to tick; photos go first, then everything, then signed out", async () => {
    db.photoStore = new Set(["7/a.jpg", "7/a-small.jpg"]);
    const first = await get("page=settings&part=delete");
    expect(text(first)).toContain("Your habit logs, photos, lines, reflections and weekly moments");
    expect(first.body).toContain('href="/api/web-app?page=settings&amp;part=delete-sure"');
    const sure = await get("page=settings&part=delete-sure");
    expect(text(sure)).toContain("I understand this cannot be undone");
    expect(sure.body).toContain('action="/api/web-app?page=delete-my-data"');

    const unticked = await post("page=delete-my-data", "");
    expect(unticked.status).toBe(400);
    expect(text(unticked)).toContain("Please tick the box first.");
    expect(db.deleted).toBe(false);

    const done = await post("page=delete-my-data", "understood=yes");
    expect(done.status).toBe(200);
    expect(text(done)).toContain("Your data has been deleted");
    expect(done.headers["set-cookie"]).toContain("Max-Age=0");
    // Photos first, then the records.
    const order = db.calls.map((c) => c.what).filter((w) => ["allPhotoFiles", "removePhotoFiles", "deleteMyData"].includes(w));
    expect(order).toEqual(["allPhotoFiles", "removePhotoFiles", "deleteMyData"]);
    expect(db.photoStore.size).toBe(0);
    expect(db.deleted).toBe(true);
  });

  it("SE10 if the photo files can't be removed, nothing is deleted and the page says it didn't work", async () => {
    db.photoStore = new Set(["7/a.jpg"]);
    db.fail = "removePhotoFiles";
    const r = await post("page=delete-my-data", "understood=yes");
    expect(r.status).toBe(503);
    expect(text(r)).toContain("Sorry, that didn't work.");
    expect(db.deleted).toBe(false);
    expect(r.headers["set-cookie"]).toBeUndefined();
  });

  it("SE11 Sign out has its own 'Sign out of this phone?' page with Yes and Cancel", async () => {
    const r = await get("page=settings&part=sign-out");
    expect(text(r)).toContain("Sign out of this phone?");
    expect(text(r)).toContain("Your reminders and everything you have saved stay as they are.");
    expect(r.body).toContain('action="/api/web-app?page=sign-out"');
    expect(text(r)).toContain("Yes, sign out");
    expect(r.body).toContain('href="/api/web-app?page=settings">Cancel');
  });
});

describe("Saving safely (rules 1.3, 9.6, 9.9)", () => {
  // [2026-11-25] Rewritten (privacy review item 3, owner: "yes ok"): the notice comes from our cookie, not the address.
  // [2026-11-26] Rewritten again (W1, rule 12): it is a pop-up on the row's own page; the list no longer shows it.
  it("SE12 after a save the row's page shows the Saved pop-up once; the list never does; a crafted address can't make it show", async () => {
    const shown = await getWithNotice("page=settings&part=name", "saved");
    expect(popUp(shown)).not.toBeNull();
    expect(shown.headers["set-cookie"]).toContain(`${NOTICE}=; Max-Age=0`); // shown once, then cleared
    expect(popUp(await get("page=settings&part=name"))).toBeNull();
    expect(text(await getWithNotice("page=settings", "saved"))).not.toContain("Saved");
    expect(popUp(await get("page=settings&part=name&saved=1&telegram=0"))).toBeNull();
    expect(popUp(await getWithNotice("page=settings&part=name", "made-up"))).toBeNull();
    // The list and a failed read clear it too, so an old "Saved." can't show later.
    expect((await getWithNotice("page=settings", "saved")).headers["set-cookie"]).toContain(`${NOTICE}=; Max-Age=0`);
    db.fail = "settings";
    expect((await getWithNotice("page=settings&part=name", "saved")).headers["set-cookie"]).toContain(`${NOTICE}=; Max-Age=0`);
  });

  it("SE13 a failed save or read says it didn't work, and never shows the change as done", async () => {
    db.fail = "changeSetting";
    const r = await save("part=wrap-up&minute=1170");
    expect(r.status).toBe(503);
    expect(text(r)).toContain("Sorry, that didn't work. Please try again.");
    expect(db.settingsData.wrapUpMinute).toBe(1200);
    expect(told).toEqual([]);
    db.fail = "settings";
    const read = await get("page=settings");
    expect(read.status).toBe(503);
    expect(text(read)).not.toContain("Pause reminders");
  });

  it("SE14 a form from another website is refused; every page says 'do not store'; no sign-in shows nothing", async () => {
    const forged = await post("page=settings-save", "part=pause&paused=on", { "sec-fetch-site": "cross-site" });
    expect(forged.status).toBe(403);
    expect(db.settingsData.paused).toBe(false);
    const forgedDelete = await post("page=delete-my-data", "understood=yes", { "sec-fetch-site": "cross-site" });
    expect(forgedDelete.status).toBe(403);
    expect(db.deleted).toBe(false);
    for (const q of ["page=settings", "page=settings&part=times", "page=settings&part=delete-sure"]) {
      expect((await get(q)).headers["cache-control"]).toBe("no-store, private");
    }
    const signedOut = await handle({ method: "GET", url: "/api/web-app?page=settings", headers: { host: HOST }, body: "" });
    expect(signedOut.status).toBe(401);
    expect(text(signedOut)).not.toContain("Cara");
    // What a parent typed is shown, never obeyed.
    db.settingsData.firstName = "<b>Cara</b>";
    expect((await get("page=settings")).body).toContain("&lt;b&gt;Cara&lt;/b&gt;");
  });
});

// [2026-11-26] The Settings fixes (owner, 26 Nov, "all as recommended"; W1 to W7, DEF-1 to DEF-3).
describe("Settings fixes: the Saved pop-up (W1)", () => {
  it("SE16 every Save leads back to that row's own page, where a pop-up says Saved. with OK; OK stays on the page, Back goes to the list", async () => {
    const saves: [string, string][] = [
      ["name", "part=name&first_name=Cara%20Lim"],
      ["children", "part=children&child-11=Riley%20J"],
      ["behaviours", "part=behaviours&quick=2&quick_frequency=every_day&deliberate=none&deliberate_frequency=once_a_week"],
      ["times", "part=times&schedule=school&action=add&minute=600"],
      ["times", "part=times&schedule=school&action=remove&minute=600"],
      ["wrap-up", "part=wrap-up&minute=1170"],
    ];
    for (const [part, body] of saves) {
      savedRedirect(await save(body), part);
      const page = await getWithNotice(`page=settings&part=${part}`, "saved");
      const pop = popUp(page);
      expect(pop, part).not.toBeNull();
      expect(pop!, part).toContain('aria-modal="true"');
      expect(pop!, part).toContain('<span class="dot on"'); // the tick in a filled green circle (L14)
      expect(text({ body: pop! } as WebResponse), part).toContain("Saved.");
      expect(pop!, part).toContain(`href="/api/web-app?page=settings&amp;part=${part}">OK</a>`);
      expect(page.body, part).toContain('class="back" href="/api/web-app?page=settings"');
    }
  });

  it("SE17 when Telegram can't be told, the pop-up says so instead of plain Saved.", async () => {
    const page = await getWithNotice("page=settings&part=behaviours", "saved-not-told");
    const pop = text({ body: popUp(page) ?? "" } as WebResponse);
    expect(pop).toContain("Saved, but we couldn't tell you in Telegram.");
    expect(pop).not.toMatch(/Saved\.\s*OK/);
  });
});

describe("Settings fixes: Behaviours (W2, DEF-1)", () => {
  it("SE18 the quick boxes are one group that allows 2, and the hint says to untick one to choose another", async () => {
    const page = await get("page=settings&part=behaviours");
    expect(page.body).toMatch(/<div class="box list" data-max="2">(<label class="choice"><input type="checkbox" name="quick"[^]*?<\/label>){3}<\/div>/);
    expect(text(page)).toContain("Choose up to 2. Untick one to choose another.");
  });

  it("SE19 a 3rd quick behaviour sent anyway is still refused: nothing saved, Telegram not told (DEF-1)", async () => {
    const three = await save("part=behaviours&quick=1&quick=2&quick=3&quick_frequency=every_day&deliberate=none&deliberate_frequency=once_a_week");
    expect(three.status).toBe(400);
    expect(text(three)).toContain("Choose up to 2 quick behaviours.");
    expect(popUp(three)).toBeNull();
    expect(db.settingsData.picks).toEqual([{ nudgeId: 1, frequency: "every_2_days" }]);
    expect(toldHabits).toEqual([]);
  });

  it("SE24 a Behaviours save with the same picks changes nothing and tells Telegram nothing, but still says Saved. (DEF-2)", async () => {
    savedRedirect(await save("part=behaviours&quick=1&quick_frequency=every_2_days&deliberate=none&deliberate_frequency=once_a_week"), "behaviours");
    expect(calledChange()).toBe(0);
    expect(toldHabits).toEqual([]);
    // A real change is still sent.
    await save("part=behaviours&quick=1&quick_frequency=every_day&deliberate=none&deliberate_frequency=once_a_week");
    expect(calledChange()).toBe(1);
    expect(toldHabits).toHaveLength(1);
  });
});

describe("Settings fixes: Children (W3, W4)", () => {
  beforeEach(() => {
    db.settingsData.children = [{ id: 11, firstName: "Riley" }, { id: 12, firstName: "<i>Sam</i>" }];
  });

  it("SE20 each name has a 🗑 beside it, but the last child has none (at least 1 stays)", async () => {
    const page = await get("page=settings&part=children");
    expect(page.body).toMatch(/<a class="bin" aria-label="Remove Riley" href="\/api\/web-app\?page=settings&amp;part=children&amp;remove=11"><svg/);
    expect(page.body).toContain('aria-label="Remove &lt;i&gt;Sam&lt;/i&gt;" href="/api/web-app?page=settings&amp;part=children&amp;remove=12"');
    db.settingsData.children = [{ id: 11, firstName: "Riley" }];
    expect((await get("page=settings&part=children")).body).not.toContain('class="bin"');
  });

  it("SE21 the 🗑 first asks in a pop-up 'Remove [name]? Their name is deleted for good.' with Cancel and Remove; asking deletes nothing", async () => {
    const ask = await get("page=settings&part=children&remove=12");
    expect(ask.status).toBe(200);
    const pop = popUp(ask)!;
    expect(text({ body: pop } as WebResponse)).toContain("Remove &lt;i&gt;Sam&lt;/i&gt;? Their name is deleted for good.");
    expect(pop).toContain('href="/api/web-app?page=settings&amp;part=children">Cancel</a>');
    expect(pop).toMatch(/<form method="post" action="\/api\/web-app\?page=settings-save"><input type="hidden" name="part" value="children-remove"><input type="hidden" name="child" value="12"><button class="pill danger" type="submit">Remove<\/button><\/form>/);
    expect(calledChange()).toBe(0);
    expect(db.settingsData.children).toHaveLength(2);
    // A child that isn't theirs, or not a number: not found, nothing asked.
    expect((await get("page=settings&part=children&remove=99")).status).toBe(404);
    expect((await get("page=settings&part=children&remove=abc")).status).toBe(404);
  });

  it("SE22 Remove deletes the child (and every earlier name, in the database), then the Saved pop-up on Children; the last child can't be removed", async () => {
    savedRedirect(await save("part=children-remove&child=12"), "children");
    expect(db.calls.find((c) => c.what === "changeSetting")!.args[1]).toEqual({ kind: "remove-child", childId: 12 });
    expect(db.settingsData.children).toEqual([{ id: 11, firstName: "Riley" }]);
    const last = await save("part=children-remove&child=11");
    expect(last.status).toBe(400);
    expect(text(last)).toContain("Please keep at least 1 child.");
    expect(db.settingsData.children).toHaveLength(1);
    expect((await save("part=children-remove&child=99")).status).toBe(400);
    expect(calledChange()).toBe(1);
  });
});

describe("Settings fixes: the pause switch and the page script (W6, DEF-3)", () => {
  it("SE25 a pause that is already so (a repeated tap) changes nothing and sends nothing to Telegram (DEF-3)", async () => {
    await save("part=pause&paused=on");
    expect(told).toHaveLength(1);
    const again = await save("part=pause&paused=on");
    expect(again.status).toBe(303);
    expect(again.headers.location).toBe("/api/web-app?page=settings&part=pause");
    expect(calledChange()).toBe(1);
    expect(told).toHaveLength(1);
  });

  it("SE23 Behaviours and Pause carry one small script, allowed only by its fingerprint; no other page has it, and the forms still post without it", async () => {
    const policyHashes = (r: WebResponse) => /script-src ([^;]*)/.exec(r.headers["content-security-policy"]!)![1]!.split(" ");
    for (const part of ["behaviours", "pause"]) {
      const r = await get(`page=settings&part=${part}`);
      const scripts = [...r.body.matchAll(/<script>([^<]*)<\/script>/g)].map((m) => m[1]!);
      expect(scripts, part).toHaveLength(1);
      expect(policyHashes(r), part).toContain(`'sha256-${createHash("sha256").update(scripts[0]!).digest("base64")}'`);
      expect(r.headers["content-security-policy"], part).toContain("default-src 'none'");
      expect(r.headers["content-security-policy"], part).not.toContain("unsafe-inline");
      expect(r.body, part).toContain('method="post" action="/api/web-app?page=settings-save"');
    }
    for (const q of ["page=settings", "page=settings&part=name", "page=settings&part=times", "page=week"]) {
      expect((await get(q)).body, q).not.toContain("<script>");
    }
  });
});
