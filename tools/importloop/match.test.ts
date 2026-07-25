import assert from "node:assert/strict";
import { test } from "node:test";

import type { ImportContract, SourcePost } from "./contract";
import { type EntryLike, pairPosts, slugFromUrl, unpaired } from "./match";

function contract(overrides: Partial<ImportContract> = {}): ImportContract {
  return {
    slug: "old",
    url: "https://example.com",
    collection: "posts",
    accept: "gates",
    gates: {},
    ...overrides
  };
}

function post(url: string, title = "A Post"): SourcePost {
  return { url, title, date: "2026-01-01", text: "Body.", images: [] };
}

function entry(slug: string, title = "A Post"): EntryLike {
  return { slug, title, date: "2026-01-01", body: "Body." };
}

test("a slug is the last path segment", () => {
  assert.equal(slugFromUrl("https://example.com/2026/03/first-light/"), "first-light");
  assert.equal(slugFromUrl("https://example.com/first-light"), "first-light");
});

test("a file extension is dropped from the slug", () => {
  assert.equal(slugFromUrl("https://example.com/posts/first-light.html"), "first-light");
});

test("a slug is normalized the way a filename would be", () => {
  assert.equal(slugFromUrl("https://example.com/First_Light!"), "first-light");
});

test("posts pair with entries by their address", () => {
  const pairs = pairPosts(contract(), [post("https://example.com/first-light")], [entry("first-light")]);
  assert.equal(pairs[0]?.entry?.slug, "first-light");
  assert.equal(pairs[0]?.by, "slug");
});

test("an explicit mapping wins over the address", () => {
  const pairs = pairPosts(
    contract({ mapping: { "https://example.com/p/123": "first-light" } }),
    [post("https://example.com/p/123")],
    [entry("first-light")]
  );
  assert.equal(pairs[0]?.entry?.slug, "first-light");
  assert.equal(pairs[0]?.by, "mapping");
});

test("a renamed file still pairs by title", () => {
  const pairs = pairPosts(
    contract(),
    [post("https://example.com/p/123", "First Light")],
    [entry("a-new-slug", "First Light")]
  );
  assert.equal(pairs[0]?.entry?.slug, "a-new-slug");
  assert.equal(pairs[0]?.by, "title");
});

test("titles match regardless of case and punctuation", () => {
  const pairs = pairPosts(
    contract(),
    [post("https://example.com/x", "First Light!")],
    [entry("y", "first light")]
  );
  assert.equal(pairs[0]?.entry?.slug, "y");
});

test("a post with no entry is reported as unpaired rather than guessed at", () => {
  const pairs = pairPosts(
    contract(),
    [post("https://example.com/missing", "Missing")],
    [entry("other", "Other")]
  );
  assert.equal(pairs[0]?.entry, undefined);
});

test("one entry cannot satisfy two source posts", () => {
  const pairs = pairPosts(
    contract(),
    [post("https://example.com/a", "Same Title"), post("https://example.com/b", "Same Title")],
    [entry("a", "Same Title")]
  );
  assert.equal(pairs[0]?.entry?.slug, "a");
  assert.equal(pairs[1]?.entry, undefined);
});

test("entries nobody claimed are listed", () => {
  const entries = [entry("a"), entry("extra", "Something New")];
  const pairs = pairPosts(contract(), [post("https://example.com/a")], entries);
  assert.deepEqual(
    unpaired(entries, pairs).map((e) => e.slug),
    ["extra"]
  );
});
