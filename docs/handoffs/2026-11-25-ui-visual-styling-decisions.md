# UI visual styling decisions (design chat, 25 Nov 2026)

Date: 2026-11-25, updated about 23:30 Singapore Time. Source: design chat in Claude Chat, Project "Family Habit App". Scope: the three "Week so far" pages only (page 1 Week so far, page 2 Older weeks loaded, page 3 An older week), per the canvas "Week so far: three top-of-screen options". Settings, "Habits so far", Rewards, the B2 family and the parked options are **not covered yet**. Inspiration: the Figma community file "Meditation App Free UI Template" (Medinow). Previews used made-up names, text and simple drawings in place of real photos.

## 0. What to do (for Claude Code)
1. Record sections 1 and 2 as dated entries under "UI decisions" in `docs/CONTEXT.md` (CLAUDE.md rule 6). Format `[YYYY-MM-DD HH:MM SGT]`.
2. **Recording only. Do not build.** No styling library (rule 6).
3. "owner decided" = the owner's own choice in this chat. "default" = my proposal, not yet approved.
4. `SUPERSEDED [2026-11-25 23:15 SGT]`: the earlier decision (clean white page, sage `#6F8F7A`, 8 px corners, "medium depth with a flat strip") is replaced by section 1. The owner found it flat and amateurish next to the Medinow template.
5. `SUPERSEDED [2026-11-25 23:20 SGT]`: the inactive tab and dustbin colour `#8A9893` (and the interim proposal `#66756F` at full strength) is replaced by the faded-tab decision in section 1.
6. `SUPERSEDED [2026-11-25 23:30 SGT]`: the interim dustbin colour `#66756F` is replaced by the dustbin rule in section 1 (same fade as the unselected tabs).

## 1. Decided by the owner (2026-11-25, "go with version 4, for now")
| Topic | Decision |
|---|---|
| Mood | Calm and gentle (unchanged), with more presence and polish |
| Header (page 1) | A full-width **deep green band** (`#1E7A6C`) holding "Hi [name]" and the week line in white; the week's moment photo overlaps the band's lower edge |
| Page background | Pale mint `#F2F7F5`; cards and the tab bar are white |
| Accent colour | Deep green `#1E7A6C` for ticks, filled circles, today outline, the button and the active tab |
| Headings and text | Soft rounded sans (system rounded stack, for example `ui-rounded`, Nunito, Segoe UI, system-ui); headings semi-bold (600) |
| Corners | Large: cards and the moment photo about 20 px; thumbnails and icon tiles about 14 px; buttons are full pills |
| Main photo | **No white border**; a strong soft shadow only (`0 10px 24px rgba(20,60,52,.25)`) |
| Cards | White, no border, shadow `0 2px 4px rgba(20,60,52,.05)` plus `0 10px 24px rgba(20,60,52,.08)` |
| Day strip | Seven round 32 px circles: filled green with a white tick for logged days, plain grey ring for an empty day, plain green outline for today |
| Log rows | Photo thumbnail (56 px, 14 px corners) when there is a photo; when there is none, a **colour-coded tile per habit** (Option Y, owner decided, see below); name semi-bold, "Day · child" in secondary text, the parent's line in normal text, dustbin at the right |
| Photo-less tile colours (Option Y) | One colour and one small line icon per habit (owner decided the principle). The first three were shown and accepted in the preview: Showing affection = pink heart (tile `#FFE4EA`, icon `#D6456B`); Giving attention = orange clock (tile `#FFEBD2`, icon `#C9731B`); Descriptive praise = blue star (tile `#E0ECFF`, icon `#3B6FD0`). The other six are a **default proposal, awaiting the owner** (section 2). Habit names are still placeholders (the parking-lot item "rework the nine behaviour names" is open), so tiles attach to the habit, not to its wording. |
| Connection circles | Five 44 px circles, filled green up to the answer, plain ring after |
| "Show 4 older weeks" button | **Outlined pill**: 2 px green border, green bold text, no fill, 50 px tall, with an up-chevron |
| Tab bar | White, soft upward shadow, line icons with a label under each; the active tab is green and bold with a 4 px bar above its icon |
| Unselected tabs (owner decided, 23:20) | The owner said the earlier grey still did not contrast enough with the selected tab, and asked to apply transparency and tone it down. Unselected tab icons and labels use the normal text colour `#1D2B27` at about 40% opacity; the active tab stays full strength. Rewards (not built yet) is fainter still, about 20%. Value is a preview default; the owner has not yet confirmed this exact strength. |
| Dustbin (owner decided, 23:30) | Toned down to match the unselected tabs: `#1D2B27` at about 40% opacity, same as Habits and Settings when unselected. Tap area unchanged (40 px). |
| Icons | Drawn line icons (1.8 px stroke, round caps), shipped as inline SVG, **not an icon font** (an icon font failed to load in the owner's preview and showed empty boxes) |
| Light or dark | Light only for now |

### Pages 2 and 3
- **Page 2:** each older week is a folded card: the date as a title above the card with a right chevron, the count line under it, then a white card holding 46 px tiles (12 px corners). The reflection tile is variant A: a pale green tint `#DDEEEA`, italic dark-green text. The "Show 1 more week - [dates]" button uses the same outlined pill. Photo-less tiles follow the colour-coded rule above.
- **Page 3:** the same green band at the top, holding a white "Back" with a left chevron, the week dates, "with [child] and [child]" and the count line. No tab bar. Below it, each day has its title (17 px, 600), the "Habit · child" line, a full-width photo (150 px tall, 20 px corners, same strong shadow, no border) with the parent's line and a dustbin beneath; a reflection sits in a white card in italic quotes.

## 2. Colour values used in the previews (default, not yet approved)
| Role | Value |
|---|---|
| Page | `#F2F7F5` |
| Card, tab bar | `#FFFFFF` |
| Main text | `#1D2B27` |
| Secondary text | `#5F706B` |
| Accent, band, button | `#1E7A6C` |
| Empty circle ring | `#D3DEDA` |
| Row divider | `#EAF0EE` |
| Unselected tab and dustbin | `#1D2B27` at about 40% opacity (Rewards about 20%) |

### Habit tiles (nine habits; first three shown and accepted, last six are my proposal)
| Habit | Type | Icon | Tile background | Icon colour | Status |
|---|---|---|---|---|---|
| Showing affection | Quick | heart | `#FFE4EA` | `#D6456B` | accepted in preview |
| Giving attention | Quick | clock | `#FFEBD2` | `#C9731B` | accepted in preview |
| Descriptive praise | Quick | star | `#E0ECFF` | `#3B6FD0` | accepted in preview |
| Talking with children | Quick | speech bubble | `#EDE6FB` | `#7452C6` | default, awaiting owner |
| Spending quality time | Deliberate | sun | `#FFF3C4` | `#A07A0C` | default, awaiting owner |
| Interesting activities | Deliberate | compass | `#D9F0F2` | `#1C8394` | default, awaiting owner |
| Setting a good example | Deliberate | flag | `#E8F0D3` | `#5C7D1F` | default, awaiting owner |
| Incidental teaching | Deliberate | light bulb | `#F2E4D8` | `#8A5636` | default, awaiting owner |
| Ask-say-do | Deliberate | tick in a circle | `#E5E9EF` | `#4F5F78` | default, awaiting owner |

## 3. Open for the owner
- **Contrast trade-off:** white on `#1E7A6C` is about 5 to 1 (passes for text). Fading unselected tabs and the dustbin to about 40% opacity makes them quieter than the 4.5 to 1 level normally wanted for small text. This was the owner's choice (the active tab stands out clearly), so it is recorded as decided; re-check readability on a real phone in bright light.
- **Habit tile colours:** approve or change the six proposed tiles in section 2. Also decide whether the same colours appear on "Habits so far" and Rewards. Possible clash to check: the olive tile (Setting a good example) sits close to the app's green.
- **Text on the band:** white at 85% for the week line; check legibility on real devices.
- Confirm the exact font stack and whether to bundle a web font (needs a "no new libraries" check, rule 8).
- Real family photos may be dark or busy: re-check the overlap with the band and the shadows with real photos (owner agreed to check later).
- Dark mode, the Telegram bot look, a logo or wordmark, and the Settings, "Habits so far" and Rewards screens are not styled yet. Loading, empty and quiet-week states need styling once their layouts exist.

## 4. Not changed
All layout rules in the 14 Nov and 15 Nov handoffs stand (titles above boxes, dustbin 40 px tap area, delete leaves the log, Back only on page 3). Nothing is built.
