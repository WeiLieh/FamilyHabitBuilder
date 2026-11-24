# Learning Log (study notebook)

[2026-11-12 23:24 SGT] Older replaced (superseded) lines were moved word for word to [docs/archive/LEARNING-LOG-superseded.md](archive/LEARNING-LOG-superseded.md) to keep this file short (owner approved).

[2026-11-15 21:57 SGT] The 13 oldest notebook entries (24 to 31 Oct: from "Project memory files" to "A/B testing") were moved word for word to [docs/archive/LEARNING-LOG-notebook-to-2026-10-31.md](archive/LEARNING-LOG-notebook-to-2026-10-31.md) (owner approved, 15 Nov).

## Notebook

### [2026-11-24 23:56 SGT] A demo mode with a stand-in account
- **Concept:** a demo mode: a switch that lets the owner use the real app as a separate, throwaway user, then delete everything that user did.
- **In plain English:** `/demo` creates a fresh "demo parent". While it's on, the bot treats the owner's messages as coming from that demo parent (known by the owner's Telegram number made negative), so the real sign-up, reminders and replies run unchanged, and every reply still lands in the owner's own chat. `/demo stop` deletes the demo parent and all it saved.
- **Analogy:** a rehearsal on the real stage with the real set and script, where the stage manager calls each scene (`/next`) and the props are cleared away afterwards.
- **Why and when to use it:** to show real behaviour to an audience without faking screens or mixing demo data into real data and metrics. Not a replacement for tests, and never for real families.
- **Best practices:** only an allow-list of owners can start it; mark demo data and keep it out of Telemetry; delete it completely, photo files first; never let a failed check guess which account a message belongs to.
- **Where it showed up in this project:** the Demo module (#63, rules 12.1 to 12.7, migration 015).
- **Explain it to others:** "I can demo the real app live: a throwaway user, the real flows step by step, and one command wipes it afterwards, without touching real data or metrics."
- **Governance angle:** a reviewer asks who can switch it on (only the owner's account), whether demo data can reach reports (no), and whether it is fully deleted (yes, files first).

### [2026-11-24 23:10 SGT] A guest list by fingerprint (Content Security Policy)
- **Concept:** Content Security Policy (CSP): a header the server sends with each page, telling the browser what the page may load or run.
- **In plain English:** our pages tell the browser "run only this one script and use only this one stylesheet", naming each by its fingerprint (a hash). Anything slipped into the page, even one hidden style, doesn't match a fingerprint, so the browser refuses it.
- **Analogy:** a door guest list with photos: only the people whose faces match get in, whatever name they give.
- **Why and when to use it:** for any page showing personal data, so a mistake that lets text into the page can't become running code. Not worth the effort for a throwaway page with no data.
- **Best practices:** start from "nothing allowed" and add exact items; prefer fingerprints over "allow anything inline"; keep all styling in one place so the fingerprint stays simple.
- **Where it showed up in this project:** My page's look (#57, option A): one hand-written stylesheet named by its fingerprint; photos may load only from our own Supabase project (#58).
- **Explain it to others:** "Our pages carry a guest list. The browser loads only the exact script and stylesheet we name by fingerprint, so injected code is refused."
- **Governance angle:** a reviewer asks "is there any `unsafe-inline`?" Here: no.

### [2026-11-24 23:10 SGT] Short-lived links for private photos
- **Concept:** a signed link (a "signed URL"): a web address to a private file that carries a secret token and stops working after a set time.
- **In plain English:** children's photos sit in a private store nobody can browse. When My page shows one, our server asks for a link that works for 5 minutes; after that the link is useless, even if someone copied it.
- **Analogy:** a cinema ticket for one showing: it gets you in tonight, not next week.
- **Why and when to use it:** for any private file a person should see but not share widely. Not for public files (logos, pictures everyone sees), where a plain address is fine.
- **Best practices:** keep the store private; make links short-lived; tell browsers not to keep copies; never log the link.
- **Where it showed up in this project:** photos on My page (#58): a private Supabase bucket, one folder per parent, 5-minute links (value 53), and locks so a parent's pass reaches only its own folder.
- **Explain it to others:** "Photos are never public. Each time a parent views one, they get a five-minute ticket to it, and only for their own folder."
- **Governance angle:** a PDPA reviewer asks where photos are kept, who can reach them and for how long a link works: Singapore, only that parent, 5 minutes.

### [2026-11-15 22:36 SGT] A page that works with no script (and a confirm page instead of a pop-up)
- **Concept:** building with plain HTML elements (links, forms, buttons, `<meter>`), so the page works without any script, and asking "Are you sure?" on its own page.
- **In plain English:** every action on My page is a link or a form. A dustbin is a link to an "Are you sure?" page; only its Delete button changes anything. The browser does the work, so there is less code to go wrong, and the look can be added later without touching the logic.
- **Analogy:** a paper form with a "tick to confirm" box, instead of a clerk who has to remember to ask.
- **Why and when to use it:** for simple pages and anything that deletes. Not for pages that must update live without reloading (those need a script).
- **Best practices:** a link never changes anything (only a form's button does); every typed text is made safe before it reaches the page; test the words and the order, not the styling.
- **Where it showed up in this project:** Week so far (#55); wireframe A chosen by the owner.
- **Explain it to others:** "My page is plain HTML: links show, buttons change. Deleting always goes through an 'Are you sure?' page, so a stray tap never deletes anything."

### [2026-11-15 17:00 SGT] Keeping only a fingerprint of a secret (hashing)
- **Concept:** hashing, here with SHA-256 (Secure Hash Algorithm, 256 bits): turning a secret into a "fingerprint" that can't be turned back.
- **In plain English:** the database never keeps the sign-in link or the cookie, only a scrambled fingerprint of each. When the browser hands in the secret, the database scrambles it the same way and compares fingerprints.
- **Analogy:** a bank keeps a photo of your signature, not your pen: it can check a signature matches, but the photo can't sign anything.
- **Why and when to use it:** for anything that works like a password or key. Not for data you need to read back (a name, a photo).
- **Best practices:** make the database do the scrambling, so a stolen fingerprint is useless as a key (review finding, 15 Nov); use long random secrets; never log the secret.
- **Where it showed up in this project:** migration 011's sign-in tables; `src/datastore/sign-in-secrets.ts`; tests T101, T117.
- **Explain it to others:** "We don't store sign-in links, only their fingerprints. Even someone with a full copy of our database couldn't sign in as a parent."
- **Governance angle:** a security reviewer asks "if the database leaked, what could an attacker do?" Here: nothing with the sign-in tables.

### [2026-11-15 17:00 SGT] A signed pass for each request (JSON Web Token, JWT)
- **Concept:** JSON Web Token (JWT): a small note ("this request is for parent 7 until 8:10 pm") plus a signature only our server can make.
- **In plain English:** after sign-in, our server writes a 10-minute pass for one parent and signs it with a secret. Supabase checks the signature, and the database's Row Level Security uses the parent's number on the pass to show only that family's rows.
- **Analogy:** a hotel key card programmed at the front desk for one room and a short time.
- **Why and when to use it:** when one server serves many people and the database must enforce "only your own rows". Not needed when only a trusted server talks to the database (the Telegram bot).
- **Best practices:** keep passes short-lived; keep the signing secret only in the hosting settings (Vercel), never in code; never send the pass to the browser.
- **Where it showed up in this project:** `src/web-app/pass.ts`; option A in `docs/CONTEXT.md`; tests P1, P2, T105 to T107.
- **Explain it to others:** "Each page request carries a 10-minute key for one family, and the database itself refuses anything outside that family."
- **Governance angle:** a Change Advisory Board (CAB) would ask who can see the signing secret: it is as powerful as the master key.

### [2026-11-15 17:00 SGT] Forged forms from another website (cross-site request forgery, CSRF)
- **Concept:** Cross-Site Request Forgery (CSRF): another website secretly making your browser send a form to our site.
- **In plain English:** a bad page could quietly "press" our sign-in button with its own link, signing a parent into a stranger's account. Browsers now say where a form came from, so our server refuses forms from other sites.
- **Analogy:** a letter posted through your door that looks like it came from you; the post office checks the return address.
- **Why and when to use it:** on every button that changes something (sign in, sign out, delete). Not needed for pages that only show things.
- **Best practices:** check the browser's "where from" headers (Sec-Fetch-Site, Origin); set cookies to SameSite; test it (W11).
- **Where it showed up in this project:** the privacy review of #52 found it; fixed in `src/web-app/handler.ts`.
- **Explain it to others:** "Only our own pages can press our buttons; a form from anywhere else is refused."

### [2026-11-15 11:41 SGT] Data minimisation: give each page only what it shows
- **Concept:** data minimisation, a principle of Singapore's Personal Data Protection Act (PDPA).
- **In plain English:** each question the Web app may ask the database returns only what that page shows, never "everything just in case". There is also a list of things no page ever gets.
- **Analogy:** a librarian who brings you the one page you asked for, not the whole shelf.
- **Why and when to use it:** always with personal data, above all children's names and photos. It also makes pages lighter and faster. Not a reason to hide what a parent needs to see.
- **Best practices:** start from the screen and work backwards to the data; write a "never returned" list; send short snippets in summaries and load full text only when it's opened.
- **Where it showed up in this project:** the three Web app reads (one week, older weeks as summaries with 40-character snippets, up to 5 ratings), approved item by item on 15 Nov.
- **Explain it to others:** "Each page gets exactly what it displays and nothing more; we even wrote down what it must never receive."
- **Governance angle:** a PDPA reviewer asks "why do you need this field?" for every item; the "never returned" list answers before they ask.

### [2026-11-15 11:41 SGT] Row Level Security (RLS): the database checks every row itself
- **Concept:** Row Level Security (RLS), the database's own rule about which rows a pass may see or change.
- **In plain English:** after sign-in, the Web app gets a short-lived pass for one parent. The database itself refuses any row that isn't that parent's, even if our code asks for the wrong one.
- **Analogy:** each flat's key card opens only that flat; even if the receptionist hands over the wrong card, the door still checks.
- **Why and when to use it:** whenever people's own data is shown in a browser, and a mix-up would be serious (children's photos). For a server-only job like the Telegram bot, a well-guarded master key can be enough.
- **Best practices:** never put the master key in the Web app; keep passes short-lived; test "parent A can't see parent B" directly; index tables by parent so the check stays fast.
- **Where it showed up in this project:** rule 9.8 (owner: "let's default to security", 15 Nov).
- **Explain it to others:** "Two locks instead of one: our code asks only for your rows, and the database refuses anyone else's anyway."
- **Governance angle:** a security reviewer or Change Advisory Board (CAB) asks "what stops parent A seeing parent B's photos if the code has a bug?" The answer is: the database.

### [2026-11-15 11:41 SGT] Making typed text safe before formatting it (escaping)
- **Concept:** escaping: turning special characters into their written-out forms, so text is shown, never obeyed.
- **In plain English:** to show **bold**, the bot sends messages in Telegram's formatting mode, where "<" and "&" have special meanings. Any name a parent typed goes through a small function first, so "Tom & <Jerry>" shows exactly as typed and can't add formatting or break the message.
- **Analogy:** putting someone's words in quotation marks, so they're read out rather than followed as instructions.
- **Why and when to use it:** whenever text from a person or a database goes into anything that has its own formatting rules (messages, web pages, database queries).
- **Best practices:** escape at the moment text is put into the message; keep button labels plain; test with a name full of symbols.
- **Where it showed up in this project:** house style C (#50): `esc()` in `src/telegram-bot/words.ts`, tests F2 and F2b.
- **Explain it to others:** "We turned on bold text, and made sure a parent's typed name can never sneak formatting or links into a message."
- **Governance angle:** a security reviewer checks every path from user input to output; here the privacy reviewer traced each one.

### [2026-11-14 21:40 SGT] Two kinds of Telegram buttons: under a message, or in place of the keyboard
- **Concept:** inline buttons versus a reply keyboard (Telegram's two ways to offer buttons).
- **In plain English:** inline buttons sit under one message and send the bot a hidden code when tapped (✅ Done, Undo). A reply keyboard replaces the phone's keyboard with big buttons that stay there; a tap simply sends the button's words as if typed ("✅ Showing affection"), and the bot matches them exactly.
- **Analogy:** inline buttons are tick-boxes on one form; the reply keyboard is a row of tally counters by the door, always there.
- **Why and when to use it:** inline buttons for an answer to one message; a reply keyboard for something done often, any time (logging). Not a reply keyboard for yes/no questions: the old answer can't be taken back off the screen.
- **Best practices:** keep the labels short and unique; match them exactly, never guess; send the keyboard again when the choices change (here: "You're all set" and /help).
- **Where it showed up in this project:** B1: the keyboard logs a behaviour; Undo, /log's choices and ✅ Resume are inline buttons.
- **Explain it to others:** "Reminders have buttons under them; logging any time uses a keyboard that's always there, one button per habit."

### [2026-11-14 21:40 SGT] Changing a secret that was shown ("rotating" a secret)
- **Concept:** rotating a secret: replacing a password or key with a new one, so the old one stops working.
- **In plain English:** the alarm's secret showed in a screenshot. Instead of hoping nobody saw it, we made a new one, put it in Vercel and Supabase, and redeployed. The old one is now useless.
- **Analogy:** changing the lock after a key was copied, rather than asking who might have the copy.
- **Why and when to use it:** whenever a secret may have been seen (a screenshot, a chat, a log, Git). Not needed for codes that are already used up (an old invite code).
- **Best practices:** letters and numbers only, about 40 long; change it in every place that holds it; redeploy so the app reads the new one; check it works (here: U29, every run answered 200).
- **Where it showed up in this project:** session 17, step G4 of the planner's go-live.
- **Explain it to others:** "A secret leaked into a screenshot, so we rotated it within minutes; the old one opens nothing now."
- **Governance angle:** a security reviewer asks how fast a leaked secret is replaced and whether it is ever written to Git or chat; here: minutes, and never.

### [2026-11-14 10:37 SGT] A pull request built on top of another (a "stacked" pull request)
- **Concept:** a stacked pull request: a branch that starts from another branch still waiting for review, instead of from `main`.
- **In plain English:** pull request #45 holds the newest notes and specs but isn't merged yet (it waits for U15 and U16). Today's notes build on those, so today's branch starts from #45's branch. Its pull request is pointed at #45's branch, so it shows only today's changes; once #45 is merged, it is pointed at `main`.
- **Analogy:** writing chapter 6 while your editor still has chapter 5: you write from your copy of chapter 5, and they read chapter 6 as "what changed since chapter 5".
- **Why and when to use it:** when new work depends on work that is waiting for review and you don't want to wait or redo it. Not when the two pieces are unrelated (then branch from `main`), and not in long chains (each link waits on the one before).
- **Best practices:** merge in order (the lower one first); keep each one small; say in the description which pull request it sits on.
- **Where it showed up in this project:** session 16's notes (UAT results, migrations 008 and 009) sit on top of #45.
- **Explain it to others:** "Our last change is still in review, so today's work is stacked on it. Reviewers see only today's changes, and we merge them in order."
- **Governance angle:** a reviewer may ask whether anything unreviewed slips into `main`: no, each pull request is still reviewed and merged on its own, in order.
- [2026-11-14 21:40 SGT] **Learned in session 17:** GitHub did **not** point #46 at `main` by itself after #45 was merged, and later work on the same branch flowed into it. Merging it would have sent everything into the old branch, not `main`. So: before merging a stacked pull request, check its base says `main`; here #46 was closed and #47 carried its notes.

### [2026-11-14 00:17 SGT] Take a ticket before you act ("claim, then send")
- **Concept:** Claiming work in one step (a database "claim": mark and return in a single statement, with the rows locked).
- **In plain English:** When an alarm runs every 10 minutes, two runs can overlap. If each one first asks "who needs a reminder?" and only later marks them, both can send the same reminder. Instead, the database marks the people as "reminded" and hands them over in the same step, so only one run can ever take each person.
- **Analogy:** A deli counter's ticket machine: once you pull number 42, nobody else can get 42, even if two people reach for the machine at once.
- **Why and when to use it:** for anything that must happen at most once (a reminder, a payment, a nudge per slot) when more than one worker can run at the same time. Not needed when only one worker ever runs, or when doing it twice is harmless.
- **Best practices:** mark and return in one statement; decide what a failure after claiming means (here: logged, not retried, because one reminder is the promise); keep a database rule as a second lock (one nudge per slot, rule 8.6).
- **Where it showed up in this project:** migration 009's `claim_sign_up_reminders` (pull request 3a) and the one-nudge-per-slot rule that lets the 10-minute alarm run safely (pull request 3c).
- **Explain it to others:** "Our alarm runs every 10 minutes and runs can overlap, so the database hands out reminders like tickets from a deli machine: each person can only be taken once, so nobody ever gets the same reminder twice."
- **Governance angle:** a reviewer may ask "what stops a double send?" Answer: the claim is one locked statement, and the database refuses a second nudge per slot.

### [2026-11-12 23:20 SGT] A bookmark for a multi-step form (a "state machine")
- **Concept:** a state machine: a program that is always on exactly one step, and only certain actions move it to the next.
- **In plain English:** each person's sign-up draft remembers the one screen they are on (its "step"). A button only works on the screen it belongs to, and each answer moves the bookmark on. That is why someone can stop and carry on days later, and why tapping an old button higher up the chat does nothing.
- **Analogy:** a paper form handed over page by page at a counter: the clerk only accepts the page you're on, and keeps your place if you step out.
- **Why and when to use it:** whenever a conversation has a fixed order (sign-up, checkout, a questionnaire) and people can wander off or tap old buttons. Not worth it for a single question and answer.
- **Best practices:** save the step together with the answer; check the step before acting on any button; show the current screen again when someone returns ("Welcome back!"); keep the list of steps in one place.
- **Where it showed up in this project:** `src/telegram-bot/onboarding.ts` (pull request #40): steps name, children, quick, deliberate, school_times, weekend_times, plan, agreement; test 19 checks that old buttons save nothing.
- **Explain it to others:** "The bot keeps a bookmark for each person signing up. Every answer moves the bookmark on, and buttons only work on the page they belong to, so people can stop and come back, and stray taps can't scramble anything."
- **Governance angle:** a reviewer may ask whether the order is also enforced by the database (here only by the code; known issue K5).

### [2026-11-12 22:34 SGT] A sign-up draft: holding answers until consent
- **Concept:** a **draft** (also called a staging area): a temporary place that holds what someone has typed until they confirm, before anything goes into the real records.
- **In plain English:** while a parent signs up, their name, children and picks wait in one draft row. Only when they tap "I agree" are they turned into the real records, all in one step. If they never agree, the draft is cut down after 7 days and deleted after 90.
- **Analogy:** a shop holds your order at the counter until you pay, instead of shipping it and asking for it back if you don't.
- **Why and when to use it:** when people give personal data in several steps before they consent, or when a half-finished process must not leave half-made records. Not needed when everything is saved in one step at the moment of consent.
- **Best practices:** keep the draft small (only the expected fields, a size cap); turn it into real records in one all-or-nothing step; set a clear time limit and a clean-up; tell people up front how long it's kept.
- **Where it showed up in this project:** migration 007 (12 Nov): `sign_up_drafts`, `finish_sign_up`, `clean_up_sign_ups`, `delete_sign_up_draft`; the 7-day line at `/start` (review finding P1).
- **Explain it to others:** "Answers during sign-up sit in a holding area. Nothing reaches the real tables until the parent agrees, and the holding area clears itself after a week."
- **Governance angle:** a PDPA reviewer will ask whether collecting before consent is allowed, how long it is kept, and whether "delete my data" reaches it (it does: `delete_sign_up_draft`).

### [2026-11-12 20:55 SGT] A partial failure: saved, but not shown
- **Concept:** a **partial failure**: one action that is really two jobs (save the answer, then update the screen), where the first succeeds and the second fails.
- **In plain English:** when you tap ✅ Done, the bot saves your answer in the database, then asks Telegram to remove the buttons and show the receipt. If Telegram hiccups after the save, the answer still counts. The bot must say what actually happened, so it never says "didn't save" after a save.
- **Analogy:** a courier leaves your parcel at the door, then their phone fails to send the "delivered" text. Telling you "we couldn't deliver" would make you order again and pay twice.
- **Why and when to use it:** whenever one tap triggers several steps, decide what the person is told if each step fails. Not needed when there is only one step.
- **Best practices:** do the important step (saving) first; report each step's failure honestly, never a blanket "it failed"; write the failure to the log (rule 1.3); test the in-between case on purpose.
- **Where it showed up in this project:** rule 5.10 (12 Nov): Done and Not today now take two Telegram steps (remove the buttons, send a new message). Two new tests check that a failure in the first step still sends the reply and never says "didn't save".
- **Explain it to others:** "A button tap does two things: save, then show. We test the case where saving worked but showing failed, so the app never tells a parent something untrue."

### [2026-11-11 21:59 SGT] A thin slice, with a webhook and a cron job
- **Concept:** a **thin slice** (the smallest piece of the real product that works end to end), reached by Telegram through a **webhook** (a web address Telegram calls whenever something happens) protected by a **shared secret**, and woken daily by a **cron job** (a scheduled alarm, here Vercel's).
- **In plain English:** instead of building each part fully, we built a tiny version of every part at once: sign-up, one nudge, one button, one receipt, on the real Telegram, Vercel and Supabase. Telegram sends each message to our address with a password only it knows; Vercel's alarm wakes the bot at 7 pm with its own password.
- **Analogy:** opening one route of a new train line, with real track, signals and stations, before building the whole network. And a doorbell that only rings if the visitor says the codeword.
- **Why and when to use it:** early, to find the problems that only appear when real systems meet (wrong settings, typos, slow starts). Not a replacement for the full design: the thin slice leaves out most features on purpose.
- **Best practices:** write the setup and checks (UAT) before setting up; keep secrets only in the hosting settings; check each step's result straight away (e.g. getWebhookInfo after setWebhook); when nothing happens, check whether the request arrived at all before suspecting the code.
- **Where it showed up in this project:** thin slice 1 (11 Nov): tests passed first time, but three setup slips (a migration not applied, a symbol in the secret, `/ape/` instead of `/api/`) were only found live, each traced in one or two rounds and turned into a checklist line.
- **Explain it to others:** "We got one complete path working on the real systems before building more. The automated tests proved the logic; the live run found the setup mistakes the tests can't see, and each one became a line on our checklist."
- **Governance angle:** a reviewer will ask who can call the bot's address (only Telegram, by secret), who can trigger the daily job (only Vercel, by secret), where the secrets live (Vercel, never in code or chat) and whether real users are involved (no: owner only until consent and deletion are built).

### [2026-11-09 21:57 SGT] Changing a live database safely: migration, transaction, check query, fingerprint
- **Concept:** a database **migration** (a numbered change script), run inside a **transaction** (all or nothing), confirmed with a **check query**, then sealed with a **fingerprint** (a short code computed from the file).
- **In plain English:** once a database is live, you never edit the old change scripts. You add a new one (004) that makes the change. It runs as one block, so if any step fails nothing changes. Afterwards a small read-only query proves the result, and the file's fingerprint is recorded so any later edit to it is caught.
- **Analogy:** a signed contract is changed by an addendum, not by crossing out lines. The addendum is signed in one sitting (all or nothing), a witness checks it, and a notary's seal shows if anyone tampers with it later.
- **Why and when to use it:** for every change to a live database's structure (tables, columns, permissions, functions). Not for everyday data, which the app adds itself, or for one-off content fixes (those are content scripts, rule B2).
- **Best practices:** write the database test first and watch it fail for the right reason; repeat the lock-down of permissions for anything new; test the check query on a local copy before the owner runs it; record the fingerprint only after the owner confirms.
- **Where it showed up in this project:** migration 004 (9 Nov) removed the Wrap Up's own on/off switch. Test T42 was written first; the owner ran it in Supabase, the check query matched every expected value, and fingerprint `a4f1cede096b` was recorded (rule B1).
- **Explain it to others:** "We never rewrite history in our database scripts. Each change is a new numbered script that either fully works or changes nothing, we prove the result with a check, and the drift test raises the alarm if anyone edits a script after it has run."
- **Governance angle:** a Change Advisory Board (CAB) will ask: is it reversible, was it tested, who ran it, how was success confirmed, and can it be tampered with afterwards? Here: tested locally first, all or nothing, owner-run, check query recorded, fingerprint in the spec.

### [2026-11-09 00:14 SGT] Metrics that don't double count (mutually exclusive definitions)
- **Concept:** mutually exclusive metric definitions: each event counts toward exactly one of two related metrics.
- **In plain English:** metric 7 asks "did parents do it without a reminder?" and metric 8 asks "did the reminder work?". Before, a log at 2 pm after a 7 am nudge counted as both, so the two numbers contradicted each other. Now one test decides: was that behaviour nudged earlier the same day? Yes, so it is the nudge's success (metric 8). No, so it is unprompted (metric 7).
- **Analogy:** a goal in football is credited to the scorer or to an own goal, never to both. A sale is credited to the ad or to word of mouth, not both.
- **Why and when to use it:** whenever two metrics are meant to explain the same outcome from opposite sides. When not: metrics that measure different things (for example stickiness and connection rating) can and should overlap.
- **Best practices:** define both metrics with the same rule, written once (rule 5.2); test the edge cases (midnight, a different behaviour, Not today); record the change in the spreadsheet's change notes, keep the old version deprecated, never deleted.
- **Where it showed up in this project:** rule 5.2 and metric 8, 9 Nov, after the persistent keyboard made "late answers" to a nudge common.
- **Explain it to others:** "We made sure each logged action counts once: either the reminder gets the credit, or the parent does. Otherwise our 'habit is forming' number and our 'reminders work' number could both look good for the same action."
- **Governance angle:** a reviewer will ask whether a metric definition changed during the trial, and which version a report used. Hence version 2 of the spreadsheet with dated change notes, and version 1 kept in the archive.

### [2026-11-01 16:07 SGT] Designing database tables: add-only diaries, Control and Test, settings versions
- **Concept:** Database **schema design** (deciding the tables, their columns and the rules the database itself enforces), with **add-only** (append-only) tables, **Control and Test** groups, and **settings versions**.
- **In plain English:** Each table holds one kind of thing, one row per item. Diaries such as logs and events are only ever added to, never changed, so history can be trusted. The everyday values (Control, Option A) are saved as numbered versions; an experiment gives some parents a Test option (B) on top, and every event is stamped with both, so results can be split later.
- **Analogy:** A bank statement: transactions are only ever added, a mistake is fixed with a new correcting line, and each line says which account rules applied at the time.
- **Why and when to use it:** When you will need to analyse or audit history later, or when several things can happen at once (Telegram resends, two scheduler runs). Not for things a person simply changes, like their own nudge times: those are edited, with an event recording the change.
- **Best practices:** Let the database enforce structure (links, no duplicates, required fields), keep tuneable numbers in code; give each table only the permissions it needs; make "delete my data" follow the parent automatically; write each multi-step action as one all-or-nothing step.
- **Where it showed up in this project:** The Datastore design (1 Nov): 14 tables now, rules 8.3 to 8.12, after three drafts and a schema review.
- **Explain it to others:** "Our database keeps diaries that are only ever added to, so we can trust the history. Every event is stamped with the settings version and the experiment group the parent was in, so we can compare Control and Test fairly. The database itself blocks duplicates and wrong links, and deleting a parent removes everything about them in one go."
- **Governance angle:** A reviewer would ask who can change or delete data (only three narrow edits and one deletion function, enforced by database permissions and tested), what personal data is held (no child names; an optional birth year), and whether deletion is complete (a test fails if any personal table isn't covered).

## Still unclear
- [2026-11-12 20:55 SGT] CONFIRMED: owner understands tests 3 and 4; moved to the Notebook ("A partial failure: saved, but not shown").
- [2026-11-12 20:51 SGT] **Tests 3 and 4 for rule 5.10 (a Telegram hiccup after saving):** when you tap a button, the bot does two separate jobs: it saves your answer in the database, then tells Telegram what to show. If the second job fails, the first has still happened, so the bot must not say "didn't save". Explained again with the parcel-delivery analogy. Waiting for the owner to confirm it is clear.
- [2026-10-25 07:34 SGT] **Two tables linked by name (nudges and examples):** proposed design where `nudges` holds each nudge's settings once (with an ID number used by parents' choices) and `examples` holds one row per example, naming its nudge. Explained with a mock-up and the contacts-list / message-log analogy. Waiting for the owner to confirm it is clear. CONFIRMED [2026-10-25 07:42 SGT]: moved to the Notebook.
