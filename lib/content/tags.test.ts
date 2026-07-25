import assert from "node:assert/strict";
import { test } from "node:test";

import type { EntryMeta } from "./entry";
import { collectTags, entriesWithTag, tagSlug } from "./tags";

function entry(slug: string, tags: string[]): EntryMeta {
  return {
    slug,
    collection: "posts",
    href: `/writing/${slug}`,
    title: slug,
    date: "2026-01-01",
    description: "",
    draft: false,
    readingMinutes: 1,
    tags,
    fields: {}
  };
}

test("a tag slug is lowercase with spaces turned into hyphens", () => {
  assert.equal(tagSlug("Web Design"), "web-design");
  assert.equal(tagSlug("  Maps  "), "maps");
});

test("punctuation collapses rather than leaking into the address", () => {
  assert.equal(tagSlug("C++"), "c");
  assert.equal(tagSlug("day-to-day"), "day-to-day");
  assert.equal(tagSlug("a  &  b"), "a-b");
});

test("a tag with nothing usable slugs to empty and is ignored", () => {
  assert.equal(tagSlug("!!!"), "");
  assert.deepEqual(collectTags([entry("a", ["!!!"])]), []);
});

test("tags differing only in case or spacing are one tag", () => {
  const tags = collectTags([entry("a", ["Maps"]), entry("b", ["maps"]), entry("c", ["MAPS"])]);
  assert.equal(tags.length, 1);
  assert.equal(tags[0]?.count, 3);
  assert.equal(tags[0]?.slug, "maps");
});

test("the first spelling encountered becomes the label", () => {
  const tags = collectTags([entry("a", ["Maps"]), entry("b", ["maps"])]);
  assert.equal(tags[0]?.label, "Maps");
});

test("tags are ordered by use, then alphabetically so ties are stable", () => {
  const tags = collectTags([
    entry("a", ["zebra", "maps"]),
    entry("b", ["maps"]),
    entry("c", ["apple"])
  ]);
  assert.deepEqual(
    tags.map((t) => [t.slug, t.count]),
    [
      ["maps", 2],
      ["apple", 1],
      ["zebra", 1]
    ]
  );
});

test("entries are found by tag slug, however the tag was typed", () => {
  const entries = [entry("a", ["Web Design"]), entry("b", ["maps"]), entry("c", ["web design"])];
  assert.deepEqual(
    entriesWithTag(entries, "web-design").map((e) => e.slug),
    ["a", "c"]
  );
});

test("an untagged blog produces no tags at all", () => {
  assert.deepEqual(collectTags([entry("a", []), entry("b", [])]), []);
});
