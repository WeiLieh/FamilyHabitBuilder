// =============================================================================
// tests/web-app-week-so-far.test.ts: My page's Week so far tab (plain HTML, no look yet)
//
// What it checks: [2026-11-15] the owner-approved tests WS1 to WS12 for rules
// 9.2 (the tab bar), 9.4 (Week so far, layout B2), 9.5 (the connection card),
// 9.6 (deleting, with "Are you sure?" on its own page, wireframe A, buttons
// Cancel and Delete) and 9.7 (the older weeks list and its button):
//   WS1 header · WS2 days logged · WS3 logs newest first · WS4 reflections ·
//   WS5 the moment · WS6 the connection card · WS7 older weeks · WS8 dustbins ·
//   WS9 delete failures · WS10 tab bar · WS11 safety · WS12 a read that fails.
// Photos and an older week's own page come later (owner, 15 Nov). The look
// comes later from the owner (CLAUDE.md rule 6): these tests check content
// and behaviour, never styling.
// =============================================================================

import { beforeEach, describe, expect, it } from "vitest";
import { sgtInstant } from "../src/sgt.js";
import { createWebAppHandler, type WebResponse } from "../src/web-app/handler.js";
import { FakeWebDb } from "./helpers/web-app-fake-db.js";

const now = sgtInstant("2026-11-12", 20 * 60); // Thursday 12 Nov 2026, 8:00 pm Singapore time
const COOKIE_SECRET = "Ck3_9xVq2mZ8pR1tY6wB4nH7cJ0sD5fG8aE2uK9iO1l";
const HOST = "family-habit-builder.vercel.app";

let db: FakeWebDb;
let handle: ReturnType<typeof createWebAppHandler>;
beforeEach(() => {
  db = new FakeWebDb();
  db.now = now;
  db.signIns.set(COOKIE_SECRET, { parentId: 7, ended: false });
  db.firstName = "Cara";
  db.weekData = {
    children: ["Riley", "Sam"],
    // Read 1 gives logs oldest first; the page shows them newest first.
    logs: [
      { log_id: 1, habit: "Talking with children", day: "2026-11-10", line: "We laughed a lot", photo: null },
      { log_id: 2, habit: "Showing affection", day: "2026-11-11", line: null, photo: null },
      { log_id: 3, habit: "Talking with children", day: "2026-11-12", line: "Morning hug", photo: null },
    ],
    reflections: [{ reflection_id: 11, day: "2026-11-12", text: "Riley asked for <one> more story" }],
    moment: null,
    olderWeeks: 5,
  };
  db.connection = [
    { monday: "2026-10-12", rating: 3 },
    { monday: "2026-10-19", rating: null },
    { monday: "2026-10-26", rating: 4 },
    { monday: "2026-11-02", rating: 5 },
  ];
  handle = createWebAppHandler({ db, jwtSecret: "test-signing-secret-not-real-0123456789", now: () => now });
});

const get = (query: string) => handle({ method: "GET", url: `/api/web-app?${query}`, headers: { host: HOST, cookie: `__Host-fhb_sign_in=${COOKIE_SECRET}` }, body: "" });
const post = (query: string, body: string, extra: Record<string, string> = {}) =>
  handle({
    method: "POST",
    url: `/api/web-app?${query}`,
    headers: { host: HOST, cookie: `__Host-fhb_sign_in=${COOKIE_SECRET}`, "sec-fetch-site": "same-origin", ...extra },
    body,
  });
const text = (r: WebResponse) => r.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

describe("Week so far (rule 9.4)", () => {
  it("WS1 the header greets the parent and names the week's dates and every child", async () => {
    const r = await get("page=week");
    expect(r.status).toBe(200);
    expect(text(r)).toContain("Hi Cara");
    expect(text(r)).toContain("9 to 15 Nov with Riley and Sam");
  });

  it("WS2 days logged counts only days with a habit log, with a tick on each in the M to S strip", async () => {
    // A reflection on Monday, a day with no habit log: it must not count (review, 15 Nov).
    db.weekData.reflections.unshift({ reflection_id: 10, day: "2026-11-09", text: "Quiet Monday" });
    const r = await get("page=week");
    expect(text(r)).toContain("3 days logged this week");
    // Mon none, Tue, Wed, Thu ticked, Fri to Sun none.
    expect(text(r)).toContain("M – T ✓ W ✓ T ✓ F – S – S –");
  });

  it("WS3 every log is listed newest first, with its habit, its day and its line (or none)", async () => {
    const t = text(await get("page=week"));
    const hug = t.indexOf("Morning hug");
    const affection = t.indexOf("Showing affection · Wed 11 Nov");
    const laughed = t.indexOf("We laughed a lot");
    expect(hug).toBeGreaterThan(-1);
    expect(affection).toBeGreaterThan(hug);
    expect(laughed).toBeGreaterThan(affection);
    expect(t).toContain("Talking with children · Thu 12 Nov");
    expect(t).not.toContain("Riley ·"); // no child on a log row for now (owner, 15 Nov)
  });

  it("WS4 reflections are shown word for word, in quotes and italics, and typed text is never page code", async () => {
    const r = await get("page=week");
    expect(text(r)).toContain("1 reflection this week");
    expect(r.body).toContain("<i>“Riley asked for &lt;one&gt; more story”</i>");
    expect(r.body).not.toContain("<one>");
  });

  it("WS5 the week's moment is shown at the top only when there is one: its line in quotes", async () => {
    expect(text(await get("page=week"))).not.toContain("Moment");
    db.weekData.moment = { photo: null, line: { moment_line_id: 21, text: "Best week so far" } };
    const t = text(await get("page=week"));
    expect(t).toContain("This week's moment “Best week so far”");
    expect(t.indexOf("This week's moment")).toBeLessThan(t.indexOf("days logged this week"));
  });

  it("WS6 the connection card: the fixed question, 4 weeks oldest first, '–' with no answer, only real answers", async () => {
    const r = await get("page=week");
    const t = text(r);
    expect(t).toContain("How connected did you feel with your child?");
    expect(t).toContain("3 12 Oct – 19 Oct 4 26 Oct 5 2 Nov");
    expect(r.body.match(/<meter /g)).toHaveLength(3); // a bar for each real answer, none for the "–" week
    expect(t).not.toMatch(/average/i);
    expect(t).not.toContain("This week"); // the bar label (capital T) only once this week is answered
    // Once this week is answered, "This week" joins on the right.
    db.connection.push({ monday: "2026-11-09", rating: 4 });
    expect(text(await get("page=week"))).toContain("5 2 Nov 4 This week");
    // Before any answer: the one sentence, no bars.
    db.connection = db.connection.map((w) => ({ ...w, rating: null }));
    const none = await get("page=week");
    expect(text(none)).toContain("Your first answer arrives on Sunday.");
    expect(none.body).not.toContain("<meter");
  });
});

describe("Text is never page code (review, 15 Nov)", () => {
  it("WS13 names, children's names and habit names are shown as text, never obeyed as page code", async () => {
    db.firstName = "<b>Cara</b>";
    db.weekData.children = ["<script>Riley</script>"];
    db.weekData.logs[0]!.habit = "Talk & <listen>";
    const r = await get("page=week");
    expect(r.body).not.toMatch(/<b>Cara|<script>|<listen>/);
    expect(text(r)).toContain("Hi &lt;b&gt;Cara&lt;/b&gt;");
    expect(r.body).toContain("Talk &amp; &lt;listen&gt;");
  });
});

describe("Older weeks (rule 9.7)", () => {
  const page = (mondays: string[], remaining: number, next: string | null) => ({
    weeks: mondays.map((monday, i) => ({
      monday,
      daysLogged: i === 0 ? 3 : 0,
      habitLogs: i === 0 ? 3 : 0,
      reflections: i === 0 ? 1 : 0,
      moment: i === 0,
      tiles:
        i === 0
          ? [
              { kind: "moment" as const, text: "A day at the beach…" },
              { kind: "log" as const, habit: "Showing affection" },
              { kind: "reflection" as const, text: "We built a cardboard castle…" },
            ]
          : [],
    })),
    weeksRemaining: remaining,
    nextOldestMonday: next,
  });

  it("WS7 the button's label matches what a tap loads; the list shows each week's count line; no button once none remain", async () => {
    const first = text(await get("page=week"));
    expect(first).toContain("Show 4 older weeks - back to 12 Oct"); // 5 weeks before this one; a tap loads 4
    db.olderPages = [page(["2026-11-02", "2026-10-26", "2026-10-19", "2026-10-12"], 1, "2026-10-05")];
    const loaded = text(await get("page=week&older=4"));
    expect(loaded).toContain("2 to 8 Nov 3 days logged - 3 habits, 1 reflection, 1 moment");
    expect(loaded).toContain("Moment: A day at the beach… ✓ Showing affection “We built a cardboard castle…”");
    expect(loaded).toContain("19 to 25 Oct"); // an empty week is listed too, with no count parts
    expect(loaded).toContain("Show 1 more week - 5 to 11 Oct");
    db.olderPages = [page(["2026-11-02", "2026-10-26", "2026-10-19", "2026-10-12"], 1, "2026-10-05"), page(["2026-10-05"], 0, null)];
    db.calls = [];
    const all = await get("page=week&older=8");
    expect(text(all)).toContain("5 to 11 Oct");
    expect(text(all)).not.toContain("Show ");
    expect(db.calls.filter((c) => c.what === "olderWeeks").map((c) => c.args[1])).toEqual(["2026-11-09", "2026-10-12"]);
  });

  it("WS7 an edited address can't make one page ask for more than a year of older weeks (privacy review)", async () => {
    db.weekData.olderWeeks = 1000;
    let monday = "2026-11-09";
    db.olderPages = Array.from({ length: 300 }, () => {
      const mondays = [1, 2, 3, 4].map((k) => {
        const d = new Date(Date.parse(`${monday}T00:00:00Z`) - k * 7 * 86_400_000).toISOString().slice(0, 10);
        return d;
      });
      monday = mondays[3]!;
      return page(mondays, 1000, mondays[3]!);
    });
    await get("page=week&older=100000");
    expect(db.calls.filter((c) => c.what === "olderWeeks")).toHaveLength(13); // 52 weeks, 4 per question
  });
});

describe("Deleting (rule 9.6, wireframe A)", () => {
  it("WS8 dustbins sit only on a line, a reflection and a moment line; 'Are you sure?' names what goes and stays; Cancel keeps it; Delete removes it", async () => {
    db.weekData.moment = { photo: null, line: { moment_line_id: 21, text: "Best week so far" } };
    const r = await get("page=week");
    const bins = [...r.body.matchAll(/page=confirm&amp;kind=([a-z-]+)&amp;id=(\d+)/g)].map((m) => `${m[1]}:${m[2]}`);
    expect(bins.sort()).toEqual(["line:1", "line:3", "moment-line:21", "reflection:11"]); // not on log 2 (nothing added)
    const ask = await get("page=confirm&kind=line&id=3");
    expect(text(ask)).toContain("Delete this line? It will be gone for good. Your log stays.");
    expect(ask.body).toContain('href="/api/web-app?page=week">Cancel</a>');
    expect(ask.body.match(/<button[^>]*>Delete<\/button>/g)).toHaveLength(1);
    expect(db.calls.some((c) => c.what === "deleteEntry")).toBe(false); // asking deletes nothing
    const done = await post("page=delete", "kind=line&id=3");
    expect(done.status).toBe(303);
    expect(done.headers.location).toBe("/api/web-app?page=week");
    expect(db.weekData.logs.find((l) => l.log_id === 3)).toMatchObject({ line: null }); // the log stays
    expect(text(await get("page=confirm&kind=reflection&id=11"))).toContain("Delete this reflection? It will be gone for good.");
    expect(text(await get("page=confirm&kind=moment-line&id=21"))).toContain("Delete this moment's line? It will be gone for good.");
    await post("page=delete", "kind=reflection&id=11");
    expect(db.weekData.reflections).toEqual([]);
  });

  it("WS9 a delete that fails, or of someone else's entry, says it didn't work and the entry stays", async () => {
    db.fail = "deleteEntry";
    const failed = await post("page=delete", "kind=line&id=3");
    expect(failed.status).toBe(503);
    expect(text(failed)).toContain("Sorry, that didn't work. Please try again.");
    db.fail = null;
    const other = await post("page=delete", "kind=reflection&id=999"); // not this parent's (the database refuses it)
    expect(other.status).toBe(503);
    expect(db.weekData.reflections).toHaveLength(1);
    expect(db.weekData.logs.find((l) => l.log_id === 3)?.line).toBe("Morning hug");
    // Anything that isn't one of the three kinds and a number is refused before the database.
    const bad = await post("page=delete", "kind=log&id=1");
    expect(bad.status).toBe(400);
    expect(db.calls.filter((c) => c.what === "deleteEntry")).toHaveLength(2);
  });
});

describe("Tabs and safety (rules 9.2, 9.6, 9.8)", () => {
  it("WS10 the tab bar has four tabs; Rewards is greyed out and can't be tapped; Settings holds Sign out", async () => {
    const r = await get("page=week");
    expect(r.body).toContain('href="/api/web-app?page=week"');
    expect(r.body).toContain('href="/api/web-app?page=habits"');
    expect(r.body).toContain("<button disabled>Rewards</button>");
    expect(r.body).toContain('href="/api/web-app?page=settings"');
    const settings = await get("page=settings");
    expect(settings.body).toContain('action="/api/web-app?page=sign-out"');
    expect(text(await get("page=habits"))).toContain("Habits so far");
  });

  it("WS11 every new page says 'do not store'; a delete posted from another website is refused; no sign-in shows nothing", async () => {
    for (const r of [await get("page=week"), await get("page=confirm&kind=line&id=3"), await get("page=settings"), await get("page=habits")]) {
      expect(r.headers["cache-control"]).toBe("no-store, private");
    }
    const forged = await post("page=delete", "kind=line&id=3", { "sec-fetch-site": "cross-site" });
    expect(forged.status).toBe(403);
    expect(db.weekData.logs.find((l) => l.log_id === 3)?.line).toBe("Morning hug");
    const signedOut = await handle({ method: "GET", url: "/api/web-app?page=confirm&kind=line&id=3", headers: {}, body: "" });
    expect(signedOut.status).toBe(401);
    const signedOutDelete = await handle({ method: "POST", url: "/api/web-app?page=delete", headers: { "sec-fetch-site": "same-origin" }, body: "kind=line&id=3" });
    expect(signedOutDelete.status).toBe(401);
    expect(db.calls.filter((c) => c.what === "deleteEntry")).toHaveLength(0);
  });

  it("WS12 if any read fails, the page says it didn't work: never half a page", async () => {
    for (const what of ["week", "connectionHistory", "olderWeeks"]) {
      db.fail = what;
      db.olderPages = [];
      const r = await get(what === "olderWeeks" ? "page=week&older=4" : "page=week");
      expect(r.status).toBe(503);
      expect(text(r)).toContain("Sorry, that didn't work. Please try again.");
      expect(text(r)).not.toContain("Cara");
    }
  });
});
