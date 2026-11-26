// =============================================================================
// src/web-app/words.ts: every word the Web app's sign-in pages show
//
// What it does: [2026-11-15] keeps the pages' words in one place, so the
// owner can change them without touching the logic. Words marked "draft" are
// Claude Code's placeholders until the owner's wording arrives from Claude
// Chat; the expired-link sentence is fixed by rule 9.3.
// The look comes only from the owner (CLAUDE.md rule 6): [2026-11-24] My
// page's pages now carry it (style.ts); the sign-in pages are still plain.
// =============================================================================

export const WEB_WORDS = {
  pageTitle: "My page", // draft
  openIntro: "Tap the button to open your page.", // draft
  openButton: "Open my page", // draft
  noScript: "Please turn on JavaScript to open your page.", // draft
  expired: "This link has expired. Tap My page in Telegram for a new one.", // fixed, rule 9.3
  notSignedIn: "You're not signed in. Tap My page in Telegram to open your page.", // draft
  hello: (firstName: string) => `Hi ${firstName}`, // rule 9.4 header
  signedOut: "You're signed out.", // draft
  // [2026-11-15] Week so far (rules 9.2, 9.4 to 9.7). Drafts until the owner's wording.
  weekWith: (dates: string, children: string) => (children ? `${dates} with ${children}` : dates), // rule 9.4 header
  daysLogged: (n: number) => `${n} ${n === 1 ? "day" : "days"} logged this week`, // rule 9.4
  reflectionsThisWeek: (n: number) => `${n} ${n === 1 ? "reflection" : "reflections"} this week`, // rule 9.4
  momentTitle: "This week's moment", // draft
  photoAlt: "Your photo", // [2026-11-24] draft: what a screen reader says for a photo
  photoNotLoaded: "This photo couldn't be loaded. Please try again.", // [2026-11-24] draft, rule 1.3: a failed link is shown as a failure
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
  // [2026-11-25] Settings (rule 9.9). Words from the owner's wireframe of 15 Nov
  // unless marked "draft"; its [bracketed] wording is still a placeholder.
  settings: {
    aboutYou: "About you",
    yourName: "Your name",
    children: "Children",
    noneYet: "None yet",
    reminders: "Reminders",
    behaviours: "Behaviours",
    behavioursValue: (quick: number, deliberate: number) => `${quick} quick${deliberate > 0 ? ", 1 deliberate" : ""}`,
    times: "Reminder times",
    timesValue: (school: number, weekend: number) => `${school} school-day, ${weekend} weekend`,
    pause: "Pause reminders",
    on: "On",
    off: "Off",
    wrapUp: "Weekly Wrap Up",
    privacy: "Privacy",
    whatWeRecord: "What we record",
    download: "Download my memories",
    helpUs: "Help us improve",
    comingSoon: "Coming soon",
    deleteMyData: "Delete my data",
    account: "Account",
    signOut: "Sign out",
    staySignedIn: (days: number) => `You stay signed in on this phone for ${days} days.`,
    // [2026-11-26] The Saved pop-up (W1, L14): the tick is drawn beside the words.
    saved: "Saved.", // draft
    savedNotTold: "Saved, but we couldn't tell you in Telegram.", // draft, rule 1.3
    ok: "OK",
    back: "Back",
    save: "Save",
    whatShallWeCallYou: "What shall we call you?",
    yourChildren: "Your children",
    childLabel: (n: number) => `Child ${n} first name or nickname`,
    addChildLabel: "Add another child", // wireframe button, here an empty box (no page scripts)
    nicknameIsEnough: "A first name or a nickname is enough.",
    quickBehaviours: "Quick behaviours",
    chooseUpTo2: "Choose up to 2. Untick one to choose another.", // [2026-11-26] W2
    howOftenQuick: "How often (quick behaviours)", // draft
    oneDeliberate: "One deliberate behaviour",
    none: "None",
    optional: "Optional.",
    howOftenDeliberate: "How often (deliberate behaviour)", // draft
    schoolDays: "School days",
    weekends: "Weekends and holidays",
    // [2026-11-26] A 🗑's label, read aloud by screen readers (W3, W5).
    removeLabel: (what: string) => `Remove ${what}`,
    // [2026-11-26] Removing a child asks first (W4).
    removeChildQuestion: (name: string) => `Remove ${name}?`,
    removeChildNote: "Their name is deleted for good.",
    remove: "Remove",
    addTime: "Add a time",
    addTimeLabel: (schedule: string) => `A time to add to ${schedule}`, // draft, read aloud by screen readers
    timesRule: "Up to 3 times a day, at least 1 hour apart. The times are shared by all your behaviours.",
    pauseAll: "Pause all reminders",
    pauseNote: "While paused we send no reminders. Your photos, lines and weeks stay exactly as they are.",
    pauseTelegram: "You can also pause or resume from Telegram: send /pause or /resume to the bot.", // owner, 25 Nov: both ways
    wrapUpTime: "Sunday at", // draft
    wrapUpNote: "A short summary of your week, sent on Sunday when you have logged a habit, a reflection or a moment that week.", // owner, 25 Nov: matches rule 3.12
    recordText: "The habits you log, and any lines, reflections or weekly moment you add.",
    photos: "Photos",
    photosText: "Photos you send are stored so you can see them on My Page. You can delete any photo or line from Week so far.",
    agreedOn: (date: string) => `You agreed on ${date}.`,
    withdraw: "Photos are part of how this service works, so this agreement can't be switched off on its own. To withdraw it, delete your data.", // placeholder, PDPA reviewer
    terms: "Terms and Conditions",
    deleteIntro: "This removes everything we hold about you and your family in this app:",
    deleteList: [
      "Your habit logs, photos, lines, reflections and weekly moments",
      "Your weekly connection answers",
      "Your name and your children's names",
      "Your reminder and behaviour choices, and your sign-in",
    ],
    deleteAfter: "After this, the bot stops messaging you. A way to download your memories first is planned but not available yet.",
    continueToDelete: "Continue to delete",
    areYouSure: "Are you sure?",
    understood: "I understand this cannot be undone",
    yesDelete: "Yes, delete everything",
    tickTheBox: "Please tick the box first.", // draft
    deletedTitle: "Your data has been deleted",
    deletedText: "The bot will stop messaging you. Thank you for being part of this.", // draft
    signOutQuestion: "Sign out of this phone?",
    signOutLines: ["You will need to tap My page in Telegram again to see My Page.", "Your reminders and everything you have saved stay as they are."],
    yesSignOut: "Yes, sign out",
    // Problems with what was sent (drafts): shown on the same page, nothing saved.
    typeAName: "Please type a name.",
    nameTooLong: (n: number) => `Please keep a name to ${n} letters or fewer.`,
    childNeedsName: "Each child needs a name.",
    upTo3Children: (n: number) => `You can add up to ${n} children.`,
    pickHowOften: "Please choose how often.",
    upTo2Quick: "Choose up to 2 quick behaviours.",
    keepOneBehaviour: "Please keep at least 1 behaviour.",
    keepOneChild: "Please keep at least 1 child.", // [2026-11-26] W3
    keepOneTime: "Please keep at least 1 time on each schedule. To take a break, use Pause.",
    timeNotFound: "That time isn't on your list.",
    pickAListedTime: "Please pick one of the listed times.",
  },
  dustbin: "Delete", // draft; rule 9.6. [2026-11-24] Now the dustbin's spoken label (screen readers); the picture is an outline bin (L12)
  confirmLine: "Delete this line? It will be gone for good. Your log stays.", // rule 9.6
  confirmReflection: "Delete this reflection? It will be gone for good.", // draft, rule 9.6
  confirmMomentLine: "Delete this moment's line? It will be gone for good.", // draft, rule 9.6
  confirmPhoto: "Delete this photo? It will be gone for good. Your log stays.", // [2026-11-24] owner-approved test PH12
  confirmMomentPhoto: "Delete this moment's photo? It will be gone for good.", // [2026-11-24] draft, rule 9.6
  cancel: "Cancel", // owner, 15 Nov (wireframe A)
  delete: "Delete", // owner, 15 Nov (wireframe A)
  badRequest: "That request isn't one this page understands.", // draft
  didntWork: "Sorry, that didn't work. Please try again.", // draft, rule 1.3
  notFound: "This page doesn't exist.", // draft
} as const;
