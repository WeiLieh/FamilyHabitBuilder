// =============================================================================
// src/nudge-engine/child-turn.ts: which child a message names (rule 3.16)
//
// What it does: [2026-11-13] a parent with 2 or 3 children is told once that
// the bot takes turns naming one of them in each message (owner, Q4, 12 Nov:
// naming all of them is a put-off). Turns follow the order the names were
// typed (Mia, Leo, Ava, Mia...) across every message that names a child:
// "Start right now" (which names the first child) and the nudges.
//
// How: the number of earlier messages that named a child picks the next one,
// wrapping round with "%" (the remainder after dividing: 5 % 2 = 1).
// No database calls: pull request 3c counts the messages and passes the count in.
// =============================================================================

// children: the names in the order they were typed; namedBefore: how many
// earlier messages to this parent named a child. Null when no child is
// recorded (then the words say "your child").
export function childForMessage(children: string[], namedBefore: number): string | null {
  if (children.length === 0) return null;
  return children[namedBefore % children.length] ?? null;
}
