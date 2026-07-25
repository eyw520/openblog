import assert from "node:assert/strict";
import { test } from "node:test";

import { findFeedUrl, parseFeed, parseSitemap, toIsoDate } from "./feed";

const RSS = `<?xml version="1.0"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Field Notes</title>
    <item>
      <title>First Light</title>
      <link>https://example.com/first-light</link>
      <pubDate>Sun, 01 Mar 2026 00:00:00 GMT</pubDate>
      <description>An excerpt.</description>
      <content:encoded><![CDATA[<p>The tide was out.</p><img src="/a.jpg">]]></content:encoded>
    </item>
    <item>
      <title>Second</title>
      <link>https://example.com/second</link>
      <pubDate>Mon, 02 Mar 2026 00:00:00 GMT</pubDate>
      <description>Only a description.</description>
    </item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Atom Post</title>
    <link rel="alternate" href="https://example.com/atom-post"/>
    <published>2026-03-01T10:00:00Z</published>
    <content type="html">&lt;p&gt;Body text.&lt;/p&gt;</content>
  </entry>
</feed>`;

test("an RSS feed yields its posts in order", () => {
  const posts = parseFeed(RSS);
  assert.deepEqual(
    posts.map((post) => post.title),
    ["First Light", "Second"]
  );
});

test("the full body is preferred over the excerpt when the feed carries it", () => {
  const [first] = parseFeed(RSS);
  assert.equal(first?.text, "The tide was out.");
});

test("a feed offering only a description falls back to it", () => {
  const posts = parseFeed(RSS);
  assert.equal(posts[1]?.text, "Only a description.");
});

test("dates are reduced to a calendar day", () => {
  assert.equal(parseFeed(RSS)[0]?.date, "2026-03-01");
});

test("images in the body are recorded as absolute urls", () => {
  assert.deepEqual(parseFeed(RSS)[0]?.images, ["https://example.com/a.jpg"]);
});

test("an Atom feed is understood too, including its link attribute", () => {
  const [entry] = parseFeed(ATOM);
  assert.equal(entry?.title, "Atom Post");
  assert.equal(entry?.url, "https://example.com/atom-post");
  assert.equal(entry?.date, "2026-03-01");
  assert.equal(entry?.text, "Body text.");
});

test("a feed with a single item is still a list", () => {
  const single = RSS.replace(
    /<item>[\s\S]*?<\/item>\s*<item>[\s\S]*?<\/item>/,
    `<item>
      <title>Only</title><link>https://example.com/only</link>
    </item>`
  );
  assert.equal(parseFeed(single).length, 1);
});

test("something that is not a feed yields nothing rather than throwing", () => {
  assert.deepEqual(parseFeed("<html><body>Not a feed</body></html>"), []);
});

test("items with no address are discarded", () => {
  const broken = `<rss><channel><item><title>No link</title></item></channel></rss>`;
  assert.deepEqual(parseFeed(broken), []);
});

test("a feed link is discovered from the page head", () => {
  const html = `<link rel="alternate" type="application/rss+xml" href="/feed.xml">`;
  assert.equal(findFeedUrl(html, "https://example.com"), "https://example.com/feed.xml");
});

test("an atom link is discovered too, and absolute hrefs survive", () => {
  const html = `<link rel="alternate" type="application/atom+xml" href="https://cdn.example.com/f">`;
  assert.equal(findFeedUrl(html, "https://example.com"), "https://cdn.example.com/f");
});

test("a stylesheet link is not mistaken for a feed", () => {
  assert.equal(findFeedUrl(`<link rel="stylesheet" href="/a.css">`, "https://example.com"), null);
});

test("a sitemap yields its urls", () => {
  const xml = `<urlset><url><loc>https://example.com/a</loc></url><url><loc>https://example.com/b</loc></url></urlset>`;
  assert.deepEqual(parseSitemap(xml), ["https://example.com/a", "https://example.com/b"]);
});

test("an unparseable date becomes empty rather than Invalid Date", () => {
  assert.equal(toIsoDate("sometime"), "");
  assert.equal(toIsoDate(""), "");
});
