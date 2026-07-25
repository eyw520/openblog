import { XMLParser } from "fast-xml-parser";

import type { SourcePost } from "./contract";
import { htmlToText } from "./text";

/**
 * Reading an existing blog's feed.
 *
 * A feed is tried before anything else because it is the one place a blog
 * states its own posts in a structured way — titles, dates, and often the full
 * body. Scraping the HTML of an unfamiliar site guesses at all three.
 *
 * Pure: it takes XML text and returns posts, so every feed shape this
 * understands is pinned by a test rather than discovered against a live site.
 */

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  // Feed text is HTML; leaving it alone here and stripping it deliberately in
  // htmlToText keeps one place responsible for that.
  processEntities: false,
  trimValues: true
});

/** Posts from an RSS 2.0 or Atom document, newest-first order preserved. */
export function parseFeed(xml: string): SourcePost[] {
  const document = parser.parse(xml) as Record<string, unknown>;

  const rssItems = pick(document, ["rss", "channel", "item"]);
  if (rssItems) {
    return asArray(rssItems).map(readRssItem).filter(hasUrl);
  }

  const atomEntries = pick(document, ["feed", "entry"]);
  if (atomEntries) {
    return asArray(atomEntries).map(readAtomEntry).filter(hasUrl);
  }

  return [];
}

/** The feed's own address, discovered from a blog's HTML `<link rel=alternate>`. */
export function findFeedUrl(html: string, baseUrl: string): string | null {
  const pattern = /<link\b[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const tag = match[0];
    if (!/rel=["']?alternate/i.test(tag)) {
      continue;
    }
    if (!/type=["']?application\/(rss|atom)\+xml/i.test(tag)) {
      continue;
    }
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    if (href) {
      return new URL(href, baseUrl).toString();
    }
  }
  return null;
}

/** URLs from a sitemap, for a blog with no feed at all. */
export function parseSitemap(xml: string): string[] {
  const document = parser.parse(xml) as Record<string, unknown>;
  const urls = pick(document, ["urlset", "url"]);
  if (!urls) {
    return [];
  }
  return asArray(urls)
    .map((entry) => text(entry.loc))
    .filter((url) => url.length > 0);
}

function readRssItem(item: Record<string, unknown>): SourcePost {
  // content:encoded carries the full post when the feed offers it; description
  // is usually only an excerpt, so it is the fallback rather than the choice.
  const body = text(item["content:encoded"]) || text(item.description);
  return {
    url: text(item.link),
    title: htmlToText(text(item.title)),
    date: toIsoDate(text(item.pubDate) || text(item["dc:date"])),
    text: htmlToText(body),
    images: imageUrls(body, text(item.link))
  };
}

function readAtomEntry(entry: Record<string, unknown>): SourcePost {
  const body = text(entry.content) || text(entry.summary);
  return {
    url: atomLink(entry),
    title: htmlToText(text(entry.title)),
    date: toIsoDate(text(entry.published) || text(entry.updated)),
    text: htmlToText(body),
    images: imageUrls(body, atomLink(entry))
  };
}

/** Atom puts the address in an attribute, and may list several links. */
function atomLink(entry: Record<string, unknown>): string {
  const links = asArray(entry.link);
  const alternate = links.find((link) => {
    const rel = link["@rel"];
    return rel === undefined || rel === "alternate";
  });
  return text((alternate ?? links[0])?.["@href"]);
}

/** Absolute URLs of every image the post body references. */
function imageUrls(html: string, base: string): string[] {
  const found = new Set<string>();
  const pattern = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const src = match[1];
    if (src === undefined) {
      continue;
    }
    try {
      found.add(new URL(src, base || undefined).toString());
    } catch {
      found.add(src);
    }
  }
  return [...found];
}

/** Any date spelling a feed might use, reduced to a calendar day. */
export function toIsoDate(value: string): string {
  if (value.length === 0) {
    return "";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : (parsed.toISOString().split("T")[0] ?? "");
}

function pick(root: Record<string, unknown>, path: string[]): unknown {
  let node: unknown = root;
  for (const key of path) {
    if (typeof node !== "object" || node === null) {
      return undefined;
    }
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

/** fast-xml-parser collapses a single repeated element to one object. */
function asArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value as Record<string, unknown>[];
  }
  if (typeof value === "object" && value !== null) {
    return [value as Record<string, unknown>];
  }
  return [];
}

/** An element may parse as a string, a number, or an object with #text. */
function text(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "object" && value !== null) {
    const inner = (value as Record<string, unknown>)["#text"];
    return typeof inner === "string" ? inner : "";
  }
  return "";
}

function hasUrl(post: SourcePost): boolean {
  return post.url.length > 0;
}
