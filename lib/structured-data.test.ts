import assert from "node:assert/strict";
import { test } from "node:test";

import type { ResolvedCollection, ResolvedSite } from "@/lib/config";
import type { Entry } from "@/lib/content/entry";

import { entryStructuredData, minutesToDuration } from "./structured-data";

const site = {
  title: "Field Notes",
  description: "Essays.",
  author: { name: "Ada Lovelace" },
  locale: "en",
  url: "https://ada.github.io/notes",
  origin: "https://ada.github.io",
  basePath: "/notes",
  collections: [],
  home: { latest: 5, collections: [] },
  tags: { route: "/tags", label: "Tags", nav: false },
  comments: null,
  social: [],
  theme: { preset: "ink" as const },
  display: { readingTime: true, copyright: "" },
  nav: [],
  navExplicit: false
} satisfies ResolvedSite;

function collection(overrides: Partial<ResolvedCollection> = {}): ResolvedCollection {
  return {
    name: "posts",
    label: "Writing",
    route: "/writing",
    description: "",
    sort: "date-desc",
    nav: true,
    feed: true,
    fields: {},
    layout: "default",
    indexLayout: "list",
    toc: false,
    ...overrides
  };
}

function entry(overrides: Partial<Entry> = {}): Entry {
  return {
    slug: "first-light",
    collection: "posts",
    href: "/writing/first-light",
    title: "First Light",
    date: "2026-03-01",
    description: "A beginning.",
    draft: false,
    readingMinutes: 3,
    tags: [],
    fields: {},
    imageAlt: "",
    body: "Text.",
    ...overrides
  };
}

test("an ordinary post is described as a BlogPosting with an absolute url", () => {
  const data = entryStructuredData(site, collection(), entry());
  assert.equal(data["@type"], "BlogPosting");
  assert.equal(data.url, "https://ada.github.io/notes/writing/first-light");
  assert.deepEqual(data.author, { "@type": "Person", name: "Ada Lovelace" });
});

test("a per-entry author overrides the site author", () => {
  const data = entryStructuredData(site, collection(), entry({ author: "Grace Hopper" }));
  assert.deepEqual(data.author, { "@type": "Person", name: "Grace Hopper" });
});

test("a cover image becomes an absolute image url", () => {
  const data = entryStructuredData(site, collection(), entry({ image: "/soup.jpg", imageAlt: "Soup" }));
  assert.equal(data.image, "https://ada.github.io/notes/soup.jpg");
});

test("an external cover image is not rewritten", () => {
  const data = entryStructuredData(site, collection(), entry({ image: "https://cdn.example.com/a.jpg" }));
  assert.equal(data.image, "https://cdn.example.com/a.jpg");
});

test("absent fields are omitted rather than emitted empty", () => {
  const data = entryStructuredData(site, collection(), entry({ description: "" }));
  assert.equal("description" in data, false);
  assert.equal("dateModified" in data, false);
  assert.equal("image" in data, false);
  assert.equal("keywords" in data, false);
});

test("a recipe collection is described as a Recipe", () => {
  const data = entryStructuredData(
    site,
    collection({ layout: "recipe" }),
    entry({ fields: { servings: 4, ingredients: ["flour", "water"], prepMinutes: 10, cookMinutes: 40 } })
  );
  assert.equal(data["@type"], "Recipe");
  assert.deepEqual(data.recipeIngredient, ["flour", "water"]);
  assert.equal(data.recipeYield, "4");
  assert.equal(data.prepTime, "PT10M");
  assert.equal(data.cookTime, "PT40M");
  assert.equal(data.totalTime, "PT50M");
});

test("a recipe missing its times omits them rather than guessing", () => {
  const data = entryStructuredData(site, collection({ layout: "recipe" }), entry());
  assert.equal(data["@type"], "Recipe");
  assert.equal("prepTime" in data, false);
  assert.equal("totalTime" in data, false);
});

test("durations are written the way schema.org requires", () => {
  assert.equal(minutesToDuration(0), "PT0M");
  assert.equal(minutesToDuration(45), "PT45M");
  assert.equal(minutesToDuration(60), "PT1H");
  assert.equal(minutesToDuration(90), "PT1H30M");
  assert.equal(minutesToDuration(150), "PT2H30M");
});

test("tags become keywords", () => {
  const data = entryStructuredData(site, collection(), entry({ tags: ["maps", "travel"] }));
  assert.equal(data.keywords, "maps, travel");
});
