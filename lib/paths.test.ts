import assert from "node:assert/strict";
import { test } from "node:test";

import { applyBasePath } from "./paths";

test("a site-absolute path gains the base path", () => {
  assert.equal(applyBasePath("/blog", "/writing"), "/blog/writing");
  assert.equal(applyBasePath("/blog", "/photo.jpg"), "/blog/photo.jpg");
});

test("a blog served from the domain root is left untouched", () => {
  assert.equal(applyBasePath("", "/writing"), "/writing");
});

test("external links are never rewritten", () => {
  assert.equal(applyBasePath("/blog", "https://example.com/x"), "https://example.com/x");
  assert.equal(applyBasePath("/blog", "mailto:you@example.com"), "mailto:you@example.com");
});

test("a protocol-relative URL is not mistaken for a local path", () => {
  assert.equal(applyBasePath("/blog", "//cdn.example.com/x.png"), "//cdn.example.com/x.png");
});

test("anchors and relative paths are left alone", () => {
  assert.equal(applyBasePath("/blog", "#notes"), "#notes");
  assert.equal(applyBasePath("/blog", "photo.jpg"), "photo.jpg");
});

test("applying the prefix twice does not double it", () => {
  assert.equal(applyBasePath("/blog", "/blog/writing"), "/blog/writing");
  assert.equal(applyBasePath("/blog", "/blog"), "/blog");
});

test("a path that merely starts with the same letters is still prefixed", () => {
  assert.equal(applyBasePath("/blog", "/blogging"), "/blog/blogging");
});
