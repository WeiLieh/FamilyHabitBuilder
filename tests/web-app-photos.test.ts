// =============================================================================
// tests/web-app-photos.test.ts: photos on My page (owner, 24 Nov)
//
// What it checks: [2026-11-24] the owner-approved tests PH11 and PH12:
//   PH11 a log's photo is shown big, only through a short-lived link from our
//        own Supabase project; images may load from nowhere else; a link that
//        can't be made shows as a failure on that photo (rule 1.3)
//   PH12 the photo's dustbin: "Are you sure?" with its own words; Delete
//        removes the files first, then the record; if the files can't be
//        removed, nothing is deleted; one layer per tap (rule 9.6)
// =============================================================================

import { beforeEach, describe, expect, it } from "vitest";
import { sgtInstant } from "../src/sgt.js";
import { createWebAppHandler } from "../src/web-app/handler.js";
import { FakeWebDb } from "./helpers/web-app-fake-db.js";

const now = sgtInstant("2026-11-12", 20 * 60); // Thursday 12 Nov 2026, 8:00 pm Singapore time
const COOKIE_SECRET = "Ck3_9xVq2mZ8pR1tY6wB4nH7cJ0sD5fG8aE2uK9iO1l";
const HOST = "family-habit-builder.vercel.app";
const ORIGIN = "https://abcd.supabase.co";
const PATH = "7/2f1c9a1e-5b8e-4c6f-9d2a-0b7e6c5d4a31.jpg";

let db: FakeWebDb;
let handle: ReturnType<typeof createWebAppHandler>;
beforeEach(() => {
  db = new FakeWebDb();
  db.now = now;
  db.signIns.set(COOKIE_SECRET, { parentId: 7, ended: false });
  db.weekData = {
    children: ["Riley"],
    logs: [{ log_id: 1, habit: "Spending quality time", day: "2026-11-10", line: "Park after school", photo: { photo_id: 31, path: PATH, preview_path: null } }],
    reflections: [],
    moment: null,
    olderWeeks: 0,
  };
  db.photoStore.add(PATH);
  handle = createWebAppHandler({ db, jwtSecret: "test-signing-secret-not-real-0123456789", now: () => now, photoOrigin: ORIGIN, tellPause: async () => {} });
});

const cookie = `__Host-fhb_sign_in=${COOKIE_SECRET}`;
const get = (query: string) => handle({ method: "GET", url: `/api/web-app?${query}`, headers: { host: HOST, cookie }, body: "" });
const post = (query: string, body: string) =>
  handle({ method: "POST", url: `/api/web-app?${query}`, headers: { host: HOST, cookie, "sec-fetch-site": "same-origin" }, body });
const bins = (body: string) => [...body.matchAll(/page=confirm&amp;kind=([a-z-]+)&amp;id=(\d+)/g)].map((m) => `${m[1]}:${m[2]}`);

describe("Photos on Week so far (PH11)", () => {
  it("PH11 a log's photo shows big through a short-lived link from our own Supabase project, and images may load from nowhere else", async () => {
    const r = await get("page=week");
    expect(r.status).toBe(200);
    expect(r.body).toMatch(new RegExp(`<img class="photo" src="${ORIGIN}/storage/v1/object/sign/photos/[^"]+token=[^"]+" alt="Your photo">`));
    expect(db.calls.filter((c) => c.what === "photoLink")).toEqual([{ what: "photoLink", args: [expect.any(String), PATH] }]);
    expect(r.body).not.toMatch(/\/object\/public\//); // never a permanent public address
    expect(r.headers["content-security-policy"]).toMatch(new RegExp(`; img-src ${ORIGIN}$`));
    expect(r.body).toContain("Park after school"); // the line still shows under the photo
  });

  it("PH11 a link that can't be made says so on that photo, and the rest of the page still shows", async () => {
    db.fail = "photoLink";
    const r = await get("page=week");
    expect(r.status).toBe(200);
    expect(r.body).toContain("This photo couldn't be loaded. Please try again.");
    expect(r.body).not.toContain("<img");
    expect(r.body).toContain("Park after school");
  });
});

describe("Deleting a photo (PH12, rule 9.6)", () => {
  it("PH12 one dustbin per row, photo first: 'Are you sure?' names what goes; Delete removes the files, then the record; then the line's dustbin appears", async () => {
    expect(bins((await get("page=week")).body)).toEqual(["photo:31"]); // not the line's yet: one layer per tap
    const ask = await get("page=confirm&kind=photo&id=31");
    expect(ask.body).toContain("Delete this photo? It will be gone for good. Your log stays.");
    const done = await post("page=delete", "kind=photo&id=31");
    expect(done.status).toBe(303);
    const order = db.calls.map((c) => c.what).filter((w) => w === "photoFiles" || w === "removePhotoFiles" || w === "deleteEntry");
    expect(order).toEqual(["photoFiles", "removePhotoFiles", "deleteEntry"]); // the files first (rule 8.5)
    expect(db.removedFiles).toEqual([PATH]);
    expect(db.weekData.logs[0]).toMatchObject({ photo: null, line: "Park after school" }); // the log and its line stay
    expect(bins((await get("page=week")).body)).toEqual(["line:1"]);
  });

  it("PH12 if the photo's files can't be removed, nothing is deleted and the page says it didn't work", async () => {
    db.fail = "removePhotoFiles";
    const r = await post("page=delete", "kind=photo&id=31");
    expect(r.status).toBe(503);
    expect(r.body).toContain("Sorry, that didn't work. Please try again.");
    expect(db.calls.some((c) => c.what === "deleteEntry")).toBe(false);
    expect(db.weekData.logs[0]!.photo).not.toBeNull();
  });
});
