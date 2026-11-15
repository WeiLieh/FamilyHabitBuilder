// =============================================================================
// tests/helpers/web-app-fake-db.ts: a pretend database for the Web app's tests
//
// What it does: [2026-11-15] has the same menu as the real one
// (src/datastore/web-app-store.ts) and records what it was asked, so the
// tests can check the pages without touching real data. It keeps sign-in
// links and sign-ins, one parent's week, older weeks, connection answers, and
// follows the database's rules for the deletes (only that parent's entries,
// one layer, removed or blanked). Set `fail` to the name of a call to make it
// fail, to check a failure is shown as a failure (rule 1.3).
// Moved here from tests/web-app-sign-in.test.ts so both Web app test files
// share one pretend database (the sign-in behaviour is unchanged).
// =============================================================================

import type { ConnectionWeek, DeleteKind, OlderWeeksPage, WebAppDb, WebWeek } from "../../src/web-app/handler.js";

export class FakeWebDb implements WebAppDb {
  calls: { what: string; args: unknown[] }[] = [];
  links = new Map<string, number>(); // link secret -> parent
  signIns = new Map<string, { parentId: number; ended: boolean }>(); // cookie secret -> sign-in
  firstName = "Cara";
  fail: string | null = null; // the name of a call to fail, with errorText
  errorText = "database unavailable";
  signInUntil: (now: Date) => Date = (now) => new Date(now.getTime() + 30 * 86_400_000);
  now = new Date();

  // One parent's week (read 1), older weeks (read 2) and connection answers (read 3).
  weekData: Omit<WebWeek, "parentFirstName"> = { children: ["Riley"], logs: [], reflections: [], moment: null, olderWeeks: 0 };
  olderPages: OlderWeeksPage[] = []; // answered in order, one per call
  connection: ConnectionWeek[] = [];

  private maybeFail(what: string, args: unknown[]): void {
    this.calls.push({ what, args });
    if (this.fail === what) throw new Error(this.errorText);
  }
  async redeemSignInLink(linkSecret: string, signInSecret: string): Promise<Date | "expired"> {
    this.maybeFail("redeem", [linkSecret, signInSecret]);
    const parentId = this.links.get(linkSecret);
    if (parentId === undefined) return "expired";
    this.links.delete(linkSecret); // works once
    this.signIns.set(signInSecret, { parentId, ended: false });
    return this.signInUntil(this.now);
  }
  async signInParent(signInSecret: string): Promise<number | null> {
    this.maybeFail("signInParent", [signInSecret]);
    const s = this.signIns.get(signInSecret);
    return s && !s.ended ? s.parentId : null;
  }
  async endSignIn(signInSecret: string): Promise<void> {
    this.maybeFail("endSignIn", [signInSecret]);
    const s = this.signIns.get(signInSecret);
    if (s) s.ended = true;
  }
  async week(pass: string, monday: string): Promise<WebWeek> {
    this.maybeFail("week", [pass, monday]);
    return { parentFirstName: this.firstName, ...structuredClone(this.weekData) };
  }
  async olderWeeks(pass: string, before: string): Promise<OlderWeeksPage> {
    this.maybeFail("olderWeeks", [pass, before]);
    const page = this.olderPages.shift();
    if (!page) throw new Error("no older page set up");
    return page;
  }
  async connectionHistory(pass: string, monday: string): Promise<ConnectionWeek[]> {
    this.maybeFail("connectionHistory", [pass, monday]);
    return structuredClone(this.connection);
  }
  // The database's rules (migration 011): only this parent's entries; a log's
  // line is blanked (the log stays), a reflection or moment line is removed.
  async deleteEntry(pass: string, kind: DeleteKind, id: number): Promise<void> {
    this.maybeFail("deleteEntry", [pass, kind, id]);
    const w = this.weekData;
    if (kind === "line") {
      const log = w.logs.find((l) => l.log_id === id && l.line !== null);
      if (!log) throw new Error("That line was not found.");
      log.line = null;
    } else if (kind === "reflection") {
      const i = w.reflections.findIndex((r) => r.reflection_id === id);
      if (i < 0) throw new Error("That reflection was not found.");
      w.reflections.splice(i, 1);
    } else {
      if (!w.moment?.line || w.moment.line.moment_line_id !== id) throw new Error("That moment line was not found.");
      w.moment.line = null;
      if (!w.moment.photo) w.moment = null;
    }
  }
}
