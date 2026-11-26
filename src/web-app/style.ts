// =============================================================================
// src/web-app/style.ts: My page's one stylesheet (the owner's look)
//
// What it does: [2026-11-24] holds the look the owner approved on 24 Nov
// (docs/CONTEXT.md, "UI decisions" L1 to L12, the warning-red Delete, no dark
// mode), taken from the owner's Claude Chat layout files of 14 Nov. It is
// plain CSS (Cascading Style Sheets, the browser's own styling language),
// written by hand: no styling library (CLAUDE.md rule 6).
//
// Why it also works out a fingerprint: the page's security rule (the Content
// Security Policy header, in handler.ts) blocks every style by default. It
// lets this one stylesheet through by its SHA-256 fingerprint (a hash: a short
// code that changes if even one character changes), so styling slipped into a
// page by anyone else is still blocked (owner, 24 Nov: option A).
// Consequence: every style must live here, as a class. A one-off style="…"
// attribute on an element would be silently blocked (test ST4).
//
// The colours are named once, at the top (":root"), so each approved colour
// appears in exactly one place; test ST2 checks no other colour sneaks in.
// =============================================================================

import { createHash } from "node:crypto";

export const STYLESHEET = [
  // The approved colours (L2 to L8 and the warning red). "color-scheme: light"
  // tells the phone this page is light only, so it stays white in dark mode.
  ":root{color-scheme:light;--text:#1F2328;--muted:#4F5660;--accent:#1F6F5C;--bar:#9CC7BC;--border:#D5D9DE;--rule:#E6E9ED;--bg:#FFFFFF;--danger:#B42318}",
  "*{box-sizing:border-box}",
  "html{background:var(--bg)}",
  // L1, L8, L9, L11: the system font, one phone-wide column, 20px margins, and
  // room at the bottom so the fixed tab bar never covers the last button.
  "body{margin:0 auto;max-width:390px;padding:24px 20px 104px;background:var(--bg);color:var(--text);font:14px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
  "h1{font-size:24px;font-weight:700;margin:0 0 2px}",
  "h2{font-size:20px;font-weight:700;margin:28px 0 8px}",
  "h3{font-size:20px;font-weight:700;margin:0}",
  "p{margin:0}",
  "ul,ol{list-style:none;margin:0;padding:0}",
  "a{color:inherit}",
  "svg{display:block;flex:none}",
  ".sub{color:var(--muted)}",
  ".muted{color:var(--muted);font-size:12px}",
  // L6, L10, L11: a box with a light grey border, 12px corners, 16px inside.
  ".box{border:1px solid var(--border);border-radius:12px;padding:16px;background:var(--bg)}",
  // The seven-day strip: a letter over a circle; a logged day is a filled green
  // circle with a white tick; an empty day is a grey ring (its "–" is hidden).
  ".strip{display:flex;justify-content:space-between;padding-bottom:12px}",
  ".strip li{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--muted)}",
  ".dot{width:32px;height:32px;border-radius:50%;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:transparent;font-size:15px;font-weight:700}",
  ".dot.on{background:var(--accent);border-color:var(--accent);color:var(--bg)}",
  // Rows: content on the left, the dustbin on the right; a pale line between rows (L7).
  ".row{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid var(--rule)}",
  ".row:first-child{border-top:0}",
  ".grow{flex:1;min-width:0;overflow-wrap:anywhere}",
  ".habit{display:block;font-size:15px;font-weight:600}",
  ".when{display:block;font-size:12px;color:var(--muted);margin-bottom:4px}",
  ".sep{display:none}",
  // A row alone inside its own box (a reflection, the moment's line) needs no extra space or line.
  ".box>.row{padding:0;border-top:0}",
  ".box>.muted+.row{margin-top:8px}",
  // L12: the dustbin, dark grey, with a tap area big enough for a thumb (40px).
  ".bin{flex:none;width:40px;height:40px;margin:-8px -10px -8px 0;display:flex;align-items:center;justify-content:center;color:var(--muted)}",
  // Reflections: each in its own box, in italics (rule 9.4).
  ".stack{display:flex;flex-direction:column;gap:8px}",
  ".quote{font-style:italic}",
  ".moment-line{font-size:15px}",
  // [2026-11-24] A photo, shown big (rule 9.4): the full width, the box's 12px corners (L10).
  ".photo{display:block;width:100%;height:auto;border-radius:12px;margin:8px 0}",
  // The connection card's bars: the answer on top, the bar, the week under it.
  // A bar's height follows the answer (1 to 5); "This week" is deep green (L4, L5).
  ".bars{display:flex;justify-content:space-around;align-items:flex-end;min-height:150px}",
  ".bars li{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;font-size:12px;color:var(--muted)}",
  ".bars .n{font-size:13px;font-weight:700;color:var(--text)}",
  ".bar{width:28px;border-radius:2px;background:var(--bar)}",
  ".bar.now{background:var(--accent)}",
  ".bars .now-label{color:var(--text);font-weight:600}",
  ".r1{height:16px}.r2{height:32px}.r3{height:48px}.r4{height:64px}.r5{height:80px}",
  // Older weeks: dates and count line above a box of small square tiles.
  ".weeks{display:flex;flex-direction:column;gap:20px}",
  ".count{font-size:13px;color:var(--muted);margin-bottom:8px}",
  ".tiles{display:flex;flex-wrap:wrap;gap:8px}",
  ".tiles:empty{display:none}",
  ".tile{width:56px;height:56px;border:1px solid var(--border);border-radius:8px;padding:4px;font-size:10px;line-height:1.25;overflow:hidden;color:var(--muted)}",
  ".tile.reflection{font-style:italic}",
  // Pills (L10): the older weeks button, Cancel and Sign out are outlined;
  // only Delete is filled with the warning red.
  ".pill{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 20px;border:1px solid var(--border);border-radius:20px;background:var(--bg);color:var(--text);font:inherit;font-weight:600;text-decoration:none;cursor:pointer}",
  ".pill.wide{width:100%;margin-top:20px}",
  ".pill.danger{background:var(--danger);border-color:var(--danger);color:var(--bg)}",
  ".actions{display:flex;gap:12px;margin-top:20px}",
  ".actions .pill{flex:1}",
  ".question{font-size:15px;margin-top:8px}",
  // The tab bar, fixed to the bottom; the current tab is green with a line on top.
  "nav{position:fixed;left:0;right:0;bottom:0;background:var(--bg);border-top:1px solid var(--rule);padding-bottom:env(safe-area-inset-bottom)}",
  "nav ul{display:flex;max-width:390px;margin:0 auto}",
  "nav li{flex:1}",
  ".tab{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 0 10px;border-top:2px solid transparent;font-size:11px;color:var(--muted);text-decoration:none}",
  ".tab[aria-current=page]{color:var(--accent);font-weight:600;border-top-color:var(--accent)}",
  ".tab.off{opacity:.45}",
  ".tab button{all:unset}",
  // [2026-11-25] Settings (rule 9.9), from the existing decisions only: rows in
  // a box with pale lines between them (L6, L7), 12px between rows and 16px
  // inside boxes (L11), 15px row labels (L9), pills (L10), Delete in warning red.
  // Not yet decided by the owner (step 2, "the look"): the switch and the tick
  // boxes use the accent green (L4, "ticks"); they are the browser's own controls.
  ".list{padding:0 16px}",
  ".set-row{display:flex;align-items:center;gap:12px;min-height:48px;padding:12px 0;border-top:1px solid var(--rule);font-size:15px;text-decoration:none;color:var(--text)}",
  ".list>li:first-child>.set-row,.list>.set-row:first-child,.list>.choice:first-child{border-top:0}",
  ".box>.set-row{border-top:0;padding:0}",
  ".set-row.off{color:var(--muted)}",
  ".set-row form{margin:0}",
  ".stack-row{flex-direction:column;align-items:flex-start;gap:4px}",
  ".val{color:var(--muted);font-size:14px;text-align:right}",
  ".gap{margin-top:8px}",
  ".error{margin:0 0 8px;font-weight:600}",
  ".sub-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}",
  ".sub-head h1{flex:1;font-size:20px;text-align:center;margin-right:72px}",
  ".back{display:flex;align-items:center;gap:2px;min-height:44px;min-width:64px;font-size:15px;text-decoration:none}",
  ".field{display:block;width:100%;min-height:44px;padding:0 12px;border:1px solid var(--border);border-radius:12px;background:var(--bg);color:var(--text);font:inherit;font-size:15px}",
  ".fields{display:flex;flex-direction:column;gap:12px}",
  ".add{display:flex;gap:12px;margin-top:12px}",
  ".add .field{flex:1}",
  ".choice{display:flex;align-items:center;gap:12px;min-height:48px;border-top:1px solid var(--rule);font-size:15px;cursor:pointer}",
  ".choice input{width:22px;height:22px;margin:0;accent-color:var(--accent)}",
  ".switch{position:relative;flex:none;width:52px;height:32px;border:0;border-radius:16px;background:var(--border);cursor:pointer;padding:0}",
  ".switch[aria-checked=true]{background:var(--accent)}",
  ".knob{position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:50%;background:var(--bg);transition:left .2s}",
  ".switch[aria-checked=true] .knob{left:23px}",
  // [2026-11-26] The Settings fixes (owner, 26 Nov): L14 the pop-up, a box on
  // the page dimmed with black at 40% ("66" is 40% of full strength in this
  // colour code), with the 32px filled green tick circle (L10, L13), body
  // text and an OK pill; L15 a choice that can't be picked at 40% strength;
  // L16 the switch's knob slides in 0.2 seconds (above). A child's name box
  // sits in a row with its dustbin; a dustbin button looks like the link one.
  ".dim{position:fixed;inset:0;background:#00000066;display:flex;align-items:center;justify-content:center;padding:20px}",
  ".pop{width:100%;max-width:390px;text-align:center}",
  ".pop .dot{margin:0 auto 12px}",
  ".pop .actions form{flex:1;display:flex;margin:0}",
  ".greyed{opacity:.4}",
  ".child-row{display:flex;align-items:center;gap:12px}",
  "button.bin{border:0;padding:0;background:none;cursor:pointer}",
].join("");

// The fingerprint the security rule names, in the form browsers expect.
export const STYLESHEET_HASH = createHash("sha256").update(STYLESHEET).digest("base64");
