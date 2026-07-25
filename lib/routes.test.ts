import assert from "node:assert/strict";
import { test } from "node:test";

import type { ResolvedCollection } from "@/lib/config";

import { type RouteTarget, entrySegments, indexSegments, resolveRoute } from "./routes";

/** Narrows to a collection target; a page target has no collection to read. */
function collectionName(target: RouteTarget | null): string {
  if (!target || target.kind === "page") {
    return assert.fail("expected a collection target");
  }
  return target.collection.name;
}

function collection(name: string, route: string): ResolvedCollection {
  return { name, label: name, route, description: "", sort: "date-desc", nav: true, feed: true };
}

const posts = collection("posts", "/writing");
const notes = collection("notes", "/notes");

test("a collection's own route resolves to its index", () => {
  const target = resolveRoute([posts], [], ["writing"]);
  assert.equal(target?.kind, "index");
  assert.equal(collectionName(target), "posts");
});

test("one segment under a collection resolves to an entry", () => {
  const target = resolveRoute([posts], [], ["writing", "first-light"]);
  assert.equal(target?.kind, "entry");
  assert.equal(target?.kind === "entry" ? target.slug : "", "first-light");
});

test("an unknown path resolves to nothing", () => {
  assert.equal(resolveRoute([posts], [], ["gallery"]), null);
  assert.equal(resolveRoute([posts], [], []), null);
});

test("a path deeper than an entry does not match", () => {
  assert.equal(resolveRoute([posts], [], ["writing", "first-light", "extra"]), null);
});

test("a nested collection route wins over a shorter one that prefixes it", () => {
  const daily = collection("daily", "/notes/daily");
  const target = resolveRoute([notes, daily], [], ["notes", "daily"]);
  assert.equal(target?.kind, "index");
  assert.equal(collectionName(target), "daily");
});

test("the shorter collection still claims its own entries", () => {
  const daily = collection("daily", "/notes/daily");
  const target = resolveRoute([notes, daily], [], ["notes", "monday"]);
  assert.equal(target?.kind, "entry");
  assert.equal(collectionName(target), "notes");
});

test("a collection route that merely shares a prefix is not confused for one", () => {
  const writingLog = collection("log", "/writinglog");
  const target = resolveRoute([posts, writingLog], [], ["writinglog"]);
  assert.equal(collectionName(target), "log");
});

test("a single segment matching a page slug resolves to that page", () => {
  const target = resolveRoute([posts], ["about"], ["about"]);
  assert.equal(target?.kind, "page");
  assert.equal(target?.kind === "page" ? target.slug : "", "about");
});

test("a page slug that is not present still 404s", () => {
  assert.equal(resolveRoute([posts], ["about"], ["colophon"]), null);
});

test("a collection route wins over a page of the same name", () => {
  const target = resolveRoute([posts], ["writing"], ["writing"]);
  assert.equal(target?.kind, "index");
});

test("pages are only matched at the root, never nested under a collection", () => {
  assert.equal(resolveRoute([posts], ["about"], ["writing", "about"])?.kind, "entry");
  assert.equal(resolveRoute([], ["about"], ["extra", "about"]), null);
});

test("segments round-trip through the helpers", () => {
  assert.deepEqual(indexSegments(posts), ["writing"]);
  assert.deepEqual(entrySegments(posts, "first-light"), ["writing", "first-light"]);
  assert.deepEqual(indexSegments(collection("daily", "/notes/daily")), ["notes", "daily"]);
});
