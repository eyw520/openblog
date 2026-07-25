import assert from "node:assert/strict";
import { test } from "node:test";

import type { ResolvedCollection } from "@/lib/config";

import { type RouteContext, type RouteTarget, entrySegments, indexSegments, resolveRoute } from "./routes";

function ctx(
  collections: ResolvedCollection[],
  pageSlugs: string[],
  tags: RouteContext["tags"] = null
): RouteContext {
  return { collections, pageSlugs, tags };
}

/** Narrows to a collection target; only index and entry carry a collection. */
function collectionName(target: RouteTarget | null): string {
  if (!target || (target.kind !== "index" && target.kind !== "entry")) {
    return assert.fail("expected a collection target");
  }
  return target.collection.name;
}

function collection(name: string, route: string): ResolvedCollection {
  return {
    name,
    label: name,
    route,
    description: "",
    sort: "date-desc",
    nav: true,
    feed: true,
    fields: {},
    layout: "default"
  };
}

const posts = collection("posts", "/writing");
const notes = collection("notes", "/notes");

test("a collection's own route resolves to its index", () => {
  const target = resolveRoute(ctx([posts], []), ["writing"]);
  assert.equal(target?.kind, "index");
  assert.equal(collectionName(target), "posts");
});

test("one segment under a collection resolves to an entry", () => {
  const target = resolveRoute(ctx([posts], []), ["writing", "first-light"]);
  assert.equal(target?.kind, "entry");
  assert.equal(target?.kind === "entry" ? target.slug : "", "first-light");
});

test("an unknown path resolves to nothing", () => {
  assert.equal(resolveRoute(ctx([posts], []), ["gallery"]), null);
  assert.equal(resolveRoute(ctx([posts], []), []), null);
});

test("a path deeper than an entry does not match", () => {
  assert.equal(resolveRoute(ctx([posts], []), ["writing", "first-light", "extra"]), null);
});

test("a nested collection route wins over a shorter one that prefixes it", () => {
  const daily = collection("daily", "/notes/daily");
  const target = resolveRoute(ctx([notes, daily], []), ["notes", "daily"]);
  assert.equal(target?.kind, "index");
  assert.equal(collectionName(target), "daily");
});

test("the shorter collection still claims its own entries", () => {
  const daily = collection("daily", "/notes/daily");
  const target = resolveRoute(ctx([notes, daily], []), ["notes", "monday"]);
  assert.equal(target?.kind, "entry");
  assert.equal(collectionName(target), "notes");
});

test("a collection route that merely shares a prefix is not confused for one", () => {
  const writingLog = collection("log", "/writinglog");
  const target = resolveRoute(ctx([posts, writingLog], []), ["writinglog"]);
  assert.equal(collectionName(target), "log");
});

test("a single segment matching a page slug resolves to that page", () => {
  const target = resolveRoute(ctx([posts], ["about"]), ["about"]);
  assert.equal(target?.kind, "page");
  assert.equal(target?.kind === "page" ? target.slug : "", "about");
});

test("a page slug that is not present still 404s", () => {
  assert.equal(resolveRoute(ctx([posts], ["about"]), ["colophon"]), null);
});

test("a collection route wins over a page of the same name", () => {
  const target = resolveRoute(ctx([posts], ["writing"]), ["writing"]);
  assert.equal(target?.kind, "index");
});

test("pages are only matched at the root, never nested under a collection", () => {
  assert.equal(resolveRoute(ctx([posts], ["about"]), ["writing", "about"])?.kind, "entry");
  assert.equal(resolveRoute(ctx([], ["about"]), ["extra", "about"]), null);
});

test("segments round-trip through the helpers", () => {
  assert.deepEqual(indexSegments(posts), ["writing"]);
  assert.deepEqual(entrySegments(posts, "first-light"), ["writing", "first-light"]);
  assert.deepEqual(indexSegments(collection("daily", "/notes/daily")), ["notes", "daily"]);
});

test("the tag route resolves to the tag index", () => {
  const target = resolveRoute(ctx([posts], [], { route: "/tags", slugs: ["maps"] }), ["tags"]);
  assert.equal(target?.kind, "tagIndex");
});

test("a known tag slug resolves to its page", () => {
  const target = resolveRoute(ctx([posts], [], { route: "/tags", slugs: ["maps"] }), ["tags", "maps"]);
  assert.equal(target?.kind, "tag");
  assert.equal(target?.kind === "tag" ? target.slug : "", "maps");
});

test("a tag nobody uses 404s rather than rendering an empty page", () => {
  assert.equal(resolveRoute(ctx([posts], [], { route: "/tags", slugs: ["maps"] }), ["tags", "ships"]), null);
});

test("tag routes do not exist at all when the blog has no tags", () => {
  assert.equal(resolveRoute(ctx([posts], []), ["tags"]), null);
});

test("a collection still wins over the tag route", () => {
  const tagged = collection("tagged", "/tags");
  const target = resolveRoute(ctx([tagged], [], { route: "/tags", slugs: ["maps"] }), ["tags"]);
  assert.equal(target?.kind, "index");
});
