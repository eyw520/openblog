import assert from "node:assert/strict";
import { test } from "node:test";

import { parsePage, sortPagesForNav, type PageMeta, type ParsePageInput } from "./page";

function input(overrides: Partial<ParsePageInput> = {}): ParsePageInput {
  return { slug: "about", data: { title: "About" }, body: "Hello.", ...overrides };
}

function expectOk(result: ReturnType<typeof parsePage>) {
  assert.equal(result.ok, true, result.ok ? "" : result.errors.join("\n"));
  return result.ok ? result.page : assert.fail("unreachable");
}

function meta(overrides: Partial<PageMeta>): PageMeta {
  return {
    slug: "p",
    href: "/p",
    title: "P",
    description: "",
    nav: true,
    navLabel: "P",
    navOrder: 0,
    ...overrides
  };
}

test("a page's slug becomes its whole path, with no collection prefix", () => {
  assert.equal(expectOk(parsePage(input())).href, "/about");
});

test("a page stays out of the navigation unless it asks to be in it", () => {
  assert.equal(expectOk(parsePage(input())).nav, false);
  assert.equal(expectOk(parsePage(input({ data: { title: "About", nav: true } }))).nav, true);
});

test("the navigation label defaults to the title", () => {
  const page = expectOk(parsePage(input({ data: { title: "About this site" } })));
  assert.equal(page.navLabel, "About this site");
});

test("a navigation label can differ from the heading", () => {
  const page = expectOk(parsePage(input({ data: { title: "About this site", navLabel: "About" } })));
  assert.equal(page.title, "About this site");
  assert.equal(page.navLabel, "About");
});

test("a missing title names the file and the line to add", () => {
  const result = parsePage(input({ data: {} }));
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : (result.errors[0] ?? ""), /content\/pages\/about\.md — "title" is missing/);
});

test('nav: "true" is rejected, since a quoted string would silently not show', () => {
  const result = parsePage(input({ data: { title: "About", nav: "true" } }));
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : (result.errors[0] ?? ""), /must be true or false/);
});

test("navOrder must be a number", () => {
  const result = parsePage(input({ data: { title: "About", navOrder: "1" } }));
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : (result.errors[0] ?? ""), /must be a number/);
});

test("navigation sorts by navOrder first", () => {
  const sorted = sortPagesForNav([
    meta({ slug: "c", navLabel: "Colophon", navOrder: 2 }),
    meta({ slug: "a", navLabel: "About", navOrder: 1 })
  ]);
  assert.deepEqual(
    sorted.map((p) => p.slug),
    ["a", "c"]
  );
});

test("pages sharing a navOrder fall back to alphabetical, never arbitrary order", () => {
  const sorted = sortPagesForNav([
    meta({ slug: "z", navLabel: "Zoo" }),
    meta({ slug: "a", navLabel: "Ant" })
  ]);
  assert.deepEqual(
    sorted.map((p) => p.slug),
    ["a", "z"]
  );
});
