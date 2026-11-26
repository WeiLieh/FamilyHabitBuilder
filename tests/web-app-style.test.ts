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
//   [2026-11-26] ST8 the Settings fixes' look (owner, 26 Nov): the pop-up on
//       a page dimmed with black at 40% (L14), greyed choices at 40% (L15),
//       the switch sliding in 0.2 seconds and the outline dustbin (L16)
// [2026-11-26] ST2's list gains black at 40% (#00000066), the dimming the
// owner approved in L14; no other colour is added.
// [2026-11-26] The look of 25 Nov (UI decisions L17 to L22, owner "all as
// recommended", 26 Nov). ST2 rewritten for it (owner: "rewrite ST2"): the new
// colours, the rounded font, and colours written as rgba(...) only inside the
// three approved shadows. New: ST9 cards and big photos · ST10 the day strip
// (today's outline) · ST11 the tab bar and dustbins at 40% · ST12 the older
// weeks button and tiles (each habit its own colour and icon, by its code) ·
// ST13 a habit with no colour yet gets a plain tile with its name.
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

// [2026-11-26] The colours the owner approved: L17 (page, cards, text, accent,
// ring, dividers), L5's earlier-weeks bars, the warning red, L14's black at
// 40%, and L22's reflection tile and the nine habit tiles (background, icon).
const HABIT_TILES: Record<string, [string, string]> = {
  SAF: ["#FFE4EA", "#D6456B"], GAT: ["#FFEBD2", "#C9731B"], DPR: ["#E0ECFF", "#3B6FD0"],
  TWC: ["#EDE6FB", "#7452C6"], SQT: ["#FFF3C4", "#A07A0C"], IAC: ["#D9F0F2", "#1C8394"],
  SGE: ["#E8F0D3", "#5C7D1F"], ITE: ["#F2E4D8", "#8A5636"], ASD: ["#E5E9EF", "#4F5F78"],
};
const APPROVED_COLOURS = [
  "#F2F7F5", "#FFFFFF", "#1D2B27", "#5F706B", "#1E7A6C", "#D3DEDA", "#EAF0EE", "#9CC7BC", "#B42318", "#00000066", "#DDEEEA",
  ...Object.values(HABIT_TILES).flat(),
];
// The three approved shadows (L19, and the tab bar's, owner 26 Nov), the only place rgba(...) may appear.
const SHADOWS = {
  card: "0 2px 4px rgba(20,60,52,.05),0 10px 24px rgba(20,60,52,.08)",
  photo: "0 10px 24px rgba(20,60,52,.25)",
  tabBar: "0 -2px 4px rgba(20,60,52,.05)",
};
const ROUNDED_FONT = "ui-rounded,Nunito,'Segoe UI',system-ui,-apple-system,Roboto,sans-serif";

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
  handle = createWebAppHandler({ db, jwtSecret: "test-signing-secret-not-real-0123456789", now: () => now, photoOrigin: "https://abcd.supabase.co", tellPause: async () => {}, tellHabits: async () => {} });
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

  // [2026-11-26] Rewritten for the look of 25 Nov (owner: "rewrite ST2").
  it("ST2 the stylesheet uses only the approved colours and shadows, and the soft rounded system font", () => {
    const colours = STYLESHEET.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? [];
    expect(colours.length).toBeGreaterThan(0);
    for (const c of colours) expect(APPROVED_COLOURS).toContain(c.toUpperCase());
    // rgba(...) only inside the approved shadows; no other way of writing a colour.
    let rest = STYLESHEET;
    for (const sh of Object.values(SHADOWS)) rest = rest.split(`box-shadow:${sh}`).join("");
    expect(rest).not.toMatch(/rgba?\(|hsla?\(/);
    for (const sh of Object.values(SHADOWS)) expect(STYLESHEET).toContain(`box-shadow:${sh}`);
    expect(STYLESHEET).toContain(`font:14px/1.45 ${ROUNDED_FONT}`);
    expect(STYLESHEET.match(/font-family|ui-rounded/g)).toHaveLength(1); // the one font list, set once
    expect(STYLESHEET).not.toMatch(/@import|@font-face|url\(/); // nothing downloaded
    expect(STYLESHEET).toMatch(/h1\{[^}]*font-weight:600/); // headings semi-bold (L18)
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

  it("ST8 the Settings fixes' look: a pop-up on a page dimmed black at 40%, greyed choices at 40%, a 0.2-second slide", async () => {
    expect(STYLESHEET).toMatch(/\.dim\{position:fixed;inset:0;background:#00000066;/); // L14
    expect(STYLESHEET).toContain(".greyed{opacity:.4}"); // L15
    expect(STYLESHEET).toContain(".knob{position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:50%;background:var(--card);transition:left .2s}"); // L16 [2026-11-26] white is now named --card (L17)
    // The pop-up is a box (12px corners) with the tick in a filled green circle and an OK pill.
    db.settingsData.firstName = "Cara";
    const saved = await get("page=settings&part=name", { ...signedIn, cookie: `${signedIn.cookie}; __Host-fhb_notice=saved` });
    expect(saved.body).toMatch(/<div class="dim" role="dialog" aria-modal="true" aria-labelledby="pop-words"><div class="box pop"><span class="dot on" aria-hidden="true">✓<\/span>/);
    expect(saved.body).toMatch(/<a class="pill wide" href="[^"]*">OK<\/a>/);
    // The times page's dustbins are the same outline dustbin as Week so far's (L12).
    const times = await get("page=settings&part=times");
    const bin = '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>';
    expect(times.body).toContain(bin);
  });

  // ---- [2026-11-26] The look of 25 Nov (L17 to L22) ----

  it("ST9 Week so far's cards: white, no border, the soft shadow, 20px corners; big photos no border, the strong shadow; Settings boxes keep a thin border and 12px corners", async () => {
    expect(STYLESHEET).toContain(".box{border:1px solid var(--ring);border-radius:12px;padding:16px;background:var(--card)}");
    expect(STYLESHEET).toContain(`.card{border:0;border-radius:20px;box-shadow:${SHADOWS.card}}`);
    expect(STYLESHEET).toContain(`.photo{display:block;width:100%;height:auto;border:0;border-radius:20px;box-shadow:${SHADOWS.photo};margin:8px 0}`);
    expect(STYLESHEET).toMatch(/html\{background:var\(--page\)\}/);
    expect(STYLESHEET).toContain("--page:#F2F7F5");
    const week = await get("page=week");
    const boxes = [...week.body.matchAll(/class="(box[^"]*)"/g)].map((m) => m[1]);
    expect(boxes.length).toBeGreaterThan(0);
    for (const c of boxes) expect(c).toMatch(/\bcard\b/); // every box on Week so far is a card
    const settings = await get("page=settings&part=name");
    expect(settings.body).toContain('class="box"');
    expect(settings.body).not.toMatch(/class="box[^"]*\bcard\b/);
  });

  it("ST10 the day strip: logged days filled green with a tick, empty days a grey ring, today a green outline (Singapore time)", async () => {
    // Thursday 12 Nov, 8:00 pm; Tuesday 10 Nov is logged.
    const strip = /<ol class="strip">(.*?)<\/ol>/.exec((await get("page=week")).body)![1]!;
    const days = [...strip.matchAll(/<span class="(dot[^"]*)"/g)].map((m) => m[1]);
    expect(days).toEqual(["dot", "dot on", "dot", "dot today", "dot", "dot", "dot"]);
    expect(STYLESHEET).toContain(".dot.on{background:var(--accent);border-color:var(--accent);color:var(--card)}");
    expect(STYLESHEET).toContain(".dot.today{border:2px solid var(--accent)}");
    // Today logged: filled, not outlined.
    db.weekData.logs.push({ log_id: 2, habit: "Showing affection", day: "2026-11-12", line: null, photo: null });
    const again = /<ol class="strip">(.*?)<\/ol>/.exec((await get("page=week")).body)![1]!;
    expect([...again.matchAll(/<span class="(dot[^"]*)"/g)].map((m) => m[1])[3]).toBe("dot on");
  });

  it("ST11 the tab you are on is green and bold with a 4px bar above its icon; other tabs and every dustbin at 40%, Rewards at 20%", async () => {
    expect(STYLESHEET).toContain(`nav{position:fixed;left:0;right:0;bottom:0;background:var(--card);box-shadow:${SHADOWS.tabBar};padding-bottom:env(safe-area-inset-bottom)}`);
    expect(STYLESHEET).toContain(".tab{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 0 10px;font-size:11px;color:var(--text);opacity:.4;text-decoration:none}");
    expect(STYLESHEET).toContain(".tab[aria-current=page]{color:var(--accent);font-weight:700;opacity:1}");
    expect(STYLESHEET).toContain('.tab[aria-current=page]::before{content:"";width:20px;height:4px;border-radius:2px;background:var(--accent)}');
    expect(STYLESHEET).toContain(".tab.off{opacity:.2}");
    expect(STYLESHEET).toMatch(/\.bin\{[^}]*color:var\(--text\);opacity:\.4\}/);
    // The icons are inline line drawings, 1.8px stroke, round caps (L21).
    const week = await get("page=week");
    const icons = week.body.match(/<svg [^>]*>/g) ?? [];
    expect(icons.length).toBeGreaterThan(4);
    for (const i of icons) expect(i).toContain('stroke-width="1.8" stroke-linecap="round"');
  });

  it("ST12 older weeks: an outlined green pill button; a pale green italic reflection tile; each habit's tile has its own colour and icon, by its code", async () => {
    db.weekData.olderWeeks = 2;
    const codes = Object.keys(HABIT_TILES);
    db.olderPages = [{
      weeks: [{
        monday: "2026-11-02", daysLogged: 3, habitLogs: 9, reflections: 1, moment: false,
        tiles: [
          ...codes.map((code) => ({ kind: "log" as const, habit: `Habit ${code}`, code })),
          { kind: "log" as const, previewPath: "cara/a-small.jpg" },
          { kind: "reflection" as const, text: "A good week" },
        ],
      }],
      weeksRemaining: 1,
      nextOldestMonday: "2026-10-26",
    }];
    const r = await get("page=week&older=1");
    expect(r.body).toMatch(/<a class="pill wide outline" href="[^"]*page=week&amp;older=5"><svg/);
    expect(STYLESHEET).toContain(".pill.outline{min-height:50px;border:2px solid var(--accent);background:none;color:var(--accent);font-weight:700}");
    expect(r.body).toContain('<li class="tile reflection">');
    expect(STYLESHEET).toContain(".tile.reflection{background:#DDEEEA;color:var(--accent);font-style:italic}");
    expect(STYLESHEET).toContain(".tile{width:46px;height:46px;border:0;border-radius:12px;");
    const svgs = new Set<string>();
    for (const code of codes) {
      const tile = new RegExp(`<li class="tile habit-${code.toLowerCase()}"><svg [^>]*>(.*?)</svg><span class="vh">Habit ${code}</span></li>`).exec(r.body);
      expect(tile, code).not.toBeNull();
      svgs.add(tile![1]!);
      const [bg, icon] = HABIT_TILES[code]!;
      expect(STYLESHEET, code).toContain(`.habit-${code.toLowerCase()}{background:${bg};color:${icon}}`);
    }
    expect(svgs.size).toBe(9); // nine different icons
    // A log with a photo still shows its photo tile, not a habit colour.
    expect(r.body).toMatch(/<li class="tile">[^<]*photo/i);
  });

  it("ST13 a habit with no colour yet (added later) gets a plain tile with its name; a habit name is shown, never obeyed", async () => {
    db.weekData.olderWeeks = 1;
    db.olderPages = [{
      weeks: [{ monday: "2026-11-02", daysLogged: 1, habitLogs: 2, reflections: 0, moment: false,
        tiles: [{ kind: "log" as const, habit: "<b>New habit</b>", code: "NEW" }, { kind: "log" as const, habit: "Old page" }] }],
      weeksRemaining: 0,
      nextOldestMonday: null,
    }];
    const r = await get("page=week&older=4");
    expect(r.body).toContain('<li class="tile">✓ &lt;b&gt;New habit&lt;/b&gt;</li>');
    expect(r.body).toContain('<li class="tile">✓ Old page</li>'); // before migration 019: no code, a plain tile
    expect(STYLESHEET).toContain(".vh{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}");
  });
});
