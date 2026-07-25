import assert from "node:assert/strict";
import { test } from "node:test";

import { extractHeadings, headingSlug } from "./headings";

test("second and third level headings are collected in order", () => {
  const headings = extractHeadings("## One\n\ntext\n\n### Two\n\n## Three");
  assert.deepEqual(
    headings.map((h) => [h.level, h.text]),
    [
      [2, "One"],
      [3, "Two"],
      [2, "Three"]
    ]
  );
});

test("the title level is excluded, since the page already has one", () => {
  assert.deepEqual(extractHeadings("# Title\n\n## Real"), [{ level: 2, text: "Real", id: "real" }]);
});

test("levels below the range are excluded by default", () => {
  assert.equal(extractHeadings("#### Deep").length, 0);
  assert.equal(extractHeadings("#### Deep", 2, 4).length, 1);
});

test("a hash inside a code block is not a heading", () => {
  const body = "## Real\n\n```sh\n# not a heading\n```\n\n## Also real";
  assert.deepEqual(
    extractHeadings(body).map((h) => h.text),
    ["Real", "Also real"]
  );
});

test("tilde fences are handled too", () => {
  const body = "~~~\n# not a heading\n~~~\n\n## Real";
  assert.deepEqual(
    extractHeadings(body).map((h) => h.text),
    ["Real"]
  );
});

test("emphasis and links are stripped from heading text", () => {
  const headings = extractHeadings("## A **bold** and [linked](/x) `heading`");
  assert.equal(headings[0]?.text, "A bold and linked heading");
});

test("anchors are lowercase and hyphenated", () => {
  assert.equal(headingSlug("Making the Stock"), "making-the-stock");
  assert.equal(headingSlug("Why? Because!"), "why-because");
});

test("repeated headings get distinct anchors, so both links work", () => {
  const headings = extractHeadings("## Method\n\n## Method\n\n## Method");
  assert.deepEqual(
    headings.map((h) => h.id),
    ["method", "method-1", "method-2"]
  );
});

test("a heading of only punctuation still gets a usable anchor", () => {
  const headings = extractHeadings("## ???");
  assert.equal(headings[0]?.id, "section");
});

test("a hash with no space is not a heading", () => {
  assert.equal(extractHeadings("##NotAHeading").length, 0);
});

test("a body with no headings yields none", () => {
  assert.deepEqual(extractHeadings("Just prose.\n\nMore prose."), []);
});
