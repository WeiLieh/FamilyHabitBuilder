// =============================================================================
// tests/datastore-consents.test.ts: which consent answer counts (rule 11.13)
//
// Behaviour checked (owner-approved test T13, 1 Nov): consents are add-only, so
// a parent can have several answers per topic; the latest one counts. A parent
// whose latest experiments answer is "opted out" gets every Control value. A
// topic with no answer at all is reported as missing, never guessed (rule 1.3).
// =============================================================================

import { describe, expect, it } from "vitest";
import { currentConsent, type ConsentRow } from "../src/datastore/consents.js";

const rows: ConsentRow[] = [
  { topic: "recording", answer: "agreed", createdAt: "2027-03-01T10:00:00+08:00" },
  { topic: "experiments", answer: "agreed", createdAt: "2027-03-01T10:00:00+08:00" },
  { topic: "experiments", answer: "opted_out", createdAt: "2027-04-02T09:30:00+08:00" },
];

describe("Datastore: which consent answer counts (rule 11.13)", () => {
  it("uses the latest answer for a topic", () => {
    expect(currentConsent(rows, "experiments")).toBe("opted_out");
  });

  it("does not mix topics: recording is still agreed", () => {
    expect(currentConsent(rows, "recording")).toBe("agreed");
  });

  it("uses the latest answer even if the rows arrive out of order", () => {
    expect(currentConsent([...rows].reverse(), "experiments")).toBe("opted_out");
  });

  it("reports a topic with no answer as missing, never a guessed answer", () => {
    expect(currentConsent(rows, "photos")).toBe("missing");
  });
});
