import assert from "node:assert/strict";
import { test } from "node:test";

import type { SiteConfig } from "./define";
import { validateConfig } from "./validate";

function validConfig(): SiteConfig {
  return {
    title: "Field Notes",
    description: "Essays on maps.",
    author: { name: "Ada Lovelace" },
    url: "https://ada.github.io/notes",
    collections: [{ name: "posts", label: "Writing" }]
  };
}

test("a complete config reports no problems", () => {
  assert.deepEqual(validateConfig(validConfig()), []);
});

test("every message names site.config.ts so the reader knows which file to open", () => {
  const errors = validateConfig({ ...validConfig(), title: "" });
  assert.equal(errors.length, 1);
  assert.match(errors[0] ?? "", /^site\.config\.ts — title:/);
});

test("a url missing its scheme is rejected with the GitHub Pages form spelled out", () => {
  const errors = validateConfig({ ...validConfig(), url: "ada.github.io/notes" });
  assert.equal(errors.length, 1);
  assert.match(errors[0] ?? "", /full URL beginning with https:\/\//);
  assert.match(errors[0] ?? "", /github\.io/);
});

test("blank required fields are all reported at once, not one per run", () => {
  const errors = validateConfig({
    ...validConfig(),
    title: "",
    description: "   ",
    author: { name: "" }
  });
  assert.equal(errors.length, 3);
});

test("a collection name that is not a usable folder name is rejected", () => {
  const errors = validateConfig({
    ...validConfig(),
    collections: [{ name: "My Posts", label: "Writing" }]
  });
  assert.match(errors[0] ?? "", /lowercase letters, numbers, and hyphens/);
});

test("duplicate collection names are caught", () => {
  const errors = validateConfig({
    ...validConfig(),
    collections: [
      { name: "posts", label: "Writing" },
      { name: "posts", label: "Notes", route: "/notes" }
    ]
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0] ?? "", /declared twice/);
});

test("two collections resolving to the same route are caught", () => {
  const errors = validateConfig({
    ...validConfig(),
    collections: [
      { name: "posts", label: "Writing", route: "/words" },
      { name: "notes", label: "Notes", route: "/words" }
    ]
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0] ?? "", /already used by another collection/);
});

test("an implicit route collides with an explicit one", () => {
  const errors = validateConfig({
    ...validConfig(),
    collections: [
      { name: "notes", label: "Notes" },
      { name: "posts", label: "Writing", route: "/notes" }
    ]
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0] ?? "", /already used by another collection/);
});

test("an unknown sort order lists the ones that work", () => {
  const errors = validateConfig({
    ...validConfig(),
    collections: [{ name: "posts", label: "Writing", sort: "newest" as never }]
  });
  assert.match(errors[0] ?? "", /date-desc, date-asc, title/);
});

test("a nav href that is neither a path nor a URL is rejected", () => {
  const errors = validateConfig({
    ...validConfig(),
    nav: [{ label: "About", href: "about" }]
  });
  assert.match(errors[0] ?? "", /must start with "\/"/);
});

test("a front page drawing from a collection that does not exist is caught", () => {
  const errors = validateConfig({ ...validConfig(), home: { collections: ["notes"] } });
  assert.equal(errors.length, 1);
  assert.match(errors[0] ?? "", /"notes" is not a collection you declared/);
  assert.match(errors[0] ?? "", /Available: posts/);
});

test("a fractional or negative post count is rejected", () => {
  assert.equal(validateConfig({ ...validConfig(), home: { latest: 2.5 } }).length, 1);
  assert.equal(validateConfig({ ...validConfig(), home: { latest: -1 } }).length, 1);
  assert.deepEqual(validateConfig({ ...validConfig(), home: { latest: 0 } }), []);
});

test("declaring no collections at all is rejected", () => {
  const errors = validateConfig({ ...validConfig(), collections: [] });
  assert.equal(errors.length, 1);
  assert.match(errors[0] ?? "", /at least one kind of writing/);
});
