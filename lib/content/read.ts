import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { findCollection, site } from "@/lib/config";

import { parseEntry, type Entry, type EntryMeta } from "./entry";
import { sortEntries } from "./sort";

/**
 * Reading content/ from disk at build time. This module is deliberately thin:
 * it finds files and hands their contents to the pure functions alongside it,
 * which own every rule.
 *
 * Pages import this through services/content, which adds the `server-only`
 * guard. It is kept separate from that guard so the gate's validation script
 * can reuse exactly the code the site builds with — a checker that reimplements
 * the reader is a checker that eventually disagrees with it. Importing node:fs
 * already makes this module unusable from a client component.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

/** Drafts are visible while writing and disappear from a production build. */
const includeDrafts = process.env.NODE_ENV === "development";

export type { Entry, EntryMeta };

/**
 * Every entry in a collection, ordered per its `sort` setting.
 *
 * A file that fails validation stops the build: a blog that silently drops a
 * post the author believed they published is worse than one that refuses to
 * build and says exactly which line to fix.
 */
export function listEntries(collectionName: string): EntryMeta[] {
  const collection = findCollection(collectionName);
  if (!collection) {
    throw new Error(
      `No collection named "${collectionName}" in site.config.ts. ` +
        `Declared collections: ${site.collections.map((c) => c.name).join(", ") || "none"}.`
    );
  }

  const dir = path.join(CONTENT_DIR, collection.name);
  if (!fs.existsSync(dir)) {
    return [];
  }

  const errors: string[] = [];
  const entries: Entry[] = [];

  for (const slug of markdownSlugs(dir)) {
    const result = readEntry(collection.name, collection.route, slug);
    if (!result.ok) {
      errors.push(...result.errors);
    } else if (result.entry) {
      entries.push(result.entry);
    }
  }

  if (errors.length > 0) {
    throw new Error(["Some posts need attention:", "", ...errors.map((e) => `  • ${e}`), ""].join("\n"));
  }

  const visible = entries.filter((entry) => includeDrafts || !entry.draft);
  return sortEntries(visible, collection.sort);
}

/** One entry with its Markdown body, or null when there is no such file. */
export function getEntry(collectionName: string, slug: string): Entry | null {
  const collection = findCollection(collectionName);
  if (!collection) {
    return null;
  }

  const result = readEntry(collection.name, collection.route, slug);
  if (!result.ok) {
    throw new Error(["This post needs attention:", "", ...result.errors.map((e) => `  • ${e}`), ""].join("\n"));
  }
  if (!result.entry) {
    return null;
  }
  return !includeDrafts && result.entry.draft ? null : result.entry;
}

/** The slugs a collection's entry route should be generated for. */
export function listSlugs(collectionName: string): string[] {
  return listEntries(collectionName).map((entry) => entry.slug);
}

/** Every entry across every collection, for the feed and the sitemap. */
export function listAllEntries(): EntryMeta[] {
  return site.collections.flatMap((collection) => listEntries(collection.name));
}

type ReadResult = { ok: true; entry: Entry | null } | { ok: false; errors: string[] };

function readEntry(collection: string, route: string, slug: string): ReadResult {
  const file = path.join(CONTENT_DIR, collection, `${slug}.md`);
  if (!fs.existsSync(file)) {
    return { ok: true, entry: null };
  }

  const { data, content } = matter(fs.readFileSync(file, "utf-8"));
  const parsed = parseEntry({
    collection,
    route,
    slug,
    data,
    body: content.trim()
  });

  return parsed.ok ? { ok: true, entry: parsed.entry } : { ok: false, errors: parsed.errors };
}

/** Markdown filenames in a directory, without extensions, in stable order. */
function markdownSlugs(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.replace(/\.md$/, ""))
    .sort();
}
