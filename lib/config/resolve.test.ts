import assert from "node:assert/strict";
import { test } from "node:test";

import type { SiteConfig } from "./define";
import { resolveConfig } from "./resolve";

function config(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    title: "Field Notes",
    description: "Essays on maps.",
    author: { name: "Ada Lovelace" },
    url: "https://ada.github.io/notes",
    collections: [{ name: "posts", label: "Writing" }],
    ...overrides
  };
}

test("a project-site URL yields the subdirectory as basePath", () => {
  const resolved = resolveConfig(config());
  assert.equal(resolved.origin, "https://ada.github.io");
  assert.equal(resolved.basePath, "/notes");
  assert.equal(resolved.url, "https://ada.github.io/notes");
});

test("a custom domain yields an empty basePath, not a slash", () => {
  const resolved = resolveConfig(config({ url: "https://fieldnotes.com" }));
  assert.equal(resolved.basePath, "");
  assert.equal(resolved.url, "https://fieldnotes.com");
});

test("a trailing slash on the URL does not leak into basePath", () => {
  assert.equal(resolveConfig(config({ url: "https://ada.github.io/notes/" })).basePath, "/notes");
  assert.equal(resolveConfig(config({ url: "https://fieldnotes.com/" })).basePath, "");
});

test("a collection route defaults to its name", () => {
  const [collection] = resolveConfig(config()).collections;
  assert.equal(collection?.route, "/posts");
});

test("an explicit route wins and loses its trailing slash", () => {
  const resolved = resolveConfig(
    config({ collections: [{ name: "posts", label: "Writing", route: "/writing/" }] })
  );
  assert.equal(resolved.collections[0]?.route, "/writing");
});

test("collection defaults are newest-first, in the nav, and in the feed", () => {
  const [collection] = resolveConfig(config()).collections;
  assert.equal(collection?.sort, "date-desc");
  assert.equal(collection?.nav, true);
  assert.equal(collection?.feed, true);
});

test("nav is derived from collections in declared order", () => {
  const resolved = resolveConfig(
    config({
      collections: [
        { name: "posts", label: "Writing", route: "/writing" },
        { name: "notes", label: "Notes" }
      ]
    })
  );
  assert.deepEqual(resolved.nav, [
    { label: "Writing", href: "/writing" },
    { label: "Notes", href: "/notes" }
  ]);
});

test("a collection can be published but kept out of the nav", () => {
  const resolved = resolveConfig(
    config({
      collections: [
        { name: "posts", label: "Writing" },
        { name: "drafts", label: "Drafts", nav: false }
      ]
    })
  );
  assert.deepEqual(resolved.nav, [{ label: "Writing", href: "/posts" }]);
});

test("an explicit nav replaces the derived one", () => {
  const nav = [{ label: "About", href: "/about" }];
  assert.deepEqual(resolveConfig(config({ nav })).nav, nav);
});

test("the front page lists five entries from every collection by default", () => {
  const resolved = resolveConfig(
    config({
      collections: [
        { name: "posts", label: "Writing" },
        { name: "notes", label: "Notes" }
      ]
    })
  );
  assert.equal(resolved.home.latest, 5);
  assert.deepEqual(resolved.home.collections, ["posts", "notes"]);
});

test("the front-page list can be turned off or narrowed to one collection", () => {
  const resolved = resolveConfig(
    config({
      collections: [
        { name: "posts", label: "Writing" },
        { name: "notes", label: "Notes" }
      ],
      home: { latest: 0, collections: ["posts"] }
    })
  );
  assert.equal(resolved.home.latest, 0);
  assert.deepEqual(resolved.home.collections, ["posts"]);
});

test("nav records whether it was written by hand, so pages know to stay out", () => {
  assert.equal(resolveConfig(config()).navExplicit, false);
  assert.equal(resolveConfig(config({ nav: [{ label: "About", href: "/about" }] })).navExplicit, true);
});

test("locale defaults to en", () => {
  assert.equal(resolveConfig(config()).locale, "en");
  assert.equal(resolveConfig(config({ locale: "fr" })).locale, "fr");
});
