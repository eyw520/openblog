import assert from "node:assert/strict";
import { test } from "node:test";

import type { EntryMeta } from "./entry";
import { groupByYear, sortEntries } from "./sort";

function entry(slug: string, date: string, title = slug): EntryMeta {
  return {
    slug,
    collection: "posts",
    href: `/writing/${slug}`,
    title,
    date,
    description: "",
    draft: false,
    readingMinutes: 1
  };
}

test("date-desc puts the newest entry first", () => {
  const sorted = sortEntries([entry("a", "2026-01-01"), entry("b", "2026-06-01")], "date-desc");
  assert.deepEqual(
    sorted.map((e) => e.slug),
    ["b", "a"]
  );
});

test("date-asc puts the oldest entry first", () => {
  const sorted = sortEntries([entry("b", "2026-06-01"), entry("a", "2026-01-01")], "date-asc");
  assert.deepEqual(
    sorted.map((e) => e.slug),
    ["a", "b"]
  );
});

test("title sorts alphabetically", () => {
  const sorted = sortEntries(
    [entry("c", "2026-01-01", "Zebra"), entry("a", "2026-01-01", "Apple")],
    "title"
  );
  assert.deepEqual(
    sorted.map((e) => e.title),
    ["Apple", "Zebra"]
  );
});

test("entries sharing a date keep their input order, so builds stay reproducible", () => {
  const same = [entry("a", "2026-01-01"), entry("b", "2026-01-01"), entry("c", "2026-01-01")];
  assert.deepEqual(
    sortEntries(same, "date-desc").map((e) => e.slug),
    ["a", "b", "c"]
  );
});

test("sorting does not mutate the input", () => {
  const entries = [entry("a", "2026-01-01"), entry("b", "2026-06-01")];
  sortEntries(entries, "date-desc");
  assert.deepEqual(
    entries.map((e) => e.slug),
    ["a", "b"]
  );
});

test("groupByYear collects consecutive entries under one year heading", () => {
  const groups = groupByYear([
    entry("a", "2026-06-01"),
    entry("b", "2026-01-01"),
    entry("c", "2025-11-01")
  ]);
  assert.deepEqual(
    groups.map((g) => [g.year, g.entries.length]),
    [
      ["2026", 2],
      ["2025", 1]
    ]
  );
});

test("groupByYear reopens a year rather than merging out-of-order entries", () => {
  const groups = groupByYear([entry("a", "2026-06-01"), entry("b", "2025-01-01"), entry("c", "2026-01-01")]);
  assert.deepEqual(
    groups.map((g) => g.year),
    ["2026", "2025", "2026"]
  );
});

test("grouping an empty list yields no groups", () => {
  assert.deepEqual(groupByYear([]), []);
});
