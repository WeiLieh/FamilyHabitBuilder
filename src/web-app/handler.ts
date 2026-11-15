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
//   - ?page=week (GET): My page. The cookie is checked, our server signs a
//     10-minute pass for that one parent (pass.ts), and the database is read
//     with it (rule 9.8). For now the page only greets the parent: Week so far
//     is built later, with the owner's look (CLAUDE.md rule 6).
//   - ?page=sign-out (POST): ends the sign-in in the database and clears the cookie.
// Every answer tells browsers and caches not to keep a copy (rule 9.6).
// A failure is shown as a failure, never filled in (rule 1.3), and failures
// are logged with anything secret-looking blanked out (rule 9.3).
//
// Why requests and answers are plain objects: the logic can be tested
// without a real web server; api/web-app.ts connects it to Vercel.
// =============================================================================

import { createHash } from "node:crypto";
import { newSecret } from "../datastore/sign-in-secrets.js";
import type { WebAppDb } from "../datastore/web-app-store.js";
import { mondayOf, toSgt } from "../sgt.js";
import { signPass } from "./pass.js";
import { WEB_WORDS } from "./words.js";

// The database menu this handler orders from (src/datastore/web-app-store.ts).
export type { WebAppDb, WebWeek } from "../datastore/web-app-store.js";
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
// other sites, no framing, and only our own one script may run.
const SAFE_HEADERS: Record<string, string> = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store, private",
  pragma: "no-cache",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "content-security-policy": `default-src 'none'; script-src 'sha256-${OPEN_SCRIPT_HASH}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
};

// Make text safe to put in a page (a name like "<b>" is shown, not obeyed).
const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const page = (inner: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
  `<meta name="robots" content="noindex"><title>${WEB_WORDS.pageTitle}</title></head><body>${inner}</body></html>`;
const paragraph = (text: string) => `<p>${escapeHtml(text)}</p>`;
const answer = (status: number, inner: string, extra: Record<string, string> = {}): WebResponse => ({
  status,
  headers: { ...SAFE_HEADERS, ...extra },
  body: page(inner),
});

// A failure line for Vercel's logs, with anything that looks like a secret or
// a quoted value blanked out (rule 9.3: the link stays out of logs).
function logFailure(what: string, error: unknown): void {
  const raw = error instanceof Error ? error.message : String(error);
  const safe = raw
    .replace(/"[^"]*"/g, "[text]")
    .replace(/[A-Za-z0-9_-]{20,}/g, "[secret]")
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

  // ?page=week: check the sign-in, sign a pass for that parent, read with it.
  async function week(req: WebRequest): Promise<WebResponse> {
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
    try {
      const w = await db.week(signPass(parentId, jwtSecret, at), mondayOf(toSgt(at).date));
      return answer(
        200,
        `<h1>${escapeHtml(WEB_WORDS.hello(w.parentFirstName))}</h1>` +
          paragraph(WEB_WORDS.comingSoon) +
          `<form method="post" action="${BASE}?page=sign-out"><button type="submit">${escapeHtml(WEB_WORDS.signOutButton)}</button></form>`,
      );
    } catch (error) {
      logFailure("Reading My page failed", error);
      return didntWork();
    }
  }

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
    "sign-out": { method: "POST", run: signOut },
  };

  return async function handle(req: WebRequest): Promise<WebResponse> {
    const name = new URL(req.url, "https://localhost").searchParams.get("page") ?? "";
    const route = routes[name];
    if (!route) return answer(404, paragraph(WEB_WORDS.notFound));
    if (req.method !== route.method) return { ...answer(405, paragraph(WEB_WORDS.notFound)), headers: { ...SAFE_HEADERS, allow: route.method } };
    return route.run(req);
  };
}
