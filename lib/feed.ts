import type { ResolvedSite } from "@/lib/config";
import type { EntryMeta } from "@/lib/content/entry";
import { formatRfc822 } from "@/lib/format-date";

/**
 * Building the RSS feed.
 *
 * Pure string assembly, kept out of the route so the two things most likely to
 * be wrong — escaping and ordering — can be tested directly. A feed reader is
 * unforgiving: one unescaped ampersand in a post title makes the whole document
 * unparseable, and every subscriber sees an error instead of the blog.
 */

/** RSS 2.0 document for the entries of every collection with `feed` enabled. */
export function buildFeed(site: ResolvedSite, entries: readonly EntryMeta[]): string {
  const feedUrl = `${site.url}/feed.xml`;

  // Dated from the newest entry rather than the clock: a build that changes
  // nothing should produce a byte-identical feed, so deploys stay diffable.
  const lastBuildDate = entries[0] ? formatRfc822(entries[0].date) : undefined;

  const items = entries.map((entry) => {
    const url = `${site.url}${entry.href}`;
    return [
      "    <item>",
      `      <title>${escapeXml(entry.title)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <pubDate>${formatRfc822(entry.date)}</pubDate>`,
      entry.description ? `      <description>${escapeXml(entry.description)}</description>` : undefined,
      (entry.author ?? site.author.name)
        ? `      <dc:creator>${escapeXml(entry.author ?? site.author.name)}</dc:creator>`
        : undefined,
      "    </item>"
    ]
      .filter((line) => line !== undefined)
      .join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${escapeXml(site.title)}</title>`,
    `    <link>${escapeXml(site.url)}</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    `    <language>${escapeXml(site.locale)}</language>`,
    ...(lastBuildDate ? [`    <lastBuildDate>${lastBuildDate}</lastBuildDate>`] : []),
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    "  </channel>",
    "</rss>",
    ""
  ].join("\n");
}

/**
 * Escapes the five characters XML reserves. Ampersand must be replaced first,
 * or it would double-escape the ampersands introduced by the other four.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
