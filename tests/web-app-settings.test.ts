// =============================================================================
// tests/web-app-settings.test.ts: My page's Settings tab
//
// What it checks: [2026-11-25] the owner-approved tests SE1 to SE14 for rule
// 9.9 (Settings, from the owner's clickable wireframe of 15 Nov): the list in
// four groups, each row's own page with Back, and what each control saves.
//   SE1 the list · SE2 a row's own page · SE3 pause · SE4 reminder times ·
//   SE5 behaviours · SE6 Weekly Wrap Up (a time only, rule 3.12) · SE7 name
//   and children · SE8 What we record · SE9 Coming soon rows · SE10 delete my
//   data · SE11 sign out · SE12 "Saved." · SE13 a failed save says so (rule
//   1.3) · SE14 safety (forged forms, no copies kept).
// It checks behaviour and words, not the look. The database is a pretend one
// (tests/helpers/web-app-fake-db.ts) that follows the same counting rules as
// migration 016; the real database is checked by T131 to T145.
// =============================================================================

import { beforeEach, describe, expect, it } from "vitest";
import { sgtInstant } from "../src/sgt.js";
import { createWebAppHandler, type WebResponse } from "../src/web-app/handler.js";
import { FakeWebDb } from "./helpers/web-app-fake-db.js";

const now = sgtInstant("2026-11-25", 21 * 60); // Wednesday 25 Nov 2026, 9:00 pm Singapore time
const COOKIE_SECRET = "Ck3_9xVq2mZ8pR1tY6wB4nH7cJ0sD5fG8aE2uK9iO1l";
const HOST = "family-habit-builder.vercel.app";

let db: FakeWebDb;
let told: { chat: number; paused: boolean }[];
let tellFails: boolean;
let handle: ReturnType<typeof createWebAppHandler>;
beforeEach(() => {
  db = new FakeWebDb();
  db.now = now;
  db.signIns.set(COOKIE_SECRET, { parentId: 7, ended: false });
  told = [];
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
const savedRedirect = (r: WebResponse) => {
  expect(r.status).toBe(303);
  expect(r.headers.location).toBe("/api/web-app?page=settings&saved=1");
};

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
  it("SE3 Pause turns pausing on and off, and the bot tells the parent in Telegram each time", async () => {
    const page = await get("page=settings&part=pause");
    expect(text(page)).toContain("While paused we send no reminders. Your photos, lines and weeks stay exactly as they are.");
    expect(page.body).toContain('role="switch" aria-checked="false"');
    savedRedirect(await save("part=pause&paused=on"));
    expect(db.settingsData.paused).toBe(true);
    expect(told).toEqual([{ chat: 2001, paused: true }]);
    expect(text(await get("page=settings"))).toContain("Pause reminders On");
    expect((await get("page=settings&part=pause")).body).toContain('role="switch" aria-checked="true"');
    savedRedirect(await save("part=pause&paused=off"));
    expect(db.settingsData.paused).toBe(false);
    expect(told.at(-1)).toEqual({ chat: 2001, paused: false });
  });

  it("SE3 if the Telegram line can't be sent, the pause is still saved and the page says Telegram wasn't told", async () => {
    tellFails = true;
    const r = await save("part=pause&paused=on");
    expect(r.status).toBe(303);
    expect(r.headers.location).toBe("/api/web-app?page=settings&saved=1&telegram=0");
    expect(db.settingsData.paused).toBe(true);
    expect(text(await get("page=settings&saved=1&telegram=0"))).toContain("Saved, but we couldn't tell you in Telegram.");
  });

  it("SE4 reminder times: each time with Remove, an Add a time list, and the rules explained in words", async () => {
    const page = await get("page=settings&part=times");
    const t = text(page);
    expect(t).toContain("School days 7:00 am Remove 7:00 pm Remove");
    expect(t).toContain("Weekends and holidays 9:00 am");
    expect(t).toContain("Up to 3 times a day, at least 1 hour apart. The times are shared by all your behaviours.");
    // The school-day add list offers only allowed times: 7:30 am is less than 1 hour from 7:00 am.
    const [school, weekend] = page.body.split("Weekends and holidays") as [string, string];
    expect(school).toContain('<option value="510">8:30 am</option>');
    expect(school).not.toContain('<option value="450">');
    // Removing the only weekend time is not offered.
    expect(weekend).not.toContain(">Remove<");

    savedRedirect(await save("part=times&schedule=school&action=add&minute=600"));
    expect(db.settingsData.schoolSlots).toEqual([420, 600, 1140]);
    savedRedirect(await save("part=times&schedule=school&action=remove&minute=600"));
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

    savedRedirect(await save("part=behaviours&quick=1&quick=2&quick_frequency=every_day&deliberate=4&deliberate_frequency=twice_a_week"));
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

  it("SE6 the Weekly Wrap Up page sets a Sunday time only, with no on/off switch (rule 3.12)", async () => {
    const page = await get("page=settings&part=wrap-up");
    expect(text(page)).toContain("A short summary of your week, sent on Sunday when you have logged something that week.");
    expect(page.body).not.toContain('role="switch"');
    expect(page.body).toContain('<option value="1200" selected>8:00 pm</option>');
    savedRedirect(await save("part=wrap-up&minute=1170"));
    expect(db.settingsData.wrapUpMinute).toBe(1170);
    expect((await save("part=wrap-up&minute=1185")).status).toBe(400);
    expect(db.settingsData.wrapUpMinute).toBe(1170);
  });
});

describe("About you (rule 9.9)", () => {
  it("SE7 the name and children can be edited and saved; a blank name is refused; no 4th child", async () => {
    expect((await get("page=settings&part=name")).body).toContain('value="Cara"');
    savedRedirect(await save("part=name&first_name=Cara%20Lim"));
    expect(db.settingsData.firstName).toBe("Cara Lim");
    const blank = await save("part=name&first_name=%20%20");
    expect(blank.status).toBe(400);
    expect(text(blank)).toContain("Please type a name.");
    expect(db.settingsData.firstName).toBe("Cara Lim");

    const kids = await get("page=settings&part=children");
    expect(kids.body).toMatch(/name="child-11"[^>]*value="Riley"/);
    expect(text(kids)).toContain("A first name or a nickname is enough.");
    savedRedirect(await save("part=children&child-11=Riley%20J&new=Sam"));
    expect(db.settingsData.children.map((c) => c.firstName)).toEqual(["Riley J", "Sam"]);
    savedRedirect(await save("part=children&child-11=Riley%20J&child-101=Sam&new=Max"));
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
  it("SE12 after a save the Settings list says ✅ Saved.", async () => {
    expect(text(await get("page=settings&saved=1"))).toContain("✅ Saved.");
    expect(text(await get("page=settings"))).not.toContain("Saved.");
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
