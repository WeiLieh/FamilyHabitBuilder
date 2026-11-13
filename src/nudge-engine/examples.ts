// =============================================================================
// src/nudge-engine/examples.ts: which example idea a nudge message carries (rule 3.13)
//
// What it does: [2026-11-13] each nudge message carries one example idea for
// its behaviour (for "Showing affection": "Give Mia a hug before school"...).
// chooseExample picks one this parent hasn't seen yet, and repeats only once
// they have seen every active example, like dealing cards and reshuffling only
// when the deck runs out.
//
// How: count how often this parent has had each active example; take the one
// used least often; on a tie, the lowest ID (the order the examples were
// added). A never-used example has a count of 0, so it always comes first,
// including one added later.
//
// No database or web calls: pull request 3c reads the examples and the
// parent's history and passes them in, so every case can be tested exactly.
// =============================================================================

// One example idea of a behaviour, as stored in the Nudge repository.
export type ExampleRow = { id: number; active: boolean };

// examples: all the behaviour's examples; usedExampleIds: the examples earlier
// nudge messages to THIS parent carried (repeats included).
export function chooseExample(examples: ExampleRow[], usedExampleIds: number[]): number {
  const active = examples.filter((e) => e.active).sort((a, b) => a.id - b.id);
  // Rule 1.3, no fallbacks: never send a nudge with a made-up example.
  if (active.length === 0) throw new Error("No active example for this behaviour: the nudge is not sent.");

  // How many times this parent has already had each active example.
  const timesUsed = (id: number) => usedExampleIds.filter((used) => used === id).length;

  // The least used wins; "sort" is stable, so ties keep the lowest ID first.
  return [...active].sort((a, b) => timesUsed(a.id) - timesUsed(b.id))[0]!.id;
}
