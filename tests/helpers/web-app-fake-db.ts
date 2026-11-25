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
// [2026-11-25] Also the Settings tab (migration 016): one parent's settings,
// changed by the same counting rules as the database (T131 to T145), the
// Telegram chat returned for a pause, and "delete my data".
// Moved here from tests/web-app-sign-in.test.ts so both Web app test files
// share one pretend database (the sign-in behaviour is unchanged).
// =============================================================================

import type { ConnectionWeek, DeleteKind, OlderWeeksPage, SettingsChange, WebAppDb, WebSettings, WebWeek } from "../../src/web-app/handler.js";

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
  // [2026-11-24] Photos (PH11, PH12): the files in the pretend store, the links made, the files removed.
  photoStore = new Set<string>();
  removedFiles: string[] = [];
  async photoLink(pass: string, path: string): Promise<string> {
    this.maybeFail("photoLink", [pass, path]);
    return `https://abcd.supabase.co/storage/v1/object/sign/photos/${path}?token=short-lived`;
  }
  async photoFiles(pass: string, photoId: number): Promise<string[]> {
    this.maybeFail("photoFiles", [pass, photoId]);
    const w = this.weekData;
    const photo = [...w.logs.map((l) => l.photo), w.moment?.photo ?? null].find((p) => p?.photo_id === photoId);
    if (!photo) throw new Error("That photo was not found.");
    return [photo.path, ...(photo.preview_path ? [photo.preview_path] : [])];
  }
  async removePhotoFiles(pass: string, paths: string[]): Promise<void> {
    this.maybeFail("removePhotoFiles", [pass, paths]);
    for (const p of paths) this.photoStore.delete(p);
    this.removedFiles.push(...paths);
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
    } else if (kind === "photo" || kind === "moment-photo") {
      // [2026-11-24] Edit 6: the photo's record goes (its files were removed first).
      const log = w.logs.find((l) => l.photo?.photo_id === id);
      if (log) log.photo = null;
      else if (w.moment?.photo?.photo_id === id) {
        w.moment.photo = null;
        if (!w.moment.line) w.moment = null;
      } else throw new Error("That photo was not found.");
    } else {
      if (!w.moment?.line || w.moment.line.moment_line_id !== id) throw new Error("That moment line was not found.");
      w.moment.line = null;
      if (!w.moment.photo) w.moment = null;
    }
  }

  // [2026-11-25] The Settings tab (migration 016). Behaviours 1 and 2 are quick,
  // 3 is quick too, 4 is deliberate.
  telegramChat = 2001;
  settingsData: WebSettings = {
    firstName: "Cara",
    paused: false,
    wrapUpMinute: 1200,
    children: [{ id: 11, firstName: "Riley" }],
    picks: [{ nudgeId: 1, frequency: "every_2_days" }],
    behaviours: [
      { id: 1, name: "Showing affection", category: "quick" },
      { id: 2, name: "Praising effort", category: "quick" },
      { id: 3, name: "Bedtime chat", category: "quick" },
      { id: 4, name: "One-on-one time", category: "deliberate" },
    ],
    schoolSlots: [420, 1140],
    nonSchoolSlots: [540],
    recordingAgreedAt: new Date("2026-11-12T03:00:00Z"),
  };
  deleted = false;
  async settings(pass: string): Promise<WebSettings> {
    this.maybeFail("settings", [pass]);
    return structuredClone(this.settingsData);
  }
  async changeSetting(pass: string, change: SettingsChange): Promise<number | null> {
    this.maybeFail("changeSetting", [pass, change]);
    const s = this.settingsData;
    switch (change.kind) {
      case "paused":
        s.paused = change.paused;
        return this.telegramChat;
      case "wrap-up-time":
        s.wrapUpMinute = change.minute;
        return null;
      case "name":
        if (change.firstName.trim() === "") throw new Error("A name can't be blank.");
        s.firstName = change.firstName.trim();
        return null;
      case "add-child":
        if (s.children.length >= 3) throw new Error("A parent can have up to 3 children (Q7b).");
        s.children.push({ id: 100 + s.children.length, firstName: change.firstName.trim() });
        return null;
      case "rename-child": {
        const c = s.children.find((x) => x.id === change.childId);
        if (!c) throw new Error("That child was not found.");
        c.firstName = change.firstName.trim();
        return null;
      }
      case "behaviours": {
        const cat = (id: number) => s.behaviours.find((b) => b.id === id)?.category;
        const quick = change.picks.filter((k) => cat(k.nudgeId) === "quick").length;
        const deliberate = change.picks.filter((k) => cat(k.nudgeId) === "deliberate").length;
        if (quick + deliberate < 1 || quick > 2 || deliberate > 1) throw new Error("Choose up to 2 quick and 1 deliberate behaviour, at least 1 (rule 2.1).");
        s.picks = structuredClone(change.picks);
        return this.telegramChat; // [2026-11-25] migration 017: for the new habit buttons
      }
      case "times":
        if (change.minutes.length < 1 || change.minutes.length > 3) throw new Error("Each schedule needs 1 to 3 times (rule 3.1).");
        if (change.schedule === "school") s.schoolSlots = [...change.minutes].sort((a, b) => a - b);
        else s.nonSchoolSlots = [...change.minutes].sort((a, b) => a - b);
        return null;
    }
  }
  async allPhotoFiles(pass: string): Promise<string[]> {
    this.maybeFail("allPhotoFiles", [pass]);
    return [...this.photoStore];
  }
  async deleteMyData(pass: string, removedFiles: string[]): Promise<void> {
    this.maybeFail("deleteMyData", [pass, removedFiles]);
    // Like migration 016: refused unless every photo file was removed first.
    if ([...this.photoStore].some((f) => !removedFiles.includes(f))) throw new Error("Remove every photo file first (rule 8.5).");
    this.deleted = true;
    for (const s of this.signIns.values()) s.ended = true;
  }
}
