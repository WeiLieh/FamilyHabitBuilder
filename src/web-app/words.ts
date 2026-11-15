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
  signOutButton: "Sign out", // draft
  signedOut: "You're signed out.", // draft
  // [2026-11-15] Week so far (rules 9.2, 9.4 to 9.7). Drafts until the owner's wording.
  weekWith: (dates: string, children: string) => (children ? `${dates} with ${children}` : dates), // rule 9.4 header
  daysLogged: (n: number) => `${n} ${n === 1 ? "day" : "days"} logged this week`, // rule 9.4
  reflectionsThisWeek: (n: number) => `${n} ${n === 1 ? "reflection" : "reflections"} this week`, // rule 9.4
  momentTitle: "This week's moment", // draft
  photoLater: "(a photo: shown once photos are built)", // draft, photos come with the Photo check
  connectionQuestion: "How connected did you feel with your child?", // fixed, rules 5.6, 9.5
  firstAnswer: "Your first answer arrives on Sunday.", // fixed, rule 9.5
  thisWeek: "This week", // fixed, rule 9.5
  noRating: "–", // fixed, rule 9.5
  olderWeeksTitle: "Older weeks", // draft
  showOlder: (n: number, perPage: number, back: string, range: string) =>
    n === perPage ? `Show ${n} older weeks - back to ${back}` : n === 1 ? `Show 1 more week - ${range}` : `Show ${n} more weeks - back to ${back}`, // rule 9.7
  momentTile: "Moment", // draft
  photoTile: "(photo)", // draft
  tabs: { week: "Week so far", habits: "Habits so far", rewards: "Rewards", settings: "Settings" }, // rule 9.2
  habitsComingSoon: "Habits so far is coming soon.", // draft
  settingsComingSoon: "Settings are coming soon.", // draft
  dustbin: "🗑", // draft; rule 9.6
  confirmLine: "Delete this line? It will be gone for good. Your log stays.", // rule 9.6
  confirmReflection: "Delete this reflection? It will be gone for good.", // draft, rule 9.6
  confirmMomentLine: "Delete this moment's line? It will be gone for good.", // draft, rule 9.6
  cancel: "Cancel", // owner, 15 Nov (wireframe A)
  delete: "Delete", // owner, 15 Nov (wireframe A)
  badRequest: "That request isn't one this page understands.", // draft
  didntWork: "Sorry, that didn't work. Please try again.", // draft, rule 1.3
  notFound: "This page doesn't exist.", // draft
} as const;
