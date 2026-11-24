// =============================================================================
// src/web-app/week-page.ts: the HTML of My page's tabs (Week so far first)
//
// What it does: [2026-11-15] builds the inside of each page as HTML
// (headings, paragraphs, lists, links and buttons). It only arranges data it
// is given; reading and deleting happen in handler.ts.
// [2026-11-24] The owner's look (docs/CONTEXT.md, "UI decisions") is added by
// class names here, matched by the one stylesheet in style.ts (CLAUDE.md rule
// 6). The words and their order are unchanged; small icons are drawn inline
// (SVG, a picture written as text), so nothing is downloaded. The connection
// card's bars are now drawn boxes whose height follows the answer, because a
// browser's own <meter> bar can't stand upright.
//   - Week so far (rule 9.4, layout B2): header; the moment (only if saved);
//     days logged with the M to S strip and every log, newest first;
//     reflections; the connection card (rule 9.5); the older weeks list and
//     its button (rule 9.7); the tab bar (rule 9.2).
//   - "Are you sure?" (rule 9.6, wireframe A): its own page, Cancel and Delete.
//   - Habits so far and Settings: placeholders (Settings holds Sign out).
// Everything a parent typed goes through escapeHtml, so it is shown, never obeyed.
// [2026-11-24] Photos (owner-approved tests PH11, PH12): a log's or the
// moment's photo is shown big, through a short-lived link our server made
// (never the file's name in the store); a link that couldn't be made says so.
// One dustbin per row, one layer per tap (rule 9.6): the photo first, then the line.
// Not here yet (owner, 15 Nov): an older week's own page.
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

// The small outline icons (L12), drawn in the text's own colour
// ("currentColor"), so a tab's icon turns green with its label.
const icon = (paths: string, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICONS = {
  bin: icon(`<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>`, 18),
  week: icon(`<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>`),
  habits: icon(`<path d="M6 20v-6M12 20V6M18 20v-9"/>`),
  rewards: icon(`<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9h18M12 9v11M12 9c-1.5-4-6-4-5 -1M12 9c1.5-4 6-4 5-1"/>`),
  settings: icon(`<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>`),
  up: icon(`<path d="M6 15l6-6 6 6"/>`, 16),
};

// A dustbin: a link to its own "Are you sure?" page (it deletes nothing itself).
// Its label is read aloud by screen readers; the picture is the outline bin.
const dustbin = (kind: DeleteKind, id: number) =>
  ` <a class="bin" aria-label="${W.dustbin}" href="${BASE}?page=confirm&amp;kind=${kind}&amp;id=${id}">${ICONS.bin}</a>`;

// The tab bar (rule 9.2): Rewards is shown but switched off for now. The tab
// you are on is marked (aria-current), so it shows in green and screen
// readers say "current page" (test ST5).
export type Tab = "week" | "habits" | "settings";
export function tabBar(current: Tab): string {
  const tab = (name: Tab) =>
    `<li><a class="tab" href="${BASE}?page=${name}"${name === current ? ' aria-current="page"' : ""}>${ICONS[name]}<span>${W.tabs[name]}</span></a></li>`;
  return (
    `<nav><ul>` +
    tab("week") +
    tab("habits") +
    `<li><span class="tab off">${ICONS.rewards}<button disabled>${W.tabs.rewards}</button></span></li>` +
    tab("settings") +
    `</ul></nav>`
  );
}

// The connection card (rule 9.5): only real answers; "–" for a week without one.
function connectionCard(weeks: ConnectionWeek[], monday: string): string {
  const title = `<h2>${W.connectionQuestion}</h2>`;
  if (!weeks.some((w) => w.rating !== null)) return title + `<div class="box"><p class="sub">${W.firstAnswer}</p></div>`;
  // Each bar: the answer on top, a drawn bar as tall as the answer (r1 to r5),
  // the week under it. A week without a rating has "–" and no bar.
  const bars = weeks.map((w) => {
    const now = w.monday === monday;
    const label = now ? `<span class="now-label">${W.thisWeek}</span>` : `<span>${esc(dayMonth(w.monday))}</span>`;
    const value =
      w.rating === null
        ? `<span class="n">${W.noRating}</span>`
        : `<span class="n">${w.rating}</span> <span class="bar r${w.rating}${now ? " now" : ""}"></span>`;
    return `<li>${value} ${label}</li>`;
  });
  return title + `<div class="box"><ol class="bars">${bars.join("")}</ol></div>`;
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
const tileClass = (t: OlderTile) => (t.kind === "reflection" ? "tile reflection" : "tile");
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
  return `<p><a class="pill wide" href="${BASE}?page=week&amp;older=${shown + OLDER_WEEKS_PER_PAGE}">${ICONS.up}<span>${esc(label)}</span></a></p>`;
}

// [2026-11-24] A photo: its short-lived link, or null if the link couldn't be made.
const photoView = (photoId: number, links: Map<number, string | null>) => {
  const link = links.get(photoId) ?? null;
  return link === null ? `<p class="muted">${W.photoNotLoaded}</p>` : `<img class="photo" src="${esc(link)}" alt="${W.photoAlt}">`;
};

export type WeekPageData = {
  photoLinks: Map<number, string | null>; // [2026-11-24] photo number -> its short-lived link (null: it failed)
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
  out.push(`<p class="sub">${esc(W.weekWith(weekRange(monday), nameList(week.children)))}</p>`); // dates and names both made safe

  // The week's moment, at the top, only when one is saved (Sunday evening).
  if (week.moment) {
    const m = week.moment;
    // One dustbin, one layer per tap: the photo first, then the line (rule 9.6).
    const bin = m.photo ? dustbin("moment-photo", m.photo.photo_id) : m.line ? dustbin("moment-line", m.line.moment_line_id) : "";
    const photo = m.photo ? photoView(m.photo.photo_id, d.photoLinks) : "";
    const line = m.line ? `<p class="moment-line">${quoted(m.line.text)}</p>` : "";
    out.push(`<section><h2>${W.momentTitle}</h2><div class="box"><div class="row"><div class="grow">${photo}${line}</div>${bin}</div></div></section>`);
  }

  // Days logged: the strip, then every log newest first.
  const logged = new Set(week.logs.map((l) => l.day));
  // A logged day is a filled circle with a tick; an empty day a ring (its "–" is hidden by the look).
  const strip = ["M", "T", "W", "T", "F", "S", "S"].map((letter, i) =>
    logged.has(addDays(monday, i)) ? `<li>${letter} <span class="dot on">✓</span></li>` : `<li>${letter} <span class="dot">–</span></li>`,
  );
  // Each row: the habit, the day under it, then the photo and the line; the dustbin on the right.
  const rows = [...week.logs].reverse().map((l) => {
    const photo = l.photo ? photoView(l.photo.photo_id, d.photoLinks) : "";
    const line = l.line === null ? "" : `<p>${esc(l.line)}</p>`;
    // One dustbin, one layer per tap: the photo first, then the line (rule 9.6).
    const bin = l.photo ? dustbin("photo", l.photo.photo_id) : l.line === null ? "" : dustbin("line", l.log_id);
    return `<li class="row"><div class="grow"><span class="habit">${esc(l.habit)}</span><span class="sep"> · </span><span class="when">${esc(dayName(l.day))}</span>${photo}${line}</div>${bin}</li>`;
  });
  out.push(`<section><h2>${W.daysLogged(logged.size)}</h2><div class="box"><ol class="strip">${strip.join("")}</ol><ul>${rows.join("")}</ul></div></section>`);

  // Reflections, word for word, in italics inside double quotes.
  const reflections = [...week.reflections]
    .reverse()
    .map((r) => `<li class="box"><div class="row"><p class="grow"><i>${quoted(r.text)}</i></p>${dustbin("reflection", r.reflection_id)}</div></li>`);
  out.push(`<section><h2>${W.reflectionsThisWeek(week.reflections.length)}</h2><ul class="stack">${reflections.join("")}</ul></section>`);

  out.push(`<section>${connectionCard(d.connection, monday)}</section>`);

  // Older weeks: the list loaded so far, then the button for the next ones.
  const cards = d.older.map(
    (w) =>
      `<li><h3>${esc(weekRange(w.monday))}</h3><p class="count">${countLine(w)}</p>` +
      `<ul class="box tiles">${w.tiles.map((t) => `<li class="${tileClass(t)}">${tileText(t)}</li>`).join("")}</ul></li>`,
  );
  const oldestLoaded = d.older.at(-1)?.monday ?? monday;
  const list = cards.length > 0 ? `<h2>${W.olderWeeksTitle}</h2><ul class="weeks">${cards.join("")}</ul>` : "";
  out.push(`<section>${list}${olderButton(d.olderRemaining, oldestLoaded, d.older.length)}</section>`);

  out.push(tabBar("week"));
  return out.join("");
}

// "Are you sure?" on its own page (rule 9.6, wireframe A): Cancel (outlined)
// and Delete (the only warning-red button, test ST7).
export function confirmPage(kind: DeleteKind, id: number): string {
  const QUESTIONS: Record<DeleteKind, string> = {
    line: W.confirmLine,
    reflection: W.confirmReflection,
    "moment-line": W.confirmMomentLine,
    photo: W.confirmPhoto,
    "moment-photo": W.confirmMomentPhoto,
  };
  const question = QUESTIONS[kind];
  return (
    `<p class="question">${question}</p>` +
    `<form class="actions" method="post" action="${BASE}?page=delete">` +
    `<input type="hidden" name="kind" value="${kind}"><input type="hidden" name="id" value="${id}">` +
    `<a class="pill" href="${BASE}?page=week">${W.cancel}</a> <button class="pill danger" type="submit">${W.delete}</button></form>`
  );
}

// The two placeholder tabs. Settings holds Sign out for now (rule 9.2).
export const habitsPage = () => `<h1>${W.tabs.habits}</h1><p class="sub">${W.habitsComingSoon}</p>` + tabBar("habits");
export const settingsPage = () =>
  `<h1>${W.tabs.settings}</h1><p class="sub">${W.settingsComingSoon}</p>` +
  `<form method="post" action="${BASE}?page=sign-out"><button class="pill wide" type="submit">${esc(W.signOutButton)}</button></form>` +
  tabBar("settings");
