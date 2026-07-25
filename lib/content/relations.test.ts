import assert from "node:assert/strict";
import { test } from "node:test";

import type { EntryMeta } from "./entry";
import { relatedEntries, seriesParts } from "./relations";

function entry(slug: string, overrides: Partial<EntryMeta> = {}): EntryMeta {
  return {
    slug,
    collection: "posts",
    href: `/writing/${slug}`,
    title: slug,
    date: "2026-01-01",
    description: "",
    draft: false,
    readingMinutes: 1,
    tags: [],
    fields: {},
    imageAlt: "",
    ...overrides
  };
}

test("entries sharing a series are collected and numbered", () => {
  const entries = [
    entry("a", { series: "Lisbon", seriesPart: 1 }),
    entry("b", { series: "Lisbon", seriesPart: 2 }),
    entry("c", { series: "Other" })
  ];
  const parts = seriesParts(entries, entries[0] as EntryMeta);
  assert.deepEqual(
    parts.map((p) => [p.entry.slug, p.part]),
    [
      ["a", 1],
      ["b", 2]
    ]
  );
});

test("the current entry is marked so a layout can show where the reader is", () => {
  const entries = [entry("a", { series: "L", seriesPart: 1 }), entry("b", { series: "L", seriesPart: 2 })];
  const parts = seriesParts(entries, entries[1] as EntryMeta);
  assert.deepEqual(
    parts.map((p) => p.current),
    [false, true]
  );
});

test("series names match loosely, as tags do", () => {
  const entries = [entry("a", { series: "Winter in Lisbon" }), entry("b", { series: "winter in lisbon" })];
  assert.equal(seriesParts(entries, entries[0] as EntryMeta).length, 2);
});

test("without explicit parts, a series falls back to date order", () => {
  const entries = [
    entry("late", { series: "L", date: "2026-06-01" }),
    entry("early", { series: "L", date: "2026-01-01" })
  ];
  assert.deepEqual(
    seriesParts(entries, entries[0] as EntryMeta).map((p) => p.entry.slug),
    ["early", "late"]
  );
});

test("numbered parts come before unnumbered ones rather than interleaving", () => {
  const entries = [
    entry("unnumbered", { series: "L", date: "2020-01-01" }),
    entry("first", { series: "L", seriesPart: 1, date: "2026-01-01" })
  ];
  assert.deepEqual(
    seriesParts(entries, entries[0] as EntryMeta).map((p) => p.entry.slug),
    ["first", "unnumbered"]
  );
});

test("a series of one shows nothing, since that is just a post", () => {
  const entries = [entry("a", { series: "Solo" })];
  assert.deepEqual(seriesParts(entries, entries[0] as EntryMeta), []);
});

test("an entry in no series has no parts", () => {
  assert.deepEqual(seriesParts([entry("a")], entry("a")), []);
});

test("related entries are ranked by how many tags they share", () => {
  const current = entry("current", { tags: ["maps", "travel"] });
  const entries = [
    current,
    entry("both", { tags: ["maps", "travel"] }),
    entry("one", { tags: ["maps"] }),
    entry("none", { tags: ["cooking"] })
  ];
  assert.deepEqual(
    relatedEntries(entries, current).map((e) => e.slug),
    ["both", "one"]
  );
});

test("an entry is never related to itself", () => {
  const current = entry("current", { tags: ["maps"] });
  assert.deepEqual(relatedEntries([current], current), []);
});

test("ties are broken by recency", () => {
  const current = entry("current", { tags: ["maps"] });
  const entries = [
    current,
    entry("older", { tags: ["maps"], date: "2025-01-01" }),
    entry("newer", { tags: ["maps"], date: "2026-05-01" })
  ];
  assert.deepEqual(
    relatedEntries(entries, current).map((e) => e.slug),
    ["newer", "older"]
  );
});

test("an untagged entry gets nothing rather than arbitrary posts", () => {
  const current = entry("current");
  assert.deepEqual(relatedEntries([current, entry("other", { tags: ["maps"] })], current), []);
});

test("the limit is respected", () => {
  const current = entry("current", { tags: ["maps"] });
  const entries = [current, entry("a", { tags: ["maps"] }), entry("b", { tags: ["maps"] })];
  assert.equal(relatedEntries(entries, current, 1).length, 1);
  assert.equal(relatedEntries(entries, current, 0).length, 0);
});

test("entries in other collections can be related, since tags cross sections", () => {
  const current = entry("current", { tags: ["maps"] });
  const other = entry("other", { collection: "notes", href: "/notes/other", tags: ["maps"] });
  assert.deepEqual(
    relatedEntries([current, other], current).map((e) => e.collection),
    ["notes"]
  );
});
