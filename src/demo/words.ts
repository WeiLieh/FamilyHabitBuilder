// =============================================================================
// src/demo/words.ts: every fixed sentence the Demo module says
//
// What it does: [2026-11-24] keeps the demo's own words in one place (rules
// 12.1 to 12.7). Everything else in a demo uses the bot's own words, unchanged,
// because the demo changes only the pacing (rule 12.5). "draft" marks Claude
// Code's wording, open for the owner to change; the rest is from the owner's
// spec of 24 Nov.
// =============================================================================

export const DEMO_WORDS = {
  note: "You're in demo mode. Type /demo stop to go back.", // rule 12.3 (owner, 24 Nov)
  done: "That's the whole week. Type /demo stop to finish.", // rule 12.4
  stopped: "✅ <b>Demo ended.</b>\nIts data is deleted. You're back on your own account.", // draft
  notRunning: "No demo is running. Type /demo to start one.", // draft
  finishSignUpFirst: "Finish the demo's sign-up first, then type /next.", // draft
  menuNext: "Next demo step", // draft; Menu description
  menuStop: "End the demo", // draft; Menu description
} as const;
