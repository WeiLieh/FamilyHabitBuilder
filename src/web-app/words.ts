// =============================================================================
// src/web-app/words.ts: every word the Web app's sign-in pages show
//
// What it does: [2026-11-15] keeps the pages' words in one place, so the
// owner can change them without touching the logic. Words marked "draft" are
// Claude Code's placeholders until the owner's wording arrives from Claude
// Chat; the expired-link sentence is fixed by rule 9.3.
// The pages are plain and unstyled on purpose: the look comes only from the
// owner (CLAUDE.md rule 6), and My page's real layout comes later.
// =============================================================================

export const WEB_WORDS = {
  pageTitle: "My page", // draft
  openIntro: "Tap the button to open your page.", // draft
  openButton: "Open my page", // draft
  noScript: "Please turn on JavaScript to open your page.", // draft
  expired: "This link has expired. Tap My page in Telegram for a new one.", // fixed, rule 9.3
  notSignedIn: "You're not signed in. Tap My page in Telegram to open your page.", // draft
  hello: (firstName: string) => `Hi ${firstName}`, // rule 9.4 header
  comingSoon: "You're signed in. Your page is being built.", // draft, until Week so far is built
  signOutButton: "Sign out", // draft
  signedOut: "You're signed out.", // draft
  didntWork: "Sorry, that didn't work. Please try again.", // draft, rule 1.3
  notFound: "This page doesn't exist.", // draft
} as const;
