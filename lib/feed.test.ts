import assert from "node:assert/strict";
import { test } from "node:test";

import type { ResolvedSite } from "@/lib/config";
import type { EntryMeta } from "@/lib/content/entry";

import { buildFeed, escapeXml } from "./feed";

const site: ResolvedSite = {
  title: "Field Notes",
  description: "Essays on maps.",
  author: { name: "Ada Lovelace" },
  locale: "en",
  url: "https://ada.github.io/notes",
  origin: "https://ada.github.io",
  basePath: "/notes",
  collections: [],
  home: { latest: 5, collections: [] },
  tags: { route: "/tags", label: "Tags", nav: false },
  social: [],
  display: { readingTime: true, copyright: "" },
  nav: [],
  navExplicit: false
};

function entry(overrides: Partial<EntryMeta> = {}): EntryMeta {
  return {
    slug: "first-light",
    collection: "posts",
    href: "/writing/first-light",
    title: "First Light",
    date: "2026-03-01",
    description: "A beginning.",
    draft: false,
    readingMinutes: 3,
    tags: [],
    ...overrides
  };
}

test("the feed declares itself as XML and RSS 2.0", () => {
  const feed = buildFeed(site, [entry()]);
  assert.match(feed, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(feed, /<rss version="2\.0"/);
});

test("entry links are absolute and include the base path", () => {
  const feed = buildFeed(site, [entry()]);
  assert.match(feed, /<link>https:\/\/ada\.github\.io\/notes\/writing\/first-light<\/link>/);
});

test("an ampersand in a title is escaped, which is what keeps the feed parseable", () => {
  const feed = buildFeed(site, [entry({ title: "Salt & Light" })]);
  assert.match(feed, /<title>Salt &amp; Light<\/title>/);
  assert.doesNotMatch(feed, /Salt & Light/);
});

test("angle brackets in a description cannot break out of their element", () => {
  const feed = buildFeed(site, [entry({ description: "On <b>bold</b> claims" })]);
  assert.match(feed, /On &lt;b&gt;bold&lt;\/b&gt; claims/);
});

test("escaping an ampersand does not double-escape the entities it introduces", () => {
  assert.equal(escapeXml("& < > \" '"), "&amp; &lt; &gt; &quot; &apos;");
  assert.equal(escapeXml("&amp;"), "&amp;amp;");
});

test("dates are emitted in the RFC 822 form RSS requires", () => {
  const feed = buildFeed(site, [entry()]);
  assert.match(feed, /<pubDate>Sun, 01 Mar 2026 00:00:00 GMT<\/pubDate>/);
});

test("the build date comes from the newest entry, so identical content rebuilds identically", () => {
  const entries = [entry({ date: "2026-03-01" }), entry({ slug: "older", date: "2025-01-01" })];
  const first = buildFeed(site, entries);
  const second = buildFeed(site, entries);
  assert.equal(first, second);
  assert.match(first, /<lastBuildDate>Sun, 01 Mar 2026 00:00:00 GMT<\/lastBuildDate>/);
});

test("an empty feed is still a valid document", () => {
  const feed = buildFeed(site, []);
  assert.match(feed, /<channel>/);
  assert.doesNotMatch(feed, /<item>/);
  assert.doesNotMatch(feed, /lastBuildDate/);
});

test("an entry author overrides the site author", () => {
  const feed = buildFeed(site, [entry({ author: "Grace Hopper" })]);
  assert.match(feed, /<dc:creator>Grace Hopper<\/dc:creator>/);
});

test("a description is omitted rather than emitted empty", () => {
  const feed = buildFeed(site, [entry({ description: "" })]);
  assert.doesNotMatch(feed, /<description><\/description>/);
});
