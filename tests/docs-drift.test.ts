// =============================================================================
// tests/docs-drift.test.ts: the drift test (documentation must match the code)
//
// What it checks: the rules in docs/SPEC.md, section "Modules and structure"
// (rules S1 to S7, R1 to R4, D1 to D3, B1, B2, P1, P2, plus the owner's list).
// It runs inside `npm run check`, so GitHub Actions runs it on every pull request.
//
// How it is built (Test-Driven Development):
//   Part 1 proves each check works: it builds a small, correct example repo in
//   memory, shows the check passes, then breaks it on purpose and shows the
//   check fails. A check that never fails would be useless.
//   Part 2 runs every check against the real repo. It must have no failures.
//   Warnings (R4: code changed after its spec) are printed but do not fail.
//
// The "ratchet": per-module checks only apply to modules marked "migrated: yes"
// in the Module table. Each restructure pull request flips one module to yes.
// =============================================================================

import { describe, expect, it } from "vitest";
import {
  type Repo,
  fingerprint,
  loadRepoFromDisk,
  parseStructure,
  runAllChecks,
  checkSingleClaudeMd,
  checkReachable,
  checkBrokenLinks,
  checkDiagramNames,
  checkRetiredNames,
  checkSingleDiagram,
  checkDiagramStatus,
  checkSrcRoot,
  checkApiNames,
  checkSqlLocation,
  checkImportsFollowArrows,
  checkRuleIds,
  checkMinTestCount,
  checkEnvExample,
  checkAppliedMigrations,
  checkContentScriptNames,
  checkModuleSpecs,
  checkModuleSlugNames,
  checkRuleTestedBy,
  warnStaleSpecs,
} from "./helpers/docs-drift.js";

// ---------------------------------------------------------------------------
// A small, correct example repo (all in memory). Two modules: "Alpha engine"
// (migrated, built) and "Beta store" (not migrated yet, no code).
// ---------------------------------------------------------------------------
const P = "[2026-10-31 10:00 SGT]"; // a date prefix, as our rules require

function goodRepo(): Repo {
  const files = new Map<string, string | null>([
    ["CLAUDE.md", `# Master prompt\n${P} Index: [master spec](docs/SPEC.md)\n`],
    ["README.md", `# Example\n`],
    [
      "docs/SPEC.md",
      [
        "# Spec",
        "## Modules and structure",
        `${P} Documents: [readme](../README.md), [diagram](ARCHITECTURE.md), [alpha spec](../src/alpha-engine/SPEC.md)`,
        "### Module table",
        "| Module | Slug | Folder | Spec | Status | Migrated |",
        "|---|---|---|---|---|---|",
        "| Alpha engine | alpha-engine | `src/alpha-engine/` | `src/alpha-engine/SPEC.md` | Built | yes |",
        "| Beta store | beta-store | `src/beta-store/` | `src/beta-store/SPEC.md` | Not started | no |",
        "### Cross-cutting files",
        `- ${P} \`src/settings.ts\``,
        `- ${P} \`api/health.ts\``,
        "### Retired module names",
        `- ${P} Habit rules`,
        "### Retired rule IDs",
        `- ${P} 9.9`,
        "### Minimum test count",
        `- ${P} Minimum test count: 2`,
        "## Change notes",
        `- ${P} An old note with a [link that no longer exists](gone.md) is fine here.`,
      ].join("\n"),
    ],
    [
      "docs/ARCHITECTURE.md",
      [
        "# Architecture",
        "```mermaid",
        "flowchart LR",
        '  alpha["Alpha engine<br/>Built"]',
        '  beta["Beta store<br/>Not started"]',
        "  alpha --- beta",
        "```",
      ].join("\n"),
    ],
    [
      "src/alpha-engine/SPEC.md",
      `# Alpha engine spec\n- **2.1** Picks things. Tested by: tests/alpha-engine-picks.test.ts\n- **2.2** Not built yet. Not yet tested.\n`,
    ],
    ["src/alpha-engine/picks.ts", `import { LIMIT } from "../settings.js";\nexport const x = LIMIT;\n`],
    ["src/settings.ts", `export const LIMIT = 3;\n`],
    ["api/health.ts", `export default function handler() {}\n`],
    ["tests/alpha-engine-picks.test.ts", `import { x } from "../src/alpha-engine/picks.js";\nit("a", () => {});\nit("b", () => {});\n`],
    [".env.example", `# names only\nSECRET_KEY=\n`],
    ["docs/archive/old-diagram.png", null],
  ]);
  return { files };
}

// Change one file in a fresh copy of the good repo.
function withFile(path: string, content: string | null): Repo {
  const repo = goodRepo();
  repo.files.set(path, content);
  return repo;
}
function without(path: string): Repo {
  const repo = goodRepo();
  repo.files.delete(path);
  return repo;
}
// Replace text inside one file of a fresh good repo.
function edited(path: string, from: string, to: string): Repo {
  const repo = goodRepo();
  const text = repo.files.get(path) ?? "";
  if (!text.includes(from)) throw new Error(`test setup: "${from}" not found in ${path}`);
  repo.files.set(path, text.replace(from, to));
  return repo;
}
// Mark Beta store as migrated (to test per-module checks).
const migrateBeta = (repo: Repo) => {
  const spec = repo.files.get("docs/SPEC.md") ?? "";
  repo.files.set("docs/SPEC.md", spec.replace("| Not started | no |", "| Not started | yes |"));
  return repo;
};

// ===========================================================================
// Part 1: each check passes on the good repo and fails when broken
// ===========================================================================
describe("Drift checks: the example repo is clean", () => {
  it("passes every check", () => {
    expect(runAllChecks(goodRepo()).failures).toEqual([]);
  });
});

describe("Drift checks: each one catches its problem", () => {
  const s = (repo: Repo) => parseStructure(repo);

  it("fails with more than one CLAUDE.md", () => {
    expect(checkSingleClaudeMd(withFile("src/CLAUDE.md", "# copy"))).not.toEqual([]);
  });

  it("fails when a .md file can't be reached by links from CLAUDE.md or docs/SPEC.md", () => {
    const repo = withFile("docs/ORPHAN.md", "# nobody links here");
    expect(checkReachable(repo)).toEqual([expect.stringContaining("docs/ORPHAN.md")]);
    // Files in docs/archive/ are exempt.
    expect(checkReachable(withFile("docs/archive/old.md", "# history"))).toEqual([]);
  });

  it("fails on a broken relative link in current text, but ignores SUPERSEDED lines and change notes", () => {
    const broken = edited("CLAUDE.md", "(docs/SPEC.md)", "(docs/SPEC.md) [x](docs/MISSING.md)");
    expect(checkBrokenLinks(broken)).toEqual([expect.stringContaining("docs/MISSING.md")]);
    const superseded = edited("CLAUDE.md", "(docs/SPEC.md)", "(docs/SPEC.md)\nSUPERSEDED [x](docs/MISSING.md)");
    expect(checkBrokenLinks(superseded)).toEqual([]);
    // goodRepo already has a dead link inside its change notes: still clean.
    expect(checkBrokenLinks(goodRepo())).toEqual([]);
  });

  it("fails when a diagram label isn't an official module name, or a name is missing", () => {
    const wrong = edited("docs/ARCHITECTURE.md", "Beta store<br/>", "Beta storage<br/>");
    expect(checkDiagramNames(wrong, s(wrong)).length).toBeGreaterThan(0);
    const missing = edited("docs/ARCHITECTURE.md", '  beta["Beta store<br/>Not started"]\n', "");
    expect(checkDiagramNames(missing, s(missing))).toEqual([expect.stringContaining("Beta store")]);
  });

  it("fails when a retired module name is used in the diagram, a module spec or CLAUDE.md", () => {
    const repo = edited("CLAUDE.md", "# Master prompt", "# Master prompt\nSee the Habit rules module.");
    expect(checkRetiredNames(repo, s(repo))).toEqual([expect.stringContaining("Habit rules")]);
  });

  it("fails with more than one architecture diagram (image files, or Mermaid naming 2+ modules)", () => {
    expect(checkSingleDiagram(withFile("docs/diagram.png", null), s(goodRepo())).length).toBeGreaterThan(0);
    const copy = goodRepo().files.get("docs/ARCHITECTURE.md") ?? "";
    expect(checkSingleDiagram(withFile("docs/CATCH-UP.md", copy), s(goodRepo())).length).toBeGreaterThan(0);
    // A Mermaid flow that names no modules (e.g. a hook loop) is not an architecture diagram.
    const flow = "```mermaid\nflowchart LR\n  a[Trigger] --> b[Action]\n```";
    expect(checkSingleDiagram(withFile("docs/OTHER.md", flow), s(goodRepo()))).toEqual([]);
  });

  it("fails when a diagram status doesn't match the Module table", () => {
    const repo = edited("docs/ARCHITECTURE.md", "Alpha engine<br/>Built", "Alpha engine<br/>Live");
    expect(checkDiagramStatus(repo, s(repo))).toEqual([expect.stringContaining("Alpha engine")]);
  });

  it("S4: fails for a file directly in src/ that isn't cross-cutting", () => {
    expect(checkSrcRoot(withFile("src/helpers.ts", "export {}"), s(goodRepo()))).not.toEqual([]);
    // Temporary allowance: <slug>.ts of a module that is not migrated yet.
    expect(checkSrcRoot(withFile("src/beta-store.ts", "export {}"), s(goodRepo()))).toEqual([]);
  });

  it("S3: fails for an api/ file not named after a module or listed as cross-cutting", () => {
    expect(checkApiNames(withFile("api/misc.ts", "export {}"), s(goodRepo()))).not.toEqual([]);
    expect(checkApiNames(withFile("api/alpha-engine.ts", "export {}"), s(goodRepo()))).toEqual([]);
  });

  it("S6: once Datastore is migrated, fails for SQL outside its folder", () => {
    const repo = goodRepo();
    const spec = (repo.files.get("docs/SPEC.md") ?? "").replace(
      "| Beta store | beta-store |",
      "| Datastore | datastore | `src/datastore/` | `src/datastore/SPEC.md` | Live | yes |\n| Beta store | beta-store |",
    );
    repo.files.set("docs/SPEC.md", spec);
    repo.files.set("supabase/old.sql", "select 1;");
    expect(checkSqlLocation(repo, s(repo))).toEqual([expect.stringContaining("supabase/old.sql")]);
  });

  it("S7: fails when one module uses another without an arrow between them in the diagram", () => {
    const repo = withFile("src/alpha-engine/picks.ts", `import { y } from "../gamma-thing/y.js";\n`);
    const spec = (repo.files.get("docs/SPEC.md") ?? "").replace(
      "| Beta store | beta-store |",
      "| Gamma thing | gamma-thing | `src/gamma-thing/` | `src/gamma-thing/SPEC.md` | Not started | no |\n| Beta store | beta-store |",
    );
    repo.files.set("docs/SPEC.md", spec);
    expect(checkImportsFollowArrows(repo, s(repo))).toEqual([expect.stringContaining("Gamma thing")]);
    // With an arrow alpha --- beta, Alpha may use Beta.
    const ok = withFile("src/alpha-engine/picks.ts", `import { y } from "../beta-store/y.js";\n`);
    expect(checkImportsFollowArrows(ok, s(ok))).toEqual([]);
  });

  it("R1, R2: fails when a rule ID is written in two specs, or a retired ID is reused", () => {
    const twice = withFile("src/beta-store/SPEC.md", "- **2.1** Duplicate.");
    expect(checkRuleIds(twice, s(twice))).toEqual([expect.stringContaining("2.1")]);
    const retired = withFile("src/beta-store/SPEC.md", "- **9.9** Reused.");
    expect(checkRuleIds(retired, s(retired))).toEqual([expect.stringContaining("9.9")]);
  });

  it("P1: fails when there are fewer tests than the recorded minimum", () => {
    const repo = edited("docs/SPEC.md", "Minimum test count: 2", "Minimum test count: 5");
    expect(checkMinTestCount(repo, s(repo))).toEqual([expect.stringContaining("5")]);
  });

  it("P2: fails when .env.example holds a value instead of only a name", () => {
    expect(checkEnvExample(withFile(".env.example", "SECRET_KEY=abc123\n"))).not.toEqual([]);
  });

  it("B1: once Datastore is migrated, fails when an applied migration's fingerprint changes", () => {
    const repo = goodRepo();
    const sql = "create table t ();";
    const spec = (repo.files.get("docs/SPEC.md") ?? "").replace(
      "| Beta store | beta-store |",
      "| Datastore | datastore | `src/datastore/` | `src/datastore/SPEC.md` | Live | yes |\n| Beta store | beta-store |",
    );
    repo.files.set("docs/SPEC.md", spec);
    repo.files.set("src/datastore/supabase/migrations/001_t.sql", sql);
    repo.files.set(
      "src/datastore/SPEC.md",
      `| Migration | Fingerprint |\n|---|---|\n| 001_t.sql | ${fingerprint(sql)} |\n`,
    );
    expect(checkAppliedMigrations(repo, s(repo))).toEqual([]);
    repo.files.set("src/datastore/supabase/migrations/001_t.sql", sql + " -- edited");
    expect(checkAppliedMigrations(repo, s(repo))).toEqual([expect.stringContaining("001_t.sql")]);
  });

  it("B2: once Datastore is migrated, fails for a content script not named YYYY-MM-DD_what.sql", () => {
    const repo = goodRepo();
    const spec = (repo.files.get("docs/SPEC.md") ?? "").replace(
      "| Beta store | beta-store |",
      "| Datastore | datastore | `src/datastore/` | `src/datastore/SPEC.md` | Live | yes |\n| Beta store | beta-store |",
    );
    repo.files.set("docs/SPEC.md", spec);
    repo.files.set("src/datastore/supabase/content/fix-stuff.sql", "select 1;");
    expect(checkContentScriptNames(repo, s(repo))).toEqual([expect.stringContaining("fix-stuff.sql")]);
  });

  it("S1 (ratchet): fails when a migrated module has no SPEC.md, and ignores unmigrated ones", () => {
    expect(checkModuleSpecs(goodRepo(), s(goodRepo()))).toEqual([]); // Beta not migrated: no spec needed yet
    const repo = migrateBeta(goodRepo());
    expect(checkModuleSpecs(repo, s(repo))).toEqual([expect.stringContaining("Beta store")]);
    const gone = without("src/alpha-engine/SPEC.md");
    expect(checkModuleSpecs(gone, s(gone))).toEqual([expect.stringContaining("Alpha engine")]);
  });

  it("S5 (ratchet): fails when a test of a migrated module isn't named after its slug", () => {
    const repo = withFile("tests/picks.test.ts", `import { x } from "../src/alpha-engine/picks.js";\nit("c", () => {});\n`);
    expect(checkModuleSlugNames(repo, s(repo))).toEqual([expect.stringContaining("tests/picks.test.ts")]);
  });

  it("R3 (ratchet): fails when a rule in a migrated module's spec doesn't say how it is tested", () => {
    const repo = edited("src/alpha-engine/SPEC.md", " Not yet tested.", "");
    expect(checkRuleTestedBy(repo, s(repo))).toEqual([expect.stringContaining("2.2")]);
  });

  it("R4: warns (does not fail) when a module's code changed after its spec", () => {
    const dates = new Map([
      ["src/alpha-engine/SPEC.md", 100],
      ["src/alpha-engine/picks.ts", 200],
    ]);
    const warnings = warnStaleSpecs(goodRepo(), s(goodRepo()), (path) => dates.get(path) ?? null);
    expect(warnings).toEqual([expect.stringContaining("Alpha engine")]);
  });
});

// ===========================================================================
// Part 2: the real repo
// ===========================================================================
describe("Drift check: the real repo", () => {
  it("has no documentation drift (failures listed if any)", () => {
    const repo = loadRepoFromDisk(process.cwd());
    const { failures, warnings } = runAllChecks(repo, { withGitDates: true });
    for (const w of warnings) console.warn(`DRIFT WARNING: ${w}`);
    expect(failures).toEqual([]);
  });
});
