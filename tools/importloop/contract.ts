import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The importloop contract.
 *
 * An import job is "reproduce this existing blog inside openblog". The harness
 * never does the importing — an agent writes the Markdown, exactly as designloop
 * has the agent write render.ts — it only decides whether the result is faithful.
 *
 * Two things differ from designloop, both forced by the task:
 *
 *   1. There is no reference image. openblog deliberately imposes its own
 *      design, so a pixel diff against the source would fail by construction.
 *      The reference is the source's *content*, and the gates measure how much
 *      of it survived.
 *   2. The nondeterminism is the network, not a random seed. So the source is
 *      snapshotted once into a committed manifest and every gate runs against
 *      that, offline. Re-running verify never touches the source site again,
 *      which makes the loop fast, reproducible, and polite.
 */

export const SOURCES_DIR = join(dirname(fileURLToPath(import.meta.url)), "sources");

/** How much of the source's wording must survive into the imported entry. */
export interface FidelityGateSpec {
  /** 0–1. 0.9 means nine words in ten are accounted for. */
  minimum: number;
}

/** How many of the source's posts must exist in openblog. */
export interface CoverageGateSpec {
  /** 0–1. Below 1 while an import is still in progress. */
  minimum: number;
}

export interface GateSpecs {
  coverage?: CoverageGateSpec;
  /** Titles and dates match the source. */
  metadata?: boolean;
  fidelity?: FidelityGateSpec;
  /** Every image an imported entry references exists in public/. */
  assets?: boolean;
}

export interface ImportContract {
  slug: string;
  /** The blog being reproduced. */
  url: string;
  /** The openblog collection its posts land in. */
  collection: string;
  /**
   * "gates" means a clean run is done; "human" means a clean run is ready for
   * someone to read before it is called done. Same meaning as in designloop.
   */
  accept: "gates" | "human";
  /**
   * Fetch each post's own page rather than trusting the feed's summary. Needed
   * for feeds that carry only an excerpt, which is most of them.
   */
  fetchPages?: boolean;
  /**
   * Source URL to openblog slug, for posts whose address does not map cleanly.
   * Unlisted posts are matched by their URL's last segment, then by title.
   */
  mapping?: Record<string, string>;
  /** Source URLs to leave out entirely — a colophon, an index page. */
  exclude?: string[];
  gates: GateSpecs;
}

/** One post as it exists on the source site. */
export interface SourcePost {
  url: string;
  title: string;
  /** ISO calendar date, or "" when the source did not give one. */
  date: string;
  /** Plain text of the post body, with markup already removed. */
  text: string;
  /** Images the source post referenced, as absolute URLs. */
  images: string[];
}

/** The committed record of a source site at one moment. */
export interface Snapshot {
  source: string;
  fetchedAt: string;
  /** How the posts were discovered, for the report. */
  discovery: "feed" | "sitemap";
  posts: SourcePost[];
}

export interface GateResult {
  gate: string;
  passed: boolean;
  failures: string[];
  /** One line of context shown even when the gate passes. */
  summary?: string;
}

export function sourceDir(slug: string): string {
  return join(SOURCES_DIR, slug);
}

export function loadContract(slug: string): { contract: ImportContract; dir: string } {
  const dir = sourceDir(slug);
  const file = join(dir, "import.json");
  if (!existsSync(file)) {
    throw new Error(
      `No import job called "${slug}". Expected ${file}.\n` +
        `Create one with: npm run import:init -- <slug> <url>`
    );
  }
  const contract = JSON.parse(readFileSync(file, "utf-8")) as ImportContract;
  return { contract: { ...contract, slug }, dir };
}

export function loadSnapshot(slug: string): Snapshot {
  const file = join(sourceDir(slug), "snapshot.json");
  if (!existsSync(file)) {
    throw new Error(`No snapshot for "${slug}". Take one first:\n` + `  npm run import:snapshot -- ${slug}`);
  }
  return JSON.parse(readFileSync(file, "utf-8")) as Snapshot;
}
