// =============================================================================
// src/web-app/handler.ts: the Web app's pages: open the link, sign in, My page, sign out
//
// What it does: [2026-11-15] answers every request to /api/web-app (rules 9.3,
// 9.6, 9.8; owner-approved tests W2 to W10, P1, P2 in tests/web-app-sign-in.test.ts):
//   - ?page=open (GET): the page a /mypage link opens. One button, nothing
//     personal, and nothing used up, so Telegram's automatic link preview
//     can't spend the link or see a name. A tiny script reads the link's
//     secret from after the "#" (which never reaches a server) and puts it in
//     the button's form.
//   - ?page=sign-in (POST): the button press. The database uses the link up
//     and starts a sign-in; the browser gets a protected cookie holding a new
//     random secret (sent only over secure connections, never readable by
//     scripts on the page). A used or expired link says so (rule 9.3).
//   - ?page=week (GET): My page's Week so far. The cookie is checked, our
//     server signs a 10-minute pass for that one parent (pass.ts), and the
//     database is read with it (rule 9.8). [2026-11-15] The page is built in
//     HTML (week-page.ts). [2026-11-24] My page's pages carry the owner's
//     look (style.ts, rule 6); the sign-in and error pages stay plain.
//     &older=N adds N older weeks below it (rule 9.7).
//   - ?page=confirm (GET) and ?page=delete (POST): a dustbin's "Are you sure?"
//     page and the delete itself (rule 9.6, wireframe A).
//   - ?page=habits and ?page=settings (GET): placeholder tabs; Settings holds
//     Sign out (rule 9.2).
//   - ?page=sign-out (POST): ends the sign-in in the database and clears the cookie.
// Every answer tells browsers and caches not to keep a copy (rule 9.6).
// [2026-11-24] The security rule lets through only our one script and our one
// stylesheet, each named by its fingerprint (owner: option A).
// [2026-11-15, privacy review] A form posted from another website (a forged
// sign-in or sign-out) is refused: the browser's own "where did this come
// from" headers (Sec-Fetch-Site, Origin) must say this site.
// A failure is shown as a failure, never filled in (rule 1.3), and failures
// are logged with anything secret-looking blanked out (rule 9.3).
//
// Why requests and answers are plain objects: the logic can be tested
// without a real web server; api/web-app.ts connects it to Vercel.
// =============================================================================

import { createHash } from "node:crypto";
import { newSecret } from "../datastore/sign-in-secrets.js";
import type { WebAppDb } from "../datastore/web-app-store.js";
import { OLDER_WEEKS_MAX } from "../settings.js";
import { mondayOf, toSgt } from "../sgt.js";
import type { DeleteKind, OlderWeek } from "../datastore/web-app-store.js";
import { escapeHtml } from "./html.js";
import { signPass } from "./pass.js";
import { STYLESHEET, STYLESHEET_HASH } from "./style.js";
import { confirmPage, habitsPage, settingsPage, weekPage } from "./week-page.js";
import { WEB_WORDS } from "./words.js";

// The database menu this handler orders from (src/datastore/web-app-store.ts).
export type { ConnectionWeek, DeleteKind, OlderWeeksPage, WebAppDb, WebWeek } from "../datastore/web-app-store.js";
export type WebRequest = { method: string; url: string; headers: Record<string, string | undefined>; body: string };
export type WebResponse = { status: number; headers: Record<string, string>; body: string };

// "__Host-" makes browsers insist the cookie is secure, for this site only, for every path.
const COOKIE = "__Host-fhb_sign_in";
const COOKIE_FLAGS = "Path=/; Secure; HttpOnly; SameSite=Lax";
const BASE = "/api/web-app";
// A secret looks like the ones we make: 32 to 128 letters, digits, "-" or "_".
const SECRET = /^[A-Za-z0-9_-]{32,128}$/;

// The one script, on the open page: take the secret from after "#", wipe it
// from the address bar and history, and put it in the form.
const OPEN_SCRIPT =
  'var s=location.hash.slice(1);history.replaceState(null,"",location.pathname+location.search);document.getElementById("secret").value=s;';
const OPEN_SCRIPT_HASH = createHash("sha256").update(OPEN_SCRIPT).digest("base64");

// Headers on every answer: no copies kept (rule 9.6), no address passed on to
// other sites, no framing, and only our own one script and one stylesheet may
// be used (each named by its fingerprint; nothing else, not even style="…").
const SAFE_HEADERS: Record<string, string> = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store, private",
  pragma: "no-cache",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "content-security-policy": `default-src 'none'; script-src 'sha256-${OPEN_SCRIPT_HASH}'; style-src 'sha256-${STYLESHEET_HASH}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
};

// The same headers, for the few plain answers api/web-app.ts makes itself.
export const WEB_SAFE_HEADERS: Readonly<Record<string, string>> = SAFE_HEADERS;


// A whole page around its inside. "styled" adds My page's stylesheet
// (style.ts): only My page's own pages carry the look for now (owner, 24 Nov).
const page = (inner: string, styled: boolean) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
  `<meta name="robots" content="noindex"><title>${WEB_WORDS.pageTitle}</title>${styled ? `<style>${STYLESHEET}</style>` : ""}</head><body>${inner}</body></html>`;
const paragraph = (text: string) => `<p>${escapeHtml(text)}</p>`;
const answer = (status: number, inner: string, extra: Record<string, string> = {}, styled = false): WebResponse => ({
  status,
  headers: { ...SAFE_HEADERS, ...extra },
  body: page(inner, styled),
});
// My page's own pages: the same, with the owner's look.
const styledAnswer = (inner: string) => answer(200, inner, {}, true);

// A failure line for Vercel's logs, with anything that looks like a secret or
// a quoted value blanked out (rule 9.3: the link stays out of logs).
function logFailure(what: string, error: unknown): void {
  const raw = error instanceof Error ? error.message : String(error);
  const safe = raw
    .replace(/"[^"]*"/g, "[text]")
    .replace(/[A-Za-z0-9_-]{20,}/g, "[secret]")
    .replace(/\d{5,}/g, "[number]") // Telegram IDs and other long numbers
    .slice(0, 300);
  console.error(`${what}: ${safe}`);
}

// The sign-in cookie's value, if the browser sent one.
function cookieOf(req: WebRequest): string | null {
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) return rest.join("=") || null;
  }
  return null;
}

export function createWebAppHandler(deps: { db: WebAppDb; jwtSecret: string; now: () => Date }) {
  const { db, jwtSecret, now } = deps;
  const didntWork = () => answer(503, paragraph(WEB_WORDS.didntWork));
  const notSignedIn = () => answer(401, paragraph(WEB_WORDS.notSignedIn));
  const expired = () => answer(410, paragraph(WEB_WORDS.expired));

  // ?page=open: one button, nothing personal, nothing asked of the database.
  const openPage = () =>
    answer(
      200,
      paragraph(WEB_WORDS.openIntro) +
        `<form method="post" action="${BASE}?page=sign-in"><input type="hidden" name="secret" id="secret" value="">` +
        `<button type="submit">${escapeHtml(WEB_WORDS.openButton)}</button></form>` +
        `<noscript>${paragraph(WEB_WORDS.noScript)}</noscript><script>${OPEN_SCRIPT}</script>`,
    );

  // ?page=sign-in: use the link up and set the protected cookie.
  async function signIn(req: WebRequest): Promise<WebResponse> {
    const linkSecret = new URLSearchParams(req.body).get("secret") ?? "";
    if (!SECRET.test(linkSecret)) return expired(); // no secret (no script, a broken link): nothing to check
    const cookieSecret = newSecret();
    let until: Date | "expired";
    try {
      until = await db.redeemSignInLink(linkSecret, cookieSecret);
    } catch (error) {
      logFailure("Using a sign-in link failed", error);
      return didntWork();
    }
    if (until === "expired") return expired();
    // The cookie lasts exactly as long as the database's sign-in (30 days, from the settings version).
    const maxAge = Math.max(0, Math.round((until.getTime() - now().getTime()) / 1000));
    return {
      status: 303,
      headers: { ...SAFE_HEADERS, location: `${BASE}?page=week`, "set-cookie": `${COOKIE}=${cookieSecret}; Max-Age=${maxAge}; ${COOKIE_FLAGS}` },
      body: "",
    };
  }

  // Check the sign-in cookie and sign a 10-minute pass for that one parent
  // (rule 9.8). Gives the pass, or the answer to send instead (not signed in,
  // or the check failed).
  async function passFor(req: WebRequest): Promise<{ pass: string; at: Date } | WebResponse> {
    const cookieSecret = cookieOf(req);
    if (!cookieSecret || !SECRET.test(cookieSecret)) return notSignedIn();
    let parentId: number | null;
    try {
      parentId = await db.signInParent(cookieSecret);
    } catch (error) {
      logFailure("Checking a sign-in failed", error);
      return didntWork();
    }
    if (parentId === null) return notSignedIn();
    const at = now();
    return { pass: signPass(parentId, jwtSecret, at), at };
  }
  const isAnswer = (x: unknown): x is WebResponse => typeof x === "object" && x !== null && "status" in x;

  // ?page=week (&older=N): Week so far, with N older weeks listed below it
  // (rules 9.4, 9.5, 9.7). Every read must work, or the page says it didn't (rule 1.3).
  async function week(req: WebRequest): Promise<WebResponse> {
    const signed = await passFor(req);
    if (isAnswer(signed)) return signed;
    const monday = mondayOf(toSgt(signed.at).date);
    const asked = Number(new URL(req.url, "https://localhost").searchParams.get("older") ?? "0");
    const wanted = Number.isInteger(asked) && asked > 0 ? Math.min(asked, OLDER_WEEKS_MAX) : 0; // at most a year per load (privacy review)
    try {
      const [w, connection] = await Promise.all([db.week(signed.pass, monday), db.connectionHistory(signed.pass, monday)]);
      const older: OlderWeek[] = [];
      let remaining = w.olderWeeks;
      let before = monday;
      while (older.length < wanted && remaining > 0) {
        const pageOfWeeks = await db.olderWeeks(signed.pass, before);
        if (pageOfWeeks.weeks.length === 0) break;
        older.push(...pageOfWeeks.weeks);
        remaining = pageOfWeeks.weeksRemaining;
        before = pageOfWeeks.weeks.at(-1)!.monday;
      }
      return styledAnswer(weekPage({ week: w, monday, connection, older, olderRemaining: remaining }));
    } catch (error) {
      logFailure("Reading My page failed", error);
      return didntWork();
    }
  }

  // Which entry a dustbin points at: one of the three kinds and a whole number.
  function entryOf(params: URLSearchParams): { kind: DeleteKind; id: number } | null {
    const kind = params.get("kind");
    const id = Number(params.get("id"));
    if ((kind !== "line" && kind !== "reflection" && kind !== "moment-line") || !Number.isSafeInteger(id) || id <= 0) return null;
    return { kind, id };
  }

  // ?page=confirm: "Are you sure?" on its own page (rule 9.6, wireframe A). It deletes nothing.
  async function confirm(req: WebRequest): Promise<WebResponse> {
    const signed = await passFor(req);
    if (isAnswer(signed)) return signed;
    const entry = entryOf(new URL(req.url, "https://localhost").searchParams);
    if (!entry) return answer(400, paragraph(WEB_WORDS.badRequest));
    return styledAnswer(confirmPage(entry.kind, entry.id));
  }

  // ?page=delete (POST): one layer, with that parent's pass; then back to Week so far.
  async function remove(req: WebRequest): Promise<WebResponse> {
    const signed = await passFor(req);
    if (isAnswer(signed)) return signed;
    const entry = entryOf(new URLSearchParams(req.body));
    if (!entry) return answer(400, paragraph(WEB_WORDS.badRequest));
    try {
      await db.deleteEntry(signed.pass, entry.kind, entry.id);
    } catch (error) {
      logFailure("Deleting on My page failed", error);
      return didntWork();
    }
    return { status: 303, headers: { ...SAFE_HEADERS, location: `${BASE}?page=week` }, body: "" };
  }

  // The two placeholder tabs (rule 9.2): signed in only, nothing read.
  const placeholder = (build: () => string) => async (req: WebRequest) => {
    const signed = await passFor(req);
    return isAnswer(signed) ? signed : styledAnswer(build());
  };

  // ?page=sign-out: end the sign-in, then clear the cookie. If ending it
  // fails, the cookie is kept and the page says so (it is still signed in).
  async function signOut(req: WebRequest): Promise<WebResponse> {
    const cookieSecret = cookieOf(req);
    if (cookieSecret && SECRET.test(cookieSecret)) {
      try {
        await db.endSignIn(cookieSecret);
      } catch (error) {
        logFailure("Signing out failed", error);
        return didntWork();
      }
    }
    return answer(200, paragraph(WEB_WORDS.signedOut), { "set-cookie": `${COOKIE}=; Max-Age=0; ${COOKIE_FLAGS}` });
  }

  const routes: Record<string, { method: string; run: (req: WebRequest) => WebResponse | Promise<WebResponse> }> = {
    open: { method: "GET", run: openPage },
    "sign-in": { method: "POST", run: signIn },
    week: { method: "GET", run: week },
    confirm: { method: "GET", run: confirm },
    delete: { method: "POST", run: remove },
    habits: { method: "GET", run: placeholder(habitsPage) },
    settings: { method: "GET", run: placeholder(settingsPage) },
    "sign-out": { method: "POST", run: signOut },
  };

  // A POST must come from one of our own pages. The browser's own label,
  // Sec-Fetch-Site, decides when it is there ("same-origin" from our pages).
  // [2026-11-15, UAT U58] Only without it is Origin compared: an iPhone sends
  // Origin "null" from our own page (our pages ask for no referrer), so a
  // "null" Origin alone must not refuse a press that says same-origin.
  // A request with neither label (an older browser) is let through, since the
  // cookie's SameSite=Lax still stops another site from sending it.
  function fromOtherSite(req: WebRequest): boolean {
    const site = req.headers["sec-fetch-site"];
    if (site) return site !== "same-origin" && site !== "none";
    const origin = req.headers.origin;
    if (!origin) return false;
    if (origin === "null") return true;
    try {
      return new URL(origin).host !== (req.headers.host ?? "");
    } catch {
      return true;
    }
  }

  return async function handle(req: WebRequest): Promise<WebResponse> {
    const name = new URL(req.url, "https://localhost").searchParams.get("page") ?? "";
    const route = routes[name];
    if (!route) return answer(404, paragraph(WEB_WORDS.notFound));
    if (req.method !== route.method) return { ...answer(405, paragraph(WEB_WORDS.notFound)), headers: { ...SAFE_HEADERS, allow: route.method } };
    if (req.method === "POST" && fromOtherSite(req)) return answer(403, paragraph(WEB_WORDS.didntWork));
    return route.run(req);
  };
}
