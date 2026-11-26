# UAT runbook: Claude drives Telegram Web for the owner

[2026-11-26 21:14 SGT] Written for a **Claude session on the owner's own computer** (Claude desktop app, with browser control). That session reads this file, runs the owner's user acceptance tests (UAT) in the owner's browser, and fills in the results table at the end. The owner pastes the table back into the Claude Code cloud session, which records the results in the UAT files. Decided by the owner on 26 Nov (option A: Claude drives the browser; coded tests are a backlog item).

---

## 0. Read this first (for the Claude session running the tests)

You are helping the owner of the Family Habit App, a Telegram bot plus a web page ("My page") for parents. The owner is a product manager, not a developer: talk in plain English, short sentences, and say what you are about to do before you do it.

**Your job:** run the tests in section 3 one at a time, in the order given, in the browser where the owner is signed in to **Telegram Web** (web.telegram.org). For each test: say which test you're on, do the steps, compare what you see with "Expect", take a screenshot, write the result in the table (section 5), then move on. Pause when a step says **ASK THE OWNER**.

### Safety rules (never break these)
1. **Only the bot's chat.** Work only in the owner's chat with the Family Habit bot. Never open, read or type into any other Telegram chat. If you're not sure which chat is the bot, ASK THE OWNER.
2. **Never touch the owner's login.** Never handle the Telegram sign-in, QR codes, phone numbers, passwords or codes. If Telegram Web asks the owner to sign in, stop and ASK THE OWNER to do it.
3. **Never press any "Delete my data" button** (Delete my data, Continue to delete, Yes, delete everything). That deletes the owner's real account. Test U97 is **not run** tonight.
4. **Consent is the owner's choice.** If the bot asks for photo consent (OK / Don't save my photos), stop and ASK THE OWNER which to tap.
5. **Only delete what this run created.** Delete a line or a photo only if you created it during this run (tests U76 and U67 say which).
6. **Never change Vercel, Supabase, GitHub or any other website.** Only Telegram Web and the My page links the bot sends.
7. **No guessing.** A test passes only if you actually saw the expected words or screen. Quote what you saw. If a step can't be done (a button is missing, the page doesn't load, you can't upload a file), mark it **BLOCKED** or **FAIL** with what happened. Never fill a gap with what "should" have happened.
8. **Write down the starting values** in section 2 before changing anything, so you can put them back at the end.
9. If anything surprising happens (an error, a message you didn't expect), stop, screenshot it, and ASK THE OWNER before going on.

### Results you can give
- **PASS**: everything under "Expect" was seen.
- **FAIL**: something under "Expect" was different or missing. Quote what you saw instead.
- **BLOCKED**: the test couldn't be done (say why).
- **NOT RUN**: skipped on purpose (say why).
- **PARTLY**: some parts seen, some couldn't be checked (say which).

---

## 1. Before you start (with the owner)
- [ ] The owner is signed in to Telegram Web in the browser you control, and the bot's chat is open.
- [ ] ASK THE OWNER: "Have you added `DEMO_OWNER_TELEGRAM_IDS` in Vercel and redeployed?" If not, part F (the Demo) is BLOCKED. Don't try to do it yourself.
- [ ] ASK THE OWNER: "Which photo on your computer may I send to the bot for the photo tests?" (You may not be able to pick a file yourself; if so, the owner attaches it when asked.)
- [ ] Note the time now (Singapore time).

## 2. Starting values (fill in during U84, before changing anything)
| Setting | Value at the start | Put back at the end? |
|---|---|---|
| Your name | | yes |
| Children | | yes |
| Behaviours (and how often) | | yes |
| Reminder times, school days | | ask the owner |
| Reminder times, non-school days | | yes (don't change) |
| Pause reminders | | must be **Off** at the end |
| Weekly Wrap Up | | yes |

---

## 3. The tests, in order

**Timing for tonight (26 Nov, a school day):** the last reminder time the app allows is **9:30 pm**. Part A sets up a 9:30 pm reminder so part C can check what happens when one arrives. For that to work: reminders must be **unpaused** by 9:30 pm, and at least one **quick** habit must stay **unlogged** until the reminder comes. So don't log any habit before part C.

### Part A: Settings (open it with `/settings`)
| ID | Do this | Expect |
|---|---|---|
| U84 | In the bot's chat send `/settings`, tap **Open Settings ↗**, then the button on the page that opens. Fill in section 2 from what you see. | Settings opens (not Week so far): groups About you, Reminders, Privacy, Account; each row shows its value |
| U85 | Tap **Your name**, change it (add " Test" to the end), **Save**. Then send `/help` in the chat | Back on the list with "✅ Saved." and the new name. **Then put the old name back** and Save again. |
| U86 | Tap **Children**. ASK THE OWNER which name to correct (or skip that part) and which test name to add. Add it in the empty box, **Save** | Both changes show on the list; if there are now 3 children, the empty box is gone. **Then remove the test child** if the page lets you, and Save; if it can't be removed, tell the owner. |
| U87 | Tap **Behaviours**, tick a **3rd quick** behaviour, **Save** | "Choose up to 2 quick behaviours." and nothing is saved |
| U88 + U98 | Still in **Behaviours**: change how often one behaviour happens (or swap one), **Save**. Then look at the Telegram chat | Settings: "✅ Saved.". Telegram: "✅ Your habits are updated." with the new habit buttons under the chat; the old ones gone. **Then put the behaviours back** as in section 2, Save, and check Telegram updates the buttons again. Make sure at least one quick behaviour is chosen. |
| U89 | Tap **Reminder times** (school days). If **9:00 pm** is on the list, look at the times you can add: **9:30 pm should not be offered**. Then **Remove 9:00 pm** and **add 9:30 pm**. (If 9:00 pm isn't on the list, add a time that is offered, check it shows, Remove it, then add 9:30 pm if it is offered.) **Save** | Only allowed times are offered (at least 1 hour from the others); adding and Remove work; 9:30 pm is now on the list. Tell the owner: "You now have a 9:30 pm reminder tonight." |
| U90 | Tap **Pause reminders**, tap the switch | "✅ Saved."; Telegram: "⏸ Your reminders are paused. Send /resume any time to restart them."; the Menu (the button left of the message box) shows /resume |
| U91 + U53 | Tap the switch again | Telegram: "✅ Your reminders are back on."; the Menu shows /pause |
| U92 | In Telegram send `/pause`, tap **⏸ Pause**. Then open Settings again | Telegram says your reminders are paused; Settings shows **Pause reminders On**. **Then unpause** (switch off, or `/resume` and ✅ Resume) and check Telegram says "back on". **Reminders must be on before 9:30 pm.** |
| U93 | Tap **Weekly Wrap Up**, pick another Sunday time, **Save** | The list shows "Sun [new time]"; there is no on/off switch. **Then put the original time back** and Save (the first real Wrap Up is this Sunday). |
| U94 | Tap **What we record** | The wording, "You agreed on [date].", and a Terms and Conditions link |
| U96 | Tap **Download my memories**, then **Help us improve** | Nothing happens (shown as Coming soon) |
| U95 | Tap **Sign out**, then **Cancel**. Then **Sign out** again and **Yes, sign out** | Cancel goes back to the list; Yes signs you out. (Send `/mypage` in Telegram to sign in again for part B.) |
| U97 | Delete my data | **NOT RUN** (needs a test account; safety rule 3) |

### Part B: Week so far, looking only (open with `/mypage`)
| ID | Do this | Expect |
|---|---|---|
| U63 | Send `/mypage`, tap the link, then the button | "Hi [first name]", the week's dates "with [children]", the M to S strip with ✓ on each day logged, then the logs, newest first |
| U64 | Look at the reflections and the connection card | "[N] reflection(s) this week" with the words in italics and quotes; "How connected did you feel with your child?" with a bar per answered week and "–" for a week without an answer (or "Your first answer arrives on Sunday.") |
| U71 | Look at the connection card and the tab bar; scroll down | Bars stand upright, "This week" in deep green; the tab bar stays at the bottom while scrolling, "Week so far" in green |
| U68 | Tap the older weeks button (if there is one) | Older weeks listed, each with its dates and a count line. If there's no button, NOT RUN (joined less than a week ago) |
| U69 | Tap each tab at the bottom | Habits so far says "coming soon"; Rewards can't be tapped; Settings shows its list |
| U70 | Dark mode | **NOT RUN here** (the owner checks it on the phone) |

### Part C: a reminder arrives (at about 9:30 pm to 9:59 pm)
Wait in the bot's chat until a reminder arrives (reminders are sent in the 30 minutes from 9:30 pm, checked every 10 minutes). Don't tap anything on other messages while waiting. If nothing has arrived by 10:00 pm, mark U45 **BLOCKED** ("no reminder arrived") and move on.
| ID | Do this | Expect |
|---|---|---|
| U45 | When the reminder arrives, **don't** tap ✅ Done. Tap **that same behaviour** on the keyboard under the message box instead | The reminder keeps its words and **loses its buttons**; the receipt arrives below with **Undo** |
| U35, U46, U33 | — | **NOT RUN tonight** (need another reminder on another day) |

### Part D: photos and "Add how you felt" (after part C)
| ID | Do this | Expect |
|---|---|---|
| U73 | ASK THE OWNER which **deliberate** habit to log (it's a real log). Tap it on the keyboard | The receipt with "📷 Send a photo of what you did.", **Undo** and **Add how you felt** |
| U74 | Within 10 minutes, send the photo the owner chose (ask the owner to attach it if you can't) | If this is the first photo ever: the consent question with **OK** and **Don't save my photos**. **ASK THE OWNER which to tap** (safety rule 4). After OK: "Thanks. Please send the photo again." If the photo is saved straight away with no question, mark U74 **PARTLY** ("consent was given before; question not seen") |
| U75 | Send the photo again (if U74 asked for it) | "✅ Photo added to today's log."; on My page the photo shows big under that log |
| U77 | Tap **Add how you felt** under that receipt, type `UAT test line, please ignore`, send | The prompt, then "✅ Added to today's log."; the line shows under the log on My page |
| U78 | Tap **Add how you felt** again (on the same receipt, or a new one if the owner agrees), and while it waits send the 300-character text in section 4 | "That line is 300 characters. Please shorten it to 280 or fewer and send it again." (the number may differ slightly; quote it) |

### Part E: deleting on My page (only what part D created)
| ID | Do this | Expect |
|---|---|---|
| U65 + U72 | On Week so far, tap the 🗑 next to the line `UAT test line, please ignore` | A page: "Delete this line? It will be gone for good. Your log stays." with **Cancel** (an outlined button) and **Delete** (red) |
| U66 | Tap **Cancel** | Back on Week so far; the line is still there |
| U67 | Tap 🗑 on the same line again, then **Delete** | Back on Week so far; the line is gone; the log is still listed and still counted |
| U76 | ASK THE OWNER: "Shall I delete the test photo?" If yes, tap the photo's 🗑, then **Delete** | "Delete this photo? It will be gone for good. Your log stays."; then the photo is gone, the log stays |

### Part F: the Demo (only if section 1 says the Vercel setting is done; otherwise BLOCKED)
While a demo runs, the owner's real reminders are paused; `/demo stop` deletes the demo and switches back.
| ID | Do this | Expect |
|---|---|---|
| U99 | Send `/demo` | A fresh sign-up starts (the agreement shown, no invite code asked); the Menu gains `/next` and `/demo_stop` |
| U100 | Finish the sign-up (pick any habits; ASK THE OWNER at the photo consent), then send `/next` several times | Each chosen habit's reminder once, in the order picked; then the Wrap Up summary; then the 1 to 5 question; then "That's the whole week. Type /demo stop to finish." |
| U101 | During the demo: tap ✅ Done on one reminder, Undo on its receipt, 😴 Not today on another, and tap a number on the 1 to 5 question | Each answer works as it does for a real parent (receipt, "Undo", the note below, "Answered: …") |
| U102 | During the demo, send `/mypage` and open it | My page shows the **demo** parent's week, not the owner's |
| U103 | Send `/demo stop` | Back to the owner's account; the Menu loses /next; then `/mypage` shows the owner's own week again |

### Part G: Sunday and Monday (not tonight)
U79 to U83 need the real Wrap Up on **Sunday 29 Nov** and Monday 30 Nov. **NOT RUN tonight.**

---

## 4. The 300-character text for U78
Copy exactly (300 characters):

`This is a deliberately long test line for the Family Habit App user acceptance test U78. It checks that the bot refuses a line that is longer than two hundred and eighty characters and asks the parent to shorten it. Please ignore this message, it is only a test and should never be saved anywhere....`

## 5. Results table (fill in, then give it to the owner)
At the end, tidy up with the owner: check section 2 (put values back; make sure reminders are **not paused**), then show this table in the chat **as one block** so the owner can copy it.

| ID | Result | What I saw (quote) | Screenshot | Time (SGT) |
|---|---|---|---|---|
| U84 | | | | |
| U85 | | | | |
| U86 | | | | |
| U87 | | | | |
| U88 | | | | |
| U98 | | | | |
| U89 | | | | |
| U90 | | | | |
| U91 | | | | |
| U53 | | | | |
| U92 | | | | |
| U93 | | | | |
| U94 | | | | |
| U96 | | | | |
| U95 | | | | |
| U97 | NOT RUN | needs a test account | | |
| U63 | | | | |
| U64 | | | | |
| U71 | | | | |
| U68 | | | | |
| U69 | | | | |
| U70 | NOT RUN | phone dark mode, owner checks | | |
| U45 | | | | |
| U73 | | | | |
| U74 | | | | |
| U75 | | | | |
| U77 | | | | |
| U78 | | | | |
| U65 | | | | |
| U72 | | | | |
| U66 | | | | |
| U67 | | | | |
| U76 | | | | |
| U99 | | | | |
| U100 | | | | |
| U101 | | | | |
| U102 | | | | |
| U103 | | | | |

Also list, under the table: anything surprising, anything you couldn't put back, and the final state of Pause reminders and Reminder times.
