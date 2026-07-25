import assert from "node:assert/strict";
import { test } from "node:test";

import type { ResolvedCollection } from "@/lib/config";

import { entrySegments, indexSegments, resolveRoute } from "./routes";

function collection(name: string, route: string): ResolvedCollection {
  return { name, label: name, route, description: "", sort: "date-desc", nav: true, feed: true };
}

const posts = collection("posts", "/writing");
const notes = collection("notes", "/notes");

test("a collection's own route resolves to its index", () => {
  const target = resolveRoute([posts], ["writing"]);
  assert.equal(target?.kind, "index");
  assert.equal(target?.collection.name, "posts");
});

test("one segment under a collection resolves to an entry", () => {
  const target = resolveRoute([posts], ["writing", "first-light"]);
  assert.equal(target?.kind, "entry");
  assert.equal(target?.kind === "entry" ? target.slug : "", "first-light");
});

test("an unknown path resolves to nothing", () => {
  assert.equal(resolveRoute([posts], ["gallery"]), null);
  assert.equal(resolveRoute([posts], []), null);
});

test("a path deeper than an entry does not match", () => {
  assert.equal(resolveRoute([posts], ["writing", "first-light", "extra"]), null);
});

test("a nested collection route wins over a shorter one that prefixes it", () => {
  const daily = collection("daily", "/notes/daily");
  const target = resolveRoute([notes, daily], ["notes", "daily"]);
  assert.equal(target?.kind, "index");
  assert.equal(target?.collection.name, "daily");
});

test("the shorter collection still claims its own entries", () => {
  const daily = collection("daily", "/notes/daily");
  const target = resolveRoute([notes, daily], ["notes", "monday"]);
  assert.equal(target?.kind, "entry");
  assert.equal(target?.collection.name, "notes");
});

test("a collection route that merely shares a prefix is not confused for one", () => {
  const writingLog = collection("log", "/writinglog");
  const target = resolveRoute([posts, writingLog], ["writinglog"]);
  assert.equal(target?.collection.name, "log");
});

test("segments round-trip through the helpers", () => {
  assert.deepEqual(indexSegments(posts), ["writing"]);
  assert.deepEqual(entrySegments(posts, "first-light"), ["writing", "first-light"]);
  assert.deepEqual(indexSegments(collection("daily", "/notes/daily")), ["notes", "daily"]);
});
