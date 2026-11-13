// =============================================================================
// src/nudge-engine/child-turn.ts: which child a message names (rule 3.16)
//
// What it does: [2026-11-13] a parent with 2 or 3 children is told once that
// the bot takes turns naming one of them in each message (owner, Q4, 12 Nov:
// naming all of them is a put-off). Turns follow the order the names were
// typed (Mia, Leo, Ava, Mia...) across every message that names a child:
// "Start right now" (which names the first child), the nudges, and the
// Weekly Wrap Up when it names a child.
//
// How: the number of earlier messages that named a child picks the next one,
// wrapping round with "%" (the remainder after dividing: 5 % 2 = 1).
// No database calls: pull request 3c counts the messages and passes the count in.
// =============================================================================

// children: the names in the order they were typed; namedBefore: how many
// earlier messages to this parent named a child. Null when no child is
// recorded (then the words say "your child").
export function childForMessage(children: string[], namedBefore: number): string | null {
  // [2026-11-13, privacy review] A wrong count (negative, a fraction, or a
  // failed read) is refused, so the failure shows instead of the message
  // quietly saying "your child" (rule 1.3, no fallbacks).
  if (!Number.isInteger(namedBefore) || namedBefore < 0) {
    throw new Error("The count of earlier messages naming a child must be a whole number of 0 or more.");
  }
  if (children.length === 0) return null;
  return children[namedBefore % children.length] ?? null;
}
