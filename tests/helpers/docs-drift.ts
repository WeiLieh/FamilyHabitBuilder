// =============================================================================
// tests/helpers/docs-drift.ts: the drift checks used by tests/docs-drift.test.ts
//
// What it does: reads the repo (or a small example repo built in a test) and
// checks that the documentation still matches the code. Each check returns a
// list of problems in plain words; an empty list means "all good".
//
// Where the facts come from: docs/SPEC.md, section "Modules and structure"
// (the Module table, the cross-cutting files, retired names and rule IDs, the
// minimum test count) and the one diagram, docs/ARCHITECTURE.md.
//
// Plain Node only (no new libraries): node:fs to read files, node:path for
// paths, node:crypto for fingerprints, node:child_process for Git dates.
// =============================================================================

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { posix as path, join } from "node:path";

// ---- The repo, as a list of files -------------------------------------------

// Every file in the repo by its path (e.g. "docs/SPEC.md"). Text files hold
// their text; binary files (images, spreadsheets) hold null.
export type Repo = { files: Map<string, string | null> };

const SKIP_FOLDERS = new Set(["node_modules", ".git", "dist", ".vercel"]);
const BINARY_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".xlsx", ".pdf", ".ico"]);

// Reads every file under the repo's top folder.
export function loadRepoFromDisk(root: string): Repo {
  const files = new Map<string, string | null>();
  const walk = (dir: string, rel: string) => {
    for (const name of readdirSync(dir)) {
      if (SKIP_FOLDERS.has(name)) continue;
      const full = join(dir, name);
      const relPath = rel === "" ? name : `${rel}/${name}`;
      if (statSync(full).isDirectory()) walk(full, relPath);
      else files.set(relPath, BINARY_EXTENSIONS.has(path.extname(name).toLowerCase()) ? null : readFileSync(full, "utf8"));
    }
  };
  walk(root, "");
  return { files };
}

// A short code computed from a file's contents (B1). Any edit changes it.
export function fingerprint(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}

// ---- Reading the master spec's "Modules and structure" section ---------------

export type Module = {
  name: string; // official name, e.g. "Nudge engine"
  slug: string; // e.g. "nudge-engine"
  folder: string; // e.g. "src/nudge-engine/"
  spec: string; // e.g. "src/nudge-engine/SPEC.md"
  status: string; // must match the diagram
  migrated: boolean; // the ratchet: per-module checks apply only when true
};

export type Structure = {
  modules: Module[];
  crossCutting: string[]; // files that belong to no module
  retiredNames: string[];
  retiredRuleIds: string[];
  minTests: number | null;
};

const DATE_PREFIX = /^\[[^\]]+\]\s*/;
const isSuperseded = (line: string) => line.includes("SUPERSEDED");
const cleanCell = (cell: string) => cell.trim().replace(/`/g, "");

// Splits a Markdown file into "### subsection" -> lines, inside one "## " section.
function subsections(text: string, section: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  let inSection = false;
  let current = "";
  for (const line of text.split("\n")) {
    if (line.startsWith("## ")) {
      inSection = line.slice(3).trim() === section;
      continue;
    }
    if (!inSection) continue;
    if (line.startsWith("### ")) {
      current = line.slice(4).trim();
      result.set(current, []);
    } else {
      result.get(current)?.push(line) ?? result.set(current, [line]);
    }
  }
  return result;
}

// Current list items ("- [date] text"), skipping SUPERSEDED ones; date removed.
function listItems(lines: string[] | undefined): string[] {
  return (lines ?? [])
    .filter((l) => l.startsWith("- ") && !isSuperseded(l))
    .map((l) => l.slice(2).replace(DATE_PREFIX, "").trim());
}

export function parseStructure(repo: Repo): Structure {
  const text = repo.files.get("docs/SPEC.md") ?? "";
  const parts = subsections(text, "Modules and structure");

  const modules: Module[] = [];
  for (const line of parts.get("Module table") ?? []) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map(cleanCell);
    if (cells.length < 6 || cells[0] === "Module" || /^-+$/.test(cells[0] ?? "")) continue;
    const [name, slug, folder, spec, status, migrated] = cells as [string, string, string, string, string, string];
    modules.push({ name, slug, folder, spec, status, migrated: migrated.toLowerCase() === "yes" });
  }

  const crossCutting = listItems(parts.get("Cross-cutting files"))
    .map((item) => /`([^`]+)`/.exec(item)?.[1])
    .filter((p): p is string => p !== undefined);
  const retiredNames = listItems(parts.get("Retired module names")).filter((n) => !/^none/i.test(n));
  const retiredRuleIds = listItems(parts.get("Retired rule IDs")).flatMap((n) => n.match(/\b\d+\.\d+\b/g) ?? []);
  const minLine = listItems(parts.get("Minimum test count")).find((l) => /Minimum test count:/.test(l));
  const minTests = minLine ? Number(/Minimum test count:\s*(\d+)/.exec(minLine)?.[1]) : null;

  return { modules, crossCutting, retiredNames, retiredRuleIds, minTests };
}

// ---- Small helpers -----------------------------------------------------------

const isArchive = (p: string) => p.startsWith("docs/archive/");
const markdownFiles = (repo: Repo) => [...repo.files.keys()].filter((p) => p.endsWith(".md") && !isArchive(p));
const exists = (repo: Repo, p: string) =>
  repo.files.has(p) || [...repo.files.keys()].some((f) => f.startsWith(p.endsWith("/") ? p : `${p}/`));

// Relative links "[text](target)" on one line (web links and #anchors skipped).
function linksOnLine(line: string): string[] {
  return [...line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)]
    .map((m) => m[1] ?? "")
    .filter((t) => t !== "" && !/^(https?:|mailto:|#)/.test(t));
}

// Resolves a link target relative to the file it is written in.
function resolveFrom(file: string, target: string): string {
  const clean = target.split("#")[0]?.split("?")[0] ?? "";
  return path.normalize(path.join(path.dirname(file), clean));
}

// Lines of a Markdown file that count as "current text": not SUPERSEDED, not
// inside a "## Change notes" section, not inside a ``` code block.
function currentLines(text: string): string[] {
  const out: string[] = [];
  let inChangeNotes = false;
  let inCode = false;
  for (const line of text.split("\n")) {
    if (line.startsWith("```")) inCode = !inCode;
    if (line.startsWith("## ")) inChangeNotes = line.slice(3).trim().toLowerCase() === "change notes";
    if (inCode || inChangeNotes || isSuperseded(line)) continue;
    out.push(line);
  }
  return out;
}

// Mermaid blocks (the text between ```mermaid and ```) in a Markdown file.
function mermaidBlocks(text: string): string[] {
  return [...text.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1] ?? "");
}

// The one diagram: its boxes (id, official name, status) and arrows.
type Diagram = { nodes: { id: string; name: string; status: string }[]; edges: [string, string][] };
const DIAGRAM_PATH = "docs/ARCHITECTURE.md";

function readDiagram(repo: Repo): Diagram | null {
  const text = repo.files.get(DIAGRAM_PATH);
  if (text == null) return null;
  const block = mermaidBlocks(text)[0] ?? "";
  const nodes = [...block.matchAll(/(\w+)\["([^"<]*)<br\/>([^"]*)"\]/g)].map((m) => ({
    id: m[1] ?? "",
    name: (m[2] ?? "").trim(),
    status: (m[3] ?? "").trim(),
  }));
  const edges: [string, string][] = [];
  for (const line of block.split("\n")) {
    const m = /^\s*(\w+)\s*(?:<-->|-->|---|-\.-|-\.->|<-\.->)\s*(\w+)\s*$/.exec(line);
    if (m) edges.push([m[1] ?? "", m[2] ?? ""]);
  }
  return { nodes, edges };
}

// Which module a code path belongs to (null = cross-cutting or tests).
function moduleOf(p: string, st: Structure): Module | null {
  const [top, second] = p.split("/");
  if (top === "src" && second) {
    const slug = second.replace(/\.ts$/, "");
    return st.modules.find((m) => m.slug === slug) ?? null;
  }
  if (top === "api" && second) {
    const slug = second.replace(/\.ts$/, "");
    return st.modules.find((m) => m.slug === slug) ?? null;
  }
  return null;
}

// Relative imports in a TypeScript file, resolved to repo paths.
function importsOf(file: string, text: string): string[] {
  return [...text.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)].map((m) => resolveFrom(file, m[1] ?? ""));
}

// ---- The checks (each returns a list of problems) ----------------------------

// Only one CLAUDE.md in the whole repo.
export function checkSingleClaudeMd(repo: Repo): string[] {
  const found = [...repo.files.keys()].filter((p) => path.basename(p).toLowerCase() === "claude.md");
  return found.length > 1 ? [`More than one CLAUDE.md: ${found.join(", ")}`] : [];
}

// D1: every .md file is reachable by links from CLAUDE.md or docs/SPEC.md.
export function checkReachable(repo: Repo): string[] {
  const seen = new Set<string>();
  const queue = ["CLAUDE.md", "docs/SPEC.md"].filter((p) => repo.files.has(p));
  while (queue.length > 0) {
    const file = queue.shift() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const line of (repo.files.get(file) ?? "").split("\n")) {
      for (const target of linksOnLine(line)) {
        const resolved = resolveFrom(file, target);
        if (resolved.endsWith(".md") && repo.files.has(resolved)) queue.push(resolved);
      }
    }
  }
  return markdownFiles(repo)
    .filter((p) => !seen.has(p))
    .map((p) => `${p} is not reachable by links from CLAUDE.md or docs/SPEC.md`);
}

// No broken relative links in current text.
export function checkBrokenLinks(repo: Repo): string[] {
  const problems: string[] = [];
  for (const file of markdownFiles(repo)) {
    for (const line of currentLines(repo.files.get(file) ?? "")) {
      for (const target of linksOnLine(line)) {
        const resolved = resolveFrom(file, target);
        if (!exists(repo, resolved)) problems.push(`${file}: broken link to ${target} (looked for ${resolved})`);
      }
    }
  }
  return problems;
}

// D3: diagram labels are official names, and every official name is in it.
export function checkDiagramNames(repo: Repo, st: Structure): string[] {
  const diagram = readDiagram(repo);
  if (diagram === null) return [`${DIAGRAM_PATH} is missing (it must hold the one diagram)`];
  const official = new Set(st.modules.map((m) => m.name));
  const shown = new Set(diagram.nodes.map((n) => n.name));
  return [
    ...diagram.nodes.filter((n) => !official.has(n.name)).map((n) => `Diagram label "${n.name}" is not an official module name`),
    ...st.modules.filter((m) => !shown.has(m.name)).map((m) => `Official module "${m.name}" is missing from the diagram`),
  ];
}

// D3: retired module names are not used in the diagram, CLAUDE.md, the
// catch-up page, module specs, the Module table or folder names.
export function checkRetiredNames(repo: Repo, st: Structure): string[] {
  const places = [DIAGRAM_PATH, "CLAUDE.md", "docs/CATCH-UP.md", ...st.modules.map((m) => m.spec)];
  const problems: string[] = [];
  for (const retired of st.retiredNames) {
    const needle = retired.toLowerCase();
    for (const place of places) {
      const text = repo.files.get(place);
      if (text == null) continue;
      if (currentLines(text).some((l) => l.toLowerCase().includes(needle))) {
        problems.push(`Retired name "${retired}" is used in ${place}`);
      }
    }
    if (st.modules.some((m) => m.name.toLowerCase() === needle)) problems.push(`Retired name "${retired}" is in the Module table`);
  }
  return problems;
}

// D2: only one architecture diagram: image files, or Mermaid blocks that name
// 2 or more official modules, anywhere outside docs/archive/.
export function checkSingleDiagram(repo: Repo, st: Structure): string[] {
  const names = st.modules.map((m) => m.name.toLowerCase());
  const diagrams: string[] = [];
  for (const [file, text] of repo.files) {
    if (isArchive(file)) continue;
    if (/\.(png|jpe?g|gif|svg|mmd|drawio)$/i.test(file)) diagrams.push(file);
    else if (file.endsWith(".md") && text != null) {
      for (const block of mermaidBlocks(text)) {
        const lower = block.toLowerCase();
        if (names.filter((n) => lower.includes(n)).length >= 2) {
          diagrams.push(file);
          break;
        }
      }
    }
  }
  return diagrams
    .filter((d) => d !== DIAGRAM_PATH)
    .map((d) => `${d} looks like a second architecture diagram; the only one is ${DIAGRAM_PATH}`);
}

// D2: each box's status in the diagram matches the Module table.
export function checkDiagramStatus(repo: Repo, st: Structure): string[] {
  const diagram = readDiagram(repo);
  if (diagram === null) return [];
  const problems: string[] = [];
  for (const node of diagram.nodes) {
    const module = st.modules.find((m) => m.name === node.name);
    if (module && module.status !== node.status) {
      problems.push(`${module.name}: diagram says "${node.status}", Module table says "${module.status}"`);
    }
  }
  return problems;
}

// S4 (and S1): directly in src/, only cross-cutting files (or, until a module
// is migrated, its single "<slug>.ts" file); folders in src/ are module slugs.
export function checkSrcRoot(repo: Repo, st: Structure): string[] {
  const problems: string[] = [];
  const slugs = new Set(st.modules.map((m) => m.slug));
  const unmigratedFiles = new Set(st.modules.filter((m) => !m.migrated).map((m) => `src/${m.slug}.ts`));
  for (const p of repo.files.keys()) {
    const parts = p.split("/");
    if (parts[0] !== "src") continue;
    if (parts.length === 2) {
      if (!st.crossCutting.includes(p) && !unmigratedFiles.has(p)) problems.push(`${p} sits directly in src/ but is not on the cross-cutting list`);
    } else if (!slugs.has(parts[1] ?? "")) {
      problems.push(`${p}: folder src/${parts[1]}/ is not a module slug`);
    }
  }
  return [...new Set(problems)];
}

// S3: api/ holds only thin files named after a module, or cross-cutting files.
export function checkApiNames(repo: Repo, st: Structure): string[] {
  return [...repo.files.keys()]
    .filter((p) => p.startsWith("api/"))
    .filter((p) => !st.crossCutting.includes(p) && moduleOf(p, st) === null)
    .map((p) => `${p} is not named after a module and is not on the cross-cutting list`);
}

const datastoreOf = (st: Structure) => st.modules.find((m) => m.slug === "datastore" && m.migrated);

// S6: once Datastore is migrated, all SQL lives in its folder.
export function checkSqlLocation(repo: Repo, st: Structure): string[] {
  const datastore = datastoreOf(st);
  if (!datastore) return [];
  return [...repo.files.keys()]
    .filter((p) => p.endsWith(".sql") && !p.startsWith(datastore.folder))
    .map((p) => `${p}: SQL must live in ${datastore.folder}`);
}

// S7: a module may use another module only if the diagram has an arrow between them.
export function checkImportsFollowArrows(repo: Repo, st: Structure): string[] {
  const diagram = readDiagram(repo);
  const nameById = new Map((diagram?.nodes ?? []).map((n) => [n.id, n.name]));
  const linked = new Set(
    (diagram?.edges ?? []).flatMap(([a, b]) => {
      const x = nameById.get(a);
      const y = nameById.get(b);
      return x && y ? [`${x}|${y}`, `${y}|${x}`] : [];
    }),
  );
  const problems: string[] = [];
  for (const [file, text] of repo.files) {
    if (text == null || !file.endsWith(".ts") || !(file.startsWith("src/") || file.startsWith("api/"))) continue;
    const from = moduleOf(file, st);
    if (!from) continue;
    for (const target of importsOf(file, text)) {
      const to = moduleOf(target, st);
      if (to && to.name !== from.name && !linked.has(`${from.name}|${to.name}`)) {
        problems.push(`${file}: ${from.name} uses ${to.name}, but the diagram has no arrow between them`);
      }
    }
  }
  return problems;
}

// All spec files: the master spec plus every SPEC.md under src/.
const specFiles = (repo: Repo) => [...repo.files.keys()].filter((p) => p === "docs/SPEC.md" || (p.startsWith("src/") && p.endsWith("/SPEC.md")));
const RULE_LINE = /^- \*\*(\d+\.\d+)\*\*/;

// R1, R2: a rule ID is written once, and retired IDs are never reused.
export function checkRuleIds(repo: Repo, st: Structure): string[] {
  const where = new Map<string, string[]>();
  for (const file of specFiles(repo)) {
    for (const line of (repo.files.get(file) ?? "").split("\n")) {
      if (isSuperseded(line)) continue;
      const id = RULE_LINE.exec(line)?.[1];
      if (id) where.set(id, [...(where.get(id) ?? []), file]);
    }
  }
  const problems: string[] = [];
  for (const [id, files] of where) {
    if (files.length > 1) problems.push(`Rule ${id} is written ${files.length} times (${files.join(", ")}); write it once and link to it`);
    if (st.retiredRuleIds.includes(id)) problems.push(`Rule ${id} is retired and must not be reused`);
  }
  return problems;
}

// P1: the number of tests never drops below the recorded minimum.
export function countTests(repo: Repo): number {
  let count = 0;
  for (const [file, text] of repo.files) {
    if (file.startsWith("tests/") && file.endsWith(".test.ts") && text) count += (text.match(/^\s*it\(/gm) ?? []).length;
  }
  return count;
}
export function checkMinTestCount(repo: Repo, st: Structure): string[] {
  if (st.minTests === null) return ["docs/SPEC.md has no \"Minimum test count\""];
  const count = countTests(repo);
  return count < st.minTests ? [`Only ${count} tests; the minimum recorded in docs/SPEC.md is ${st.minTests}`] : [];
}

// P2: .env.example holds setting names only, never values.
export function checkEnvExample(repo: Repo): string[] {
  const text = repo.files.get(".env.example");
  if (text == null) return [];
  return text
    .split("\n")
    .filter((l) => l.trim() !== "" && !l.trim().startsWith("#"))
    .filter((l) => !/^[A-Z0-9_]+=\s*$/.test(l))
    .map((l) => `.env.example must hold names only (NAME=), found: ${l.split("=")[0]}=...`);
}

// B1: once Datastore is migrated, applied migrations keep their fingerprint.
export function checkAppliedMigrations(repo: Repo, st: Structure): string[] {
  const datastore = datastoreOf(st);
  if (!datastore) return [];
  const problems: string[] = [];
  for (const line of (repo.files.get(datastore.spec) ?? "").split("\n")) {
    const cells = line.split("|").slice(1, -1).map(cleanCell);
    if (cells.length !== 2 || !cells[0]?.endsWith(".sql")) continue;
    const [name, expected] = cells as [string, string];
    const text = repo.files.get(`${datastore.folder}supabase/migrations/${name}`);
    if (text == null) problems.push(`Applied migration ${name} is missing`);
    else if (fingerprint(text) !== expected) problems.push(`Applied migration ${name} was edited (fingerprint changed); never edit an applied migration`);
  }
  return problems;
}

// B2: once Datastore is migrated, content scripts are named YYYY-MM-DD_what.sql.
export function checkContentScriptNames(repo: Repo, st: Structure): string[] {
  const datastore = datastoreOf(st);
  if (!datastore) return [];
  const folder = `${datastore.folder}supabase/content/`;
  return [...repo.files.keys()]
    .filter((p) => p.startsWith(folder) && p.endsWith(".sql"))
    .filter((p) => !/^\d{4}-\d{2}-\d{2}_[a-z0-9_]+\.sql$/.test(path.basename(p)))
    .map((p) => `${p}: content scripts must be named YYYY-MM-DD_what.sql`);
}

// S1 (ratchet): a migrated module has its SPEC.md inside its own folder.
export function checkModuleSpecs(repo: Repo, st: Structure): string[] {
  const problems: string[] = [];
  for (const m of st.modules.filter((x) => x.migrated)) {
    if (!m.spec.startsWith(m.folder)) problems.push(`${m.name}: its spec must be inside ${m.folder}`);
    if (!repo.files.has(m.spec)) problems.push(`${m.name}: no spec at ${m.spec}`);
  }
  return problems;
}

// S5 (ratchet): a migrated module's folder and its tests use its slug.
export function checkModuleSlugNames(repo: Repo, st: Structure): string[] {
  const problems: string[] = [];
  for (const m of st.modules.filter((x) => x.migrated)) {
    if (m.folder !== `src/${m.slug}/`) problems.push(`${m.name}: folder should be src/${m.slug}/`);
    for (const [file, text] of repo.files) {
      if (text == null || !file.startsWith("tests/") || st.crossCutting.includes(file)) continue;
      if (!importsOf(file, text).some((t) => t.startsWith(m.folder))) continue;
      const base = path.basename(file);
      if (!base.startsWith(`${m.slug}`)) problems.push(`${file} tests ${m.name} but its name doesn't start with "${m.slug}"`);
    }
  }
  return problems;
}

// R3 (ratchet): every rule in a migrated module's spec says how it is tested.
export function checkRuleTestedBy(repo: Repo, st: Structure): string[] {
  const problems: string[] = [];
  for (const m of st.modules.filter((x) => x.migrated)) {
    for (const line of (repo.files.get(m.spec) ?? "").split("\n")) {
      const id = RULE_LINE.exec(line)?.[1];
      if (id && !isSuperseded(line) && !/Tested by:|Not yet tested/.test(line)) {
        problems.push(`${m.spec}: rule ${id} must say "Tested by: ..." or "Not yet tested"`);
      }
    }
  }
  return problems;
}

// R4 (warning only): a migrated module's code changed after its spec.
export function warnStaleSpecs(repo: Repo, st: Structure, lastCommit: (p: string) => number | null): string[] {
  const warnings: string[] = [];
  for (const m of st.modules.filter((x) => x.migrated)) {
    const specDate = lastCommit(m.spec);
    if (specDate === null) continue;
    const codeDates = [...repo.files.keys()]
      .filter((p) => p.startsWith(m.folder) && p !== m.spec)
      .map(lastCommit)
      .filter((d): d is number => d !== null);
    if (codeDates.some((d) => d > specDate)) warnings.push(`${m.name}: code changed after ${m.spec}; check the spec is still right`);
  }
  return warnings;
}

// Last commit time of a file (seconds), from Git; null if unknown.
function gitLastCommit(p: string): number | null {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%ct", "--", p], { encoding: "utf8" }).trim();
    return out === "" ? null : Number(out);
  } catch {
    return null;
  }
}

// ---- Run everything ------------------------------------------------------------

export function runAllChecks(repo: Repo, options: { withGitDates?: boolean } = {}): { failures: string[]; warnings: string[] } {
  const st = parseStructure(repo);
  const failures = [
    ...(st.modules.length === 0 ? ["docs/SPEC.md has no Module table (section \"Modules and structure\")"] : []),
    ...checkSingleClaudeMd(repo),
    ...checkReachable(repo),
    ...checkBrokenLinks(repo),
    ...checkDiagramNames(repo, st),
    ...checkRetiredNames(repo, st),
    ...checkSingleDiagram(repo, st),
    ...checkDiagramStatus(repo, st),
    ...checkSrcRoot(repo, st),
    ...checkApiNames(repo, st),
    ...checkSqlLocation(repo, st),
    ...checkImportsFollowArrows(repo, st),
    ...checkRuleIds(repo, st),
    ...checkMinTestCount(repo, st),
    ...checkEnvExample(repo),
    ...checkAppliedMigrations(repo, st),
    ...checkContentScriptNames(repo, st),
    ...checkModuleSpecs(repo, st),
    ...checkModuleSlugNames(repo, st),
    ...checkRuleTestedBy(repo, st),
  ];
  const warnings = options.withGitDates ? warnStaleSpecs(repo, st, gitLastCommit) : [];
  return { failures, warnings };
}
