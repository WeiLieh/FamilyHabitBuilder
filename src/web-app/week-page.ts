// =============================================================================
// src/web-app/week-page.ts: the HTML of My page's tabs (Week so far first)
//
// What it does: [2026-11-15] builds the inside of each page as plain HTML
// (headings, paragraphs, lists, links, buttons and the browser's own <meter>
// bar), with no styling: the look comes later from the owner (CLAUDE.md rule
// 6; owner, 15 Nov: "vanilla HTML elements, I'll style it later"). It only
// arranges data it is given; reading and deleting happen in handler.ts.
//   - Week so far (rule 9.4, layout B2): header; the moment (only if saved);
//     days logged with the M to S strip and every log, newest first;
//     reflections; the connection card (rule 9.5); the older weeks list and
//     its button (rule 9.7); the tab bar (rule 9.2).
//   - "Are you sure?" (rule 9.6, wireframe A): its own page, Cancel and Delete.
//   - Habits so far and Settings: placeholders (Settings holds Sign out).
// Everything a parent typed goes through escapeHtml, so it is shown, never obeyed.
// Not here yet (owner, 15 Nov): photos (with the Photo check) and an older
// week's own page.
// =============================================================================

import type { ConnectionWeek, DeleteKind, OlderTile, OlderWeek, WebWeek } from "../datastore/web-app-store.js";
import { OLDER_WEEKS_PER_PAGE } from "../settings.js";
import { addDays, weekdayOf } from "../sgt.js";
import { escapeHtml as esc } from "./html.js";
import { WEB_WORDS as W } from "./words.js";

export const BASE = "/api/web-app";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "2026-11-10" -> "10 Nov"; with the weekday -> "Tue 10 Nov".
const dayMonth = (date: string) => `${Number(date.slice(8, 10))} ${MONTHS[Number(date.slice(5, 7)) - 1]}`;
const dayName = (date: string) => `${DAYS[weekdayOf(date)]} ${dayMonth(date)}`;
// A week's dates: "9 to 15 Nov", or "27 Oct to 2 Nov" across two months.
export function weekRange(monday: string): string {
  const sunday = addDays(monday, 6);
  return monday.slice(5, 7) === sunday.slice(5, 7) ? `${Number(monday.slice(8, 10))} to ${dayMonth(sunday)}` : `${dayMonth(monday)} to ${dayMonth(sunday)}`;
}
// "Riley", "Riley and Sam", "Riley, Sam and Max".
const nameList = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);
const quoted = (text: string) => `“${esc(text)}”`;

// A dustbin: a link to its own "Are you sure?" page (it deletes nothing itself).
const dustbin = (kind: DeleteKind, id: number) => ` <a href="${BASE}?page=confirm&amp;kind=${kind}&amp;id=${id}">${W.dustbin}</a>`;

// The tab bar (rule 9.2): Rewards is shown but switched off for now.
export function tabBar(): string {
  return (
    `<nav><ul>` +
    `<li><a href="${BASE}?page=week">${W.tabs.week}</a></li>` +
    `<li><a href="${BASE}?page=habits">${W.tabs.habits}</a></li>` +
    `<li><button disabled>${W.tabs.rewards}</button></li>` +
    `<li><a href="${BASE}?page=settings">${W.tabs.settings}</a></li>` +
    `</ul></nav>`
  );
}

// The connection card (rule 9.5): only real answers; "–" for a week without one.
function connectionCard(weeks: ConnectionWeek[], monday: string): string {
  const title = `<h2>${W.connectionQuestion}</h2>`;
  if (!weeks.some((w) => w.rating !== null)) return title + `<p>${W.firstAnswer}</p>`;
  const bars = weeks.map((w) => {
    const label = w.monday === monday ? W.thisWeek : dayMonth(w.monday);
    const value = w.rating === null ? W.noRating : `${w.rating} <meter min="0" max="5" value="${w.rating}"></meter>`;
    return `<li>${value} ${label}</li>`;
  });
  return title + `<ol>${bars.join("")}</ol>`;
}

// The count line of an older week (rule 9.7): parts with a zero are left out.
function countLine(w: OlderWeek): string {
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const parts = [
    w.habitLogs > 0 ? plural(w.habitLogs, "habit", "habits") : "",
    w.reflections > 0 ? plural(w.reflections, "reflection", "reflections") : "",
    w.moment ? "1 moment" : "",
  ].filter(Boolean);
  if (w.daysLogged === 0 && parts.length === 0) return "";
  const days = w.daysLogged > 0 ? `${plural(w.daysLogged, "day", "days")} logged` : "";
  return [days, parts.join(", ")].filter(Boolean).join(" - ");
}
const tileText = (t: OlderTile) =>
  t.kind === "moment"
    ? `${W.momentTile}: ${t.previewPath ? W.photoTile : esc(t.text ?? "")}`
    : t.kind === "log"
      ? t.previewPath
        ? W.photoTile
        : `✓ ${esc(t.habit ?? "")}`
      : quoted(t.text ?? "");

// The older weeks button: its label says exactly what the tap will load (rule 9.7).
function olderButton(remaining: number, oldestLoaded: string, shown: number): string {
  if (remaining <= 0) return "";
  const n = Math.min(OLDER_WEEKS_PER_PAGE, remaining);
  const back = addDays(oldestLoaded, -7 * n);
  const label = W.showOlder(n, OLDER_WEEKS_PER_PAGE, dayMonth(back), weekRange(back));
  return `<p><a href="${BASE}?page=week&amp;older=${shown + OLDER_WEEKS_PER_PAGE}">${esc(label)}</a></p>`;
}

export type WeekPageData = {
  week: WebWeek;
  monday: string; // this week's Monday
  connection: ConnectionWeek[];
  older: OlderWeek[]; // the older weeks loaded so far (newest first)
  olderRemaining: number; // how many older weeks a further tap could load
};

// Week so far (rule 9.4, layout B2).
export function weekPage(d: WeekPageData): string {
  const { week, monday } = d;
  const out: string[] = [];
  out.push(`<h1>${esc(W.hello(week.parentFirstName))}</h1>`);
  out.push(`<p>${esc(W.weekWith(weekRange(monday), nameList(week.children)))}</p>`);

  // The week's moment, at the top, only when one is saved (Sunday evening).
  if (week.moment) {
    const m = week.moment;
    const photo = m.photo ? `<p>${W.photoLater}</p>` : "";
    const line = m.line ? `<p>${quoted(m.line.text)}${dustbin("moment-line", m.line.moment_line_id)}</p>` : "";
    out.push(`<section><h2>${W.momentTitle}</h2>${photo}${line}</section>`);
  }

  // Days logged: the strip, then every log newest first.
  const logged = new Set(week.logs.map((l) => l.day));
  const strip = ["M", "T", "W", "T", "F", "S", "S"].map((letter, i) => `<li>${letter} ${logged.has(addDays(monday, i)) ? "✓" : "–"}</li>`);
  const rows = [...week.logs].reverse().map((l) => {
    const line = l.line === null ? "" : `<br>${esc(l.line)}${dustbin("line", l.log_id)}`;
    const photo = l.photo ? `<br>${W.photoLater}` : "";
    return `<li>${esc(l.habit)} · ${dayName(l.day)}${photo}${line}</li>`;
  });
  out.push(`<section><h2>${W.daysLogged(logged.size)}</h2><ol>${strip.join("")}</ol><ul>${rows.join("")}</ul></section>`);

  // Reflections, word for word, in italics inside double quotes.
  const reflections = [...week.reflections].reverse().map((r) => `<li><i>${quoted(r.text)}</i>${dustbin("reflection", r.reflection_id)}</li>`);
  out.push(`<section><h2>${W.reflectionsThisWeek(week.reflections.length)}</h2><ul>${reflections.join("")}</ul></section>`);

  out.push(`<section>${connectionCard(d.connection, monday)}</section>`);

  // Older weeks: the list loaded so far, then the button for the next ones.
  const cards = d.older.map(
    (w) => `<li><h3>${weekRange(w.monday)}</h3><p>${countLine(w)}</p><ul>${w.tiles.map((t) => `<li>${tileText(t)}</li>`).join("")}</ul></li>`,
  );
  const oldestLoaded = d.older.at(-1)?.monday ?? monday;
  const list = cards.length > 0 ? `<h2>${W.olderWeeksTitle}</h2><ul>${cards.join("")}</ul>` : "";
  out.push(`<section>${list}${olderButton(d.olderRemaining, oldestLoaded, d.older.length)}</section>`);

  out.push(tabBar());
  return out.join("");
}

// "Are you sure?" on its own page (rule 9.6, wireframe A): Cancel and Delete.
export function confirmPage(kind: DeleteKind, id: number): string {
  const question = kind === "line" ? W.confirmLine : kind === "reflection" ? W.confirmReflection : W.confirmMomentLine;
  return (
    `<p>${question}</p>` +
    `<form method="post" action="${BASE}?page=delete">` +
    `<input type="hidden" name="kind" value="${kind}"><input type="hidden" name="id" value="${id}">` +
    `<a href="${BASE}?page=week">${W.cancel}</a> <button type="submit">${W.delete}</button></form>`
  );
}

// The two placeholder tabs. Settings holds Sign out for now (rule 9.2).
export const habitsPage = () => `<h1>${W.tabs.habits}</h1><p>${W.habitsComingSoon}</p>` + tabBar();
export const settingsPage = () =>
  `<h1>${W.tabs.settings}</h1><p>${W.settingsComingSoon}</p>` +
  `<form method="post" action="${BASE}?page=sign-out"><button type="submit">${esc(W.signOutButton)}</button></form>` +
  tabBar();
