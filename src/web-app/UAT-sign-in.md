# UAT: Web app sign-in (foundations, pull requests #51 and 2)

[2026-11-15 16:42 SGT] The owner's checklist for going live with My page sign-in (rules 9.3, 9.8). Tick each box; write results below with the date. Never paste a key or secret into a chat: they go only into Vercel's settings.

## Go-live steps (owner, in this order)
- [ ] **G1.** Supabase > SQL Editor > a fresh tab: paste `src/datastore/supabase/migrations/011_web_app_access.sql` and Run, once. Then run this check: `select count(*) from pg_proc where proname in ('create_sign_in_link', 'redeem_sign_in_link', 'sign_in_parent', 'end_sign_in', 'web_week', 'web_older_weeks', 'web_connection_history');` It should say **7**.
- [ ] **G2.** Supabase > Project Settings > API Keys: copy the **anon** (public) key. In Vercel > the project > Settings > Environment Variables, add it as `SUPABASE_ANON_KEY` (Production).
- [ ] **G3.** Supabase > Project Settings > JWT Keys: check that the **legacy JWT secret** is shown and is still accepted (if the page says the project now uses new "JWT signing keys" and the legacy secret is revoked or not accepted, stop and tell Claude Code: the pass would be refused). Copy it into Vercel as `SUPABASE_JWT_SECRET` (Production only). This secret is as powerful as the master key: it lives only in Vercel.
- [ ] **G3b.** [2026-11-15 16:45 SGT] (privacy review) Supabase > Authentication > Sign In / Providers: check that **new users can't sign up** through Supabase's own sign-in (we don't use it; an outsider could otherwise get a signed-in pass, though it opens no family's rows). Supabase > Storage: check no bucket lets "authenticated" users read files (photos are not stored yet).
- [ ] **G4.** Merge pull request 2; Vercel shows the deployment "Ready".

## Test cases
| ID | Do this | Expect | Where to look | Result |
|---|---|---|---|---|
| U56 | Send `/mypage` | "Here's your page." with an **Open my page ↗** button | Telegram | [ ] |
| U57 | Tap the button | A plain page: "Tap the button to open your page." and one **Open my page** button; **no name** shown | Phone browser | [ ] |
| U58 | Press **Open my page** | "Hi [your first name]" and "You're signed in. Your page is being built.", with **Sign out** | Phone browser | [ ] |
| U59 | Go back to Telegram and tap the **same** button again, then press Open my page | "This link has expired. Tap My page in Telegram for a new one." | Phone browser | [ ] |
| U60 | Send `/mypage`, wait **6 minutes**, then tap and press | The same "This link has expired…" sentence | Phone browser | [ ] |
| U61 | On the signed-in page, press **Sign out** | "You're signed out." Then send `/mypage` again: it signs in again | Phone browser | [ ] |
| U62 | Supabase > Table Editor > `web_sign_in_links` | Only long codes of 64 letters and digits (fingerprints), never the link | Supabase | [ ] |

Not possible here: checking another parent's rows can't be seen (covered by database tests T105 to T107).
