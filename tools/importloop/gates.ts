import { existsSync } from "node:fs";
import { basename, join } from "node:path";

import type { GateResult, Snapshot } from "./contract";
import type { EntryLike, Pairing } from "./match";
import { unpaired } from "./match";
import { fidelity, markdownToText, missingExcerpt } from "./text";

/**
 * The gates.
 *
 * Each answers one question about the import and reports every failure it
 * found, not the first — an agent fixing one post at a time wants the whole
 * list. Together they say what "faithfully imported" means, which is the thing
 * this harness exists to define.
 */

/** Every source post has an entry. */
export function coverageGate(pairings: Pairing[], minimum: number): GateResult {
  const missing = pairings.filter((pairing) => !pairing.entry);
  const found = pairings.length - missing.length;
  const ratio = pairings.length === 0 ? 1 : found / pairings.length;

  return {
    gate: `coverage (${percent(ratio)} of ${pairings.length}, need ${percent(minimum)})`,
    passed: ratio >= minimum,
    summary: `${found}/${pairings.length} source posts have an entry`,
    failures: missing
      .slice(0, 20)
      .map((pairing) => `no entry for ${pairing.post.url} — "${pairing.post.title}"`)
      .concat(missing.length > 20 ? [`…and ${missing.length - 20} more`] : [])
  };
}

/** Titles and dates say what the source said. */
export function metadataGate(pairings: Pairing[]): GateResult {
  const failures: string[] = [];

  for (const { post, entry } of pairings) {
    if (!entry) {
      continue;
    }
    if (normalize(entry.title) !== normalize(post.title) && post.title.length > 0) {
      failures.push(`${entry.slug}: title is "${entry.title}", source says "${post.title}"`);
    }
    if (post.date.length > 0 && entry.date !== post.date) {
      failures.push(`${entry.slug}: date is ${entry.date}, source says ${post.date}`);
    }
  }

  return {
    gate: "metadata",
    passed: failures.length === 0,
    summary: `${pairings.filter((p) => p.entry).length} entries checked`,
    failures
  };
}

/** The words survived. */
export function fidelityGate(pairings: Pairing[], minimum: number): GateResult {
  const failures: string[] = [];
  const scores: number[] = [];

  for (const { post, entry } of pairings) {
    if (!entry) {
      continue;
    }
    const imported = markdownToText(entry.body);
    const score = fidelity(post.text, imported);
    scores.push(score);

    if (score < minimum) {
      const excerpt = missingExcerpt(post.text, imported);
      failures.push(
        `${entry.slug}: ${percent(score)} of the source's wording (need ${percent(minimum)})` +
          (excerpt ? ` — first missing: "${excerpt}…"` : "")
      );
    }
  }

  const worst = scores.length > 0 ? Math.min(...scores) : 1;
  return {
    gate: `fidelity (worst ${percent(worst)}, need ${percent(minimum)})`,
    passed: failures.length === 0,
    summary: `${scores.length} entries scored`,
    failures
  };
}

/**
 * Every picture an entry references was actually brought across.
 *
 * Images are the part of an import that fails silently: the Markdown looks
 * right, the build succeeds, and the page has a broken box on it.
 */
export function assetsGate(pairings: Pairing[], publicDir: string): GateResult {
  const failures: string[] = [];
  let checked = 0;

  for (const { entry } of pairings) {
    if (!entry) {
      continue;
    }
    for (const reference of imageReferences(entry.body)) {
      if (/^https?:\/\//.test(reference)) {
        continue; // Still hosted elsewhere; nothing local to check.
      }
      checked += 1;
      const file = join(publicDir, reference.replace(/^\//, ""));
      if (!existsSync(file)) {
        failures.push(`${entry.slug}: references ${reference}, which is not in public/`);
      }
    }
  }

  return {
    gate: "assets",
    passed: failures.length === 0,
    summary: `${checked} local image reference(s) checked`,
    failures
  };
}

/**
 * Entries that no source post accounts for.
 *
 * Never a failure — a blog being moved may gain a new post, and the starter
 * content is still there on the first run. Reported because an unexpected one
 * usually means a slug was mistyped and a post was imported twice.
 */
export function strayEntries(entries: EntryLike[], pairings: Pairing[]): string[] {
  return unpaired(entries, pairings).map((entry) => entry.slug);
}

/** Markdown `![](…)`, `<photo src>`, and `<gallery images>` all reference files. */
function imageReferences(body: string): string[] {
  const found = new Set<string>();

  for (const match of body.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
    add(found, match[1]);
  }
  for (const match of body.matchAll(/<(?:photo|img)\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
    add(found, match[1]);
  }
  for (const match of body.matchAll(/<gallery\b[^>]*\bimages=["']([^"']+)["']/gi)) {
    for (const item of (match[1] ?? "").split(",")) {
      add(found, item.trim().split("|")[0]);
    }
  }
  return [...found];
}

function add(into: Set<string>, value: string | undefined): void {
  if (value !== undefined && value.length > 0) {
    into.add(value);
  }
}

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

function percent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** The label a report uses for a snapshot, so provenance is visible. */
export function describeSnapshot(snapshot: Snapshot, file: string): string {
  return `${basename(file)} — ${snapshot.posts.length} post(s) from ${snapshot.source} via ${snapshot.discovery}, taken ${snapshot.fetchedAt.split("T")[0] ?? "?"}`;
}
