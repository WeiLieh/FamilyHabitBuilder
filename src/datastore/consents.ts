// =============================================================================
// src/datastore/consents.ts: which consent answer counts
//
// The consents table is add-only (rule 8.4): when a parent changes their mind,
// a new row is added and the old one stays as history. So for each topic, the
// LATEST answer counts. Opting out of experiments lives here (rule 11.13): a
// parent whose latest "experiments" answer is opted_out gets every Control
// value. A topic with no answer is "missing", never a guess (rule 1.3).
// =============================================================================

export type ConsentTopic = "recording" | "photos" | "experiments";
export type ConsentAnswer = "agreed" | "opted_out";

// One row as read from the consents table (only the columns needed here).
export type ConsentRow = { topic: ConsentTopic; answer: ConsentAnswer; createdAt: string };

export function currentConsent(rows: ConsentRow[], topic: ConsentTopic): ConsentAnswer | "missing" {
  // Keep only this topic's answers, newest first (compare the actual moments,
  // not the text, so different time-zone spellings still sort correctly).
  const forTopic = rows
    .filter((r) => r.topic === topic)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const latest = forTopic[0];
  return latest === undefined ? "missing" : latest.answer;
}
