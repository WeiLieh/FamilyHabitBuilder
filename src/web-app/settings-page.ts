// =============================================================================
// src/web-app/settings-page.ts: the HTML of My page's Settings tab
//
// What it does: [2026-11-25] builds the Settings list and each row's own page
// (rule 9.9), following the owner's clickable wireframe of 15 Nov (grouped
// list): About you (name, children), Reminders (behaviours, times, pause,
// Weekly Wrap Up), Privacy (What we record, two "Coming soon" rows, Delete my
// data), Account (Sign out). It also checks what a parent sends before
// anything is saved (checkSave), using the same rules as sign-up: the times
// and the Wrap Up time come from src/nudge-engine (rules 3.1, 3.12), the
// frequency options and name length from src/settings.ts (rule 1.4).
//
// Why plain forms: every switch, tick box and dustbin is a button inside a
// small form that our server answers, so every page works and is checked by
// the server even without scripts. Each row's own page has Back and no tab
// bar (as in the wireframe). Everything a parent typed goes through escapeHtml.
// [2026-11-26] The Settings fixes (owner, 26 Nov, "all as recommended"; W1 to
// W7): after a Save the parent stays on that row's page, where a pop-up says
// "Saved." with OK; a dustbin (🗑) per child, which asks first, and per time;
// and one small page script (SETTINGS_SCRIPT, allowed by its fingerprint in
// handler.ts), only on Behaviours and Pause: it greys out the other quick boxes
// once 2 are ticked, and lets the pause switch slide before the page reloads.
// A save that changes nothing (the same picks, a pause already so) is not sent
// to the database or Telegram (DEF-2, DEF-3).
// The look comes from the owner's UI decisions (style.ts, CLAUDE.md rule 6).
// =============================================================================

import type { SettingsChange, WebSettings } from "../datastore/web-app-store.js";
import { checkWrapUpTime } from "../nudge-engine/wrap-up.js";
import { availableSlotStarts, checkSchedules } from "../nudge-engine/schedule.js";
import {
  DEFAULT_FREQUENCIES,
  DELIBERATE_FREQUENCY_TIMES_PER_WEEK,
  MAX_QUICK_PICKS,
  MAX_CHILDREN,
  MAX_SLOTS_PER_SCHEDULE,
  NAME_MAX_CHARS,
  QUICK_FREQUENCIES,
  SIGN_IN_DAYS,
  SLOT_STARTS,
  WEB_PAGES,
} from "../settings.js";
import { toSgt } from "../sgt.js";
import { formatTime } from "../sgt.js";
import { escapeHtml as esc } from "./html.js";
import { BASE, BIN_ICON, tabBar } from "./week-page.js";
import { WEB_WORDS } from "./words.js";

const S = WEB_WORDS.settings;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// The pages behind the Settings rows (the "part" in the address).
export const PARTS = ["name", "children", "behaviours", "times", "pause", "wrap-up", "consent", "delete", "delete-sure", "sign-out"] as const;
export type Part = (typeof PARTS)[number];
export const isPart = (x: string | null): x is Part => PARTS.some((p) => p === x);
// [2026-11-26] What the Saved pop-up says (W1): plain "Saved.", or that Telegram wasn't told (rule 1.3).
export const NOTICES = ["saved", "saved-not-told"] as const;
export type Notice = (typeof NOTICES)[number];

// [2026-11-26] The one page script, on Behaviours and Pause only (W2, W6; owner
// Q2: the switch slides, then the form is sent; nothing is saved in the
// background). In plain English:
//   - in a group marked data-max, once that many boxes are ticked, the
//     unticked ones are switched off and greyed (class "greyed", L15);
//     unticking one brings them back. The server still checks (DEF-1).
//   - on a form marked data-slide, a tap flips the switch (it slides, L16),
//     further taps are ignored, and the form is sent 0.2 seconds later.
// It is written as one fixed text so its fingerprint never changes by accident.
export const SETTINGS_SCRIPT =
  'document.querySelectorAll("[data-max]").forEach(function(g){var max=Number(g.getAttribute("data-max"));var boxes=g.querySelectorAll("input[type=checkbox]");' +
  'function sync(){var n=0;boxes.forEach(function(b){if(b.checked)n++});boxes.forEach(function(b){var off=!b.checked&&n>=max;b.disabled=off;b.parentNode.classList.toggle("greyed",off)})}' +
  'boxes.forEach(function(b){b.addEventListener("change",sync)});sync()});' +
  'document.querySelectorAll("form[data-slide]").forEach(function(f){var busy=false;f.addEventListener("submit",function(e){e.preventDefault();if(busy)return;busy=true;' +
  'var s=f.querySelector("[role=switch]");s.setAttribute("aria-checked",s.getAttribute("aria-checked")==="true"?"false":"true");setTimeout(function(){f.submit()},200)})});';
const script = `<script>${SETTINGS_SCRIPT}</script>`;

// "7:00pm" -> "7:00 pm", the owner's agreed style.
export const timeText = (minutes: number) => formatTime(minutes).replace(/(am|pm)$/, " $1");
const partLink = (part: Part) => `${BASE}?page=settings&amp;part=${part}`;
const chevron = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>`;
const back = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M10 3l-5 5 5 5"/></svg>`;

// How each frequency is said. A frequency missing here fails the type check.
const FREQUENCY_WORDS: Record<string, string> = {
  every_day: "Every day",
  every_2_days: "Every 2 days",
  once_a_week: "Once a week",
  twice_a_week: "Twice a week",
};
const DELIBERATE_FREQUENCIES = Object.keys(DELIBERATE_FREQUENCY_TIMES_PER_WEEK);

// ---- The list ----------------------------------------------------------------

// One row of the list: a link with its current value and a chevron, or a
// greyed row that can't be tapped ("Coming soon").
const row = (label: string, part: Part, value = "") =>
  `<li><a class="set-row" href="${partLink(part)}"><span class="grow">${label}</span>${value ? `<span class="val">${esc(value)}</span>` : ""}${chevron}</a></li>`;
const offRow = (label: string) => `<li><span class="set-row off"><span class="grow">${label}</span><span class="val">${S.comingSoon}</span></span></li>`;
const group = (title: string, rows: string[]) => `<h2>${title}</h2><ul class="box list">${rows.join("")}</ul>`;

// [2026-11-26] The list no longer says "Saved.": the row's own page does, in a pop-up (W1).
export function settingsList(s: WebSettings): string {
  const quick = s.picks.filter((k) => s.behaviours.find((b) => b.id === k.nudgeId)?.category === "quick").length;
  const deliberate = s.picks.length - quick;
  return (
    `<h1>${WEB_WORDS.tabs.settings}</h1>` +
    group(S.aboutYou, [row(S.yourName, "name", s.firstName), row(S.children, "children", s.children.map((c) => c.firstName).join(", ") || S.noneYet)]) +
    group(S.reminders, [
      row(S.behaviours, "behaviours", S.behavioursValue(quick, deliberate)),
      row(S.times, "times", S.timesValue(s.schoolSlots.length, s.nonSchoolSlots.length)),
      row(S.pause, "pause", s.paused ? S.on : S.off),
      row(S.wrapUp, "wrap-up", `Sun ${timeText(s.wrapUpMinute)}`),
    ]) +
    group(S.privacy, [row(S.whatWeRecord, "consent"), offRow(S.download), offRow(S.helpUs), row(S.deleteMyData, "delete")]) +
    group(S.account, [row(S.signOut, "sign-out")]) +
    `<p class="muted gap">${S.staySignedIn(SIGN_IN_DAYS)}</p>` +
    tabBar("settings")
  );
}

// ---- Each row's own page -------------------------------------------------------

// The header of a row's page: Back on the left, the title in the middle.
const header = (title: string) =>
  `<header class="sub-head"><a class="back" href="${BASE}?page=settings">${back}<span>${S.back}</span></a><h1>${title}</h1></header>`;
// A small form posting one change. "fields" are hidden inputs plus the button.
// "attrs" marks a form for the page script (data-slide).
const form = (inner: string, action = "settings-save", attrs = "") => `<form method="post" action="${BASE}?page=${action}"${attrs}>${inner}</form>`;
const hidden = (name: string, value: string | number) => `<input type="hidden" name="${name}" value="${esc(String(value))}">`;
const errorLine = (error: string | null) => (error ? `<p class="error" role="alert">${esc(error)}</p>` : "");
const saveButton = `<button class="pill wide primary" type="submit">${S.save}</button>`;
const timeOptions = (choices: number[], selected: number | null) =>
  choices.map((m) => `<option value="${m}"${m === selected ? " selected" : ""}>${timeText(m)}</option>`).join("");

// [2026-11-26] A pop-up over the dimmed page (W1, W4; L14). It is part of the
// page our server draws, so it needs no script: OK and Cancel are links.
const dialog = (inner: string) => `<div class="dim" role="dialog" aria-modal="true" aria-labelledby="pop-words"><div class="box pop">${inner}</div></div>`;
const savedPopUp = (part: Part, notice: Notice) =>
  dialog(
    `<span class="dot on" aria-hidden="true">✓</span><p id="pop-words" role="status">${notice === "saved" ? S.saved : S.savedNotTold}</p>` +
      `<a class="pill wide" href="${partLink(part)}">${S.ok}</a>`,
  );
// "Remove [name]?" (W4): Cancel goes back to Children; Remove sends the removal.
const removeChildPopUp = (child: { id: number; firstName: string }) =>
  dialog(
    `<p id="pop-words" class="question">${esc(S.removeChildQuestion(child.firstName))} ${S.removeChildNote}</p>` +
      `<div class="actions"><a class="pill" href="${partLink("children")}">${WEB_WORDS.cancel}</a>` +
      form(`${hidden("part", "children-remove")}${hidden("child", child.id)}<button class="pill danger" type="submit">${S.remove}</button>`) +
      `</div>`,
  );

// What a row's page may show besides its own content: a problem with what was
// sent, the Saved pop-up (from our notice cookie), or the "Remove [name]?"
// question for that child (Children only).
export type PartExtras = { error?: string | null; notice?: Notice | null; removing?: { id: number; firstName: string } | null };

export function settingsPart(part: Part, s: WebSettings, extras: PartExtras = {}): string {
  const error = extras.error ?? null;
  const pop = (extras.removing && part === "children" ? removeChildPopUp(extras.removing) : "") + (extras.notice ? savedPopUp(part, extras.notice) : "");
  return pageOf(part, s, error) + pop;
}

function pageOf(part: Part, s: WebSettings, error: string | null): string {
  switch (part) {
    case "name":
      return (
        header(S.yourName) +
        form(
          `<h2><label for="first_name">${S.whatShallWeCallYou}</label></h2>${errorLine(error)}` +
            `<div class="box"><input class="field" id="first_name" name="first_name" maxlength="${NAME_MAX_CHARS}" value="${esc(s.firstName)}"></div>` +
            hidden("part", "name") +
            saveButton,
        )
      );
    case "children": {
      // [2026-11-26] A 🗑 beside each name, a link that asks first (W3, W4); the last child has none.
      const bin = (c: { id: number; firstName: string }) =>
        s.children.length > 1
          ? `<a class="bin" aria-label="${esc(S.removeLabel(c.firstName))}" href="${partLink("children")}&amp;remove=${c.id}">${BIN_ICON}</a>`
          : "";
      const boxes = s.children.map(
        (c, i) =>
          `<div class="child-row"><input class="field" aria-label="${S.childLabel(i + 1)}" name="child-${c.id}" maxlength="${NAME_MAX_CHARS}" value="${esc(c.firstName)}">${bin(c)}</div>`,
      );
      if (s.children.length < MAX_CHILDREN) {
        boxes.push(`<input class="field" aria-label="${S.addChildLabel}" name="new" maxlength="${NAME_MAX_CHARS}" placeholder="${S.addChildLabel}">`);
      }
      return (
        header(S.children) +
        form(`<h2>${S.yourChildren}</h2>${errorLine(error)}<div class="box fields">${boxes.join("")}</div>` + hidden("part", "children") + saveButton) +
        `<p class="muted gap">${S.nicknameIsEnough}</p>`
      );
    }
    case "behaviours": {
      const chosen = new Map(s.picks.map((k) => [k.nudgeId, k.frequency]));
      const quick = s.behaviours.filter((b) => b.category === "quick");
      const deliberate = s.behaviours.filter((b) => b.category === "deliberate");
      const quickFreq = quick.map((b) => chosen.get(b.id)).find((f) => f) ?? DEFAULT_FREQUENCIES.quick;
      const delibFreq = deliberate.map((b) => chosen.get(b.id)).find((f) => f) ?? DEFAULT_FREQUENCIES.deliberate;
      const tick = (name: string, value: string, label: string, on: boolean, type: "checkbox" | "radio") =>
        `<label class="choice"><input type="${type}" name="${name}" value="${esc(value)}"${on ? " checked" : ""}><span>${esc(label)}</span></label>`;
      const noDeliberate = !deliberate.some((b) => chosen.has(b.id));
      return (
        header(S.behaviours) +
        form(
          errorLine(error) +
            `<h2>${S.quickBehaviours}</h2><div class="box list" data-max="${MAX_QUICK_PICKS}">${quick.map((b) => tick("quick", String(b.id), b.name, chosen.has(b.id), "checkbox")).join("")}</div>` +
            `<p class="muted gap">${S.chooseUpTo2}</p>` +
            `<h2>${S.howOftenQuick}</h2><div class="box list">${QUICK_FREQUENCIES.map((f) => tick("quick_frequency", f, FREQUENCY_WORDS[f] ?? f, f === quickFreq, "radio")).join("")}</div>` +
            `<h2>${S.oneDeliberate}</h2><div class="box list">${tick("deliberate", "none", S.none, noDeliberate, "radio")}${deliberate
              .map((b) => tick("deliberate", String(b.id), b.name, chosen.has(b.id), "radio"))
              .join("")}</div>` +
            `<p class="muted gap">${S.optional}</p>` +
            `<h2>${S.howOftenDeliberate}</h2><div class="box list">${DELIBERATE_FREQUENCIES.map((f) => tick("deliberate_frequency", f, FREQUENCY_WORDS[f] ?? f, f === delibFreq, "radio")).join("")}</div>` +
            hidden("part", "behaviours") +
            saveButton,
        ) +
        script
      );
    }
    case "times": {
      const schedule = (title: string, key: "school" | "non_school", slots: number[]) => {
        const rows = slots.map(
          (m) =>
            `<li class="set-row"><span class="grow">${timeText(m)}</span>` +
            (slots.length > 1
              ? form(
                  `${hidden("part", "times")}${hidden("schedule", key)}${hidden("action", "remove")}${hidden("minute", m)}` +
                    `<button class="bin" type="submit" aria-label="${S.removeLabel(timeText(m))}">${BIN_ICON}</button>`,
                )
              : "") +
            `</li>`,
        );
        // Only times allowed next to the others (not used, at least 1 hour apart).
        const free = availableSlotStarts([...slots, -1], slots.length).filter((o) => o.available).map((o) => o.start);
        const add =
          slots.length < MAX_SLOTS_PER_SCHEDULE
            ? form(
                `${hidden("part", "times")}${hidden("schedule", key)}${hidden("action", "add")}` +
                  `<div class="add"><select class="field" name="minute" aria-label="${S.addTimeLabel(title)}">${timeOptions(free, null)}</select>` +
                  `<button class="pill" type="submit">${S.addTime}</button></div>`,
              )
            : "";
        return `<h2>${title}</h2><ul class="box list">${rows.join("")}</ul>${add}`;
      };
      return (
        header(S.times) +
        errorLine(error) +
        schedule(S.schoolDays, "school", s.schoolSlots) +
        schedule(S.weekends, "non_school", s.nonSchoolSlots) +
        `<p class="muted gap">${S.timesRule}</p>`
      );
    }
    case "pause":
      return (
        header(S.pause) +
        errorLine(error) +
        form(
          `<div class="box"><div class="set-row"><span class="grow" id="pause-label">${S.pauseAll}</span>` +
            `<button class="switch" type="submit" role="switch" aria-checked="${s.paused}" aria-labelledby="pause-label"><span class="knob"></span></button></div></div>` +
            hidden("part", "pause") +
            hidden("paused", s.paused ? "off" : "on"),
          "settings-save",
          " data-slide",
        ) +
        `<p class="muted gap">${S.pauseNote}</p><p class="muted gap">${S.pauseTelegram}</p>` +
        script
      );
    case "wrap-up":
      return (
        header(S.wrapUp) +
        form(
          `<h2><label for="minute">${S.wrapUpTime}</label></h2>${errorLine(error)}` +
            `<div class="box"><select class="field" id="minute" name="minute">${timeOptions(SLOT_STARTS, s.wrapUpMinute)}</select></div>` +
            hidden("part", "wrap-up") +
            saveButton,
        ) +
        `<p class="muted gap">${S.wrapUpNote}</p>`
      );
    case "consent": {
      const agreed = s.recordingAgreedAt ? toSgt(s.recordingAgreedAt).date : null;
      const date = agreed ? `${Number(agreed.slice(8, 10))} ${MONTHS[Number(agreed.slice(5, 7)) - 1]} ${agreed.slice(0, 4)}` : null;
      return (
        header(S.whatWeRecord) +
        `<ul class="box list"><li class="set-row stack-row"><b>${S.whatWeRecord}</b><span class="sub">${S.recordText}</span></li>` +
        `<li class="set-row stack-row"><b>${S.photos}</b><span class="sub">${S.photosText}</span></li></ul>` +
        (date ? `<p class="muted gap">${S.agreedOn(date)}</p>` : "") +
        `<p class="muted gap">${S.withdraw}</p>` +
        `<ul class="box list gap"><li><a class="set-row" href="${WEB_PAGES.terms}"><span class="grow">${S.terms}</span>${chevron}</a></li></ul>`
      );
    }
    case "delete":
      return (
        header(S.deleteMyData) +
        `<p class="sub">${S.deleteIntro}</p>` +
        `<ul class="box list gap">${S.deleteList.map((x) => `<li class="set-row">${x}</li>`).join("")}</ul>` +
        `<p class="muted gap">${S.deleteAfter}</p>` +
        `<a class="pill wide" href="${partLink("delete-sure")}">${S.continueToDelete}</a>`
      );
    case "delete-sure":
      return (
        header(S.deleteMyData) +
        form(
          `<h2>${S.areYouSure}</h2>${errorLine(error)}` +
            `<div class="box"><label class="choice"><input type="checkbox" name="understood" value="yes"><span>${S.understood}</span></label></div>` +
            `<button class="pill wide danger" type="submit">${S.yesDelete}</button>`,
          "delete-my-data",
        ) +
        `<a class="pill wide" href="${BASE}?page=settings">${WEB_WORDS.cancel}</a>`
      );
    case "sign-out":
      return (
        header(S.signOut) +
        `<h2>${S.signOutQuestion}</h2><ul class="box list">${S.signOutLines.map((x) => `<li class="set-row">${x}</li>`).join("")}</ul>` +
        form(`<button class="pill wide primary" type="submit">${S.yesSignOut}</button>`, "sign-out") +
        `<a class="pill wide" href="${BASE}?page=settings">${WEB_WORDS.cancel}</a>`
      );
  }
}

// After "delete my data": the end page (no tab bar, nothing to go back to).
export const deletedPage = () => `<h1>${S.deletedTitle}</h1><p class="sub gap">${S.deletedText}</p>`;

// ---- Checking what was sent, before saving ------------------------------------

// What a save becomes: the database changes to make, the page and its words
// if something is wrong, or "not this form" for something our pages never send.
// [2026-11-26] "part" on a good save is the row's page to go back to (W1).
// An empty list of changes means nothing changed: nothing is sent (DEF-2, DEF-3).
export type SaveCheck = { ok: true; part: Part; changes: SettingsChange[] } | { ok: false; part: Part; error: string } | { ok: false; part: null };

const cleanName = (raw: string | null) => (raw ?? "").trim();

// The same picks, in any order (a form sends them in the page's order).
const samePicks = (a: { nudgeId: number; frequency: string }[], b: { nudgeId: number; frequency: string }[]) => {
  const key = (x: { nudgeId: number; frequency: string }[]) => x.map((k) => `${k.nudgeId}:${k.frequency}`).sort().join(",");
  return key(a) === key(b);
};

export function checkSave(form: URLSearchParams, s: WebSettings): SaveCheck {
  const part = form.get("part");
  const bad = (p: Part, error: string): SaveCheck => ({ ok: false, part: p, error });
  const good = (p: Part, changes: SettingsChange[]): SaveCheck => ({ ok: true, part: p, changes });
  switch (part) {
    case "pause": {
      const v = form.get("paused");
      if (v !== "on" && v !== "off") return { ok: false, part: null };
      // [2026-11-26] Already so (a repeated tap): nothing to send (DEF-3).
      return good("pause", (v === "on") === s.paused ? [] : [{ kind: "paused", paused: v === "on" }]);
    }
    case "wrap-up": {
      const minute = Number(form.get("minute"));
      if (!Number.isInteger(minute) || !checkWrapUpTime(minute).ok) return bad("wrap-up", S.pickAListedTime);
      return good("wrap-up", [{ kind: "wrap-up-time", minute }]);
    }
    case "name": {
      const name = cleanName(form.get("first_name"));
      if (name === "") return bad("name", S.typeAName);
      if (name.length > NAME_MAX_CHARS) return bad("name", S.nameTooLong(NAME_MAX_CHARS));
      return good("name", [{ kind: "name", firstName: name }]);
    }
    case "children": {
      const changes: SettingsChange[] = [];
      for (const c of s.children) {
        const raw = form.get(`child-${c.id}`);
        if (raw === null) continue; // not on the form: unchanged
        const name = cleanName(raw);
        if (name === "") return bad("children", S.childNeedsName);
        if (name.length > NAME_MAX_CHARS) return bad("children", S.nameTooLong(NAME_MAX_CHARS));
        if (name !== c.firstName) changes.push({ kind: "rename-child", childId: c.id, firstName: name });
      }
      const added = cleanName(form.get("new"));
      if (added !== "") {
        if (s.children.length >= MAX_CHILDREN) return bad("children", S.upTo3Children(MAX_CHILDREN));
        if (added.length > NAME_MAX_CHARS) return bad("children", S.nameTooLong(NAME_MAX_CHARS));
        changes.push({ kind: "add-child", firstName: added });
      }
      return good("children", changes);
    }
    // [2026-11-26] Remove a child (W3, W4; migration 018 deletes every earlier name too).
    case "children-remove": {
      const id = Number(form.get("child"));
      if (!s.children.some((c) => c.id === id)) return { ok: false, part: null };
      if (s.children.length <= 1) return bad("children", S.keepOneChild);
      return good("children", [{ kind: "remove-child", childId: id }]);
    }
    case "behaviours": {
      const known = (id: number, category: "quick" | "deliberate") => s.behaviours.some((b) => b.id === id && b.category === category);
      const quick = [...new Set(form.getAll("quick").map(Number))];
      if (quick.some((id) => !known(id, "quick"))) return { ok: false, part: null };
      const d = form.get("deliberate") ?? "none";
      const deliberate = d === "none" ? null : Number(d);
      if (deliberate !== null && !known(deliberate, "deliberate")) return { ok: false, part: null };
      const qf = form.get("quick_frequency") ?? "";
      const df = form.get("deliberate_frequency") ?? "";
      if (!QUICK_FREQUENCIES.includes(qf) || !DELIBERATE_FREQUENCIES.includes(df)) return bad("behaviours", S.pickHowOften);
      if (quick.length > MAX_QUICK_PICKS) return bad("behaviours", S.upTo2Quick);
      if (quick.length + (deliberate === null ? 0 : 1) < 1) return bad("behaviours", S.keepOneBehaviour);
      const picks = [...quick.map((nudgeId) => ({ nudgeId, frequency: qf })), ...(deliberate === null ? [] : [{ nudgeId: deliberate, frequency: df }])];
      // [2026-11-26] The same picks as now: nothing to send (DEF-2).
      return good("behaviours", samePicks(picks, s.picks) ? [] : [{ kind: "behaviours", picks }]);
    }
    case "times": {
      const schedule = form.get("schedule");
      const action = form.get("action");
      const minute = Number(form.get("minute"));
      if ((schedule !== "school" && schedule !== "non_school") || (action !== "add" && action !== "remove") || !Number.isInteger(minute)) {
        return { ok: false, part: null };
      }
      const now = schedule === "school" ? s.schoolSlots : s.nonSchoolSlots;
      const next = action === "add" ? [...now, minute].sort((a, b) => a - b) : now.filter((m) => m !== minute);
      if (action === "remove" && next.length === now.length) return bad("times", S.timeNotFound);
      if (next.length === 0) return bad("times", S.keepOneTime);
      const check = checkSchedules(schedule === "school" ? { school: next, nonSchool: s.nonSchoolSlots } : { school: s.schoolSlots, nonSchool: next });
      if (!check.ok) return bad("times", check.reasons.join(" "));
      return good("times", [{ kind: "times", schedule, minutes: next }]);
    }
    default:
      return { ok: false, part: null };
  }
}
