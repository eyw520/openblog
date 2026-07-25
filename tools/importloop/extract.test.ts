import assert from "node:assert/strict";
import { test } from "node:test";

import { mainContent, parseRobots } from "./extract";

test("an article element is preferred over everything around it", () => {
  const html = "<body><nav>Menu</nav><article>The post.</article><footer>Foot</footer></body>";
  assert.equal(mainContent(html), "The post.");
});

test("main is used when there is no article", () => {
  assert.equal(mainContent("<body><main>The post.</main></body>"), "The post.");
});

test("the body is the last resort", () => {
  assert.equal(mainContent("<html><body>Everything.</body></html>"), "Everything.");
});

test("a fragment with none of them is returned whole", () => {
  assert.equal(mainContent("<p>Just this.</p>"), "<p>Just this.</p>");
});

test("attributes on the wrapper do not prevent a match", () => {
  assert.equal(mainContent('<article class="post" id="x">Body.</article>'), "Body.");
});

test("disallow rules for everyone are collected", () => {
  const robots = "User-agent: *\nDisallow: /admin\nDisallow: /private";
  assert.deepEqual(parseRobots(robots), ["/admin", "/private"]);
});

test("rules aimed at another crawler are not ours to obey", () => {
  const robots = "User-agent: BadBot\nDisallow: /\n\nUser-agent: *\nDisallow: /admin";
  assert.deepEqual(parseRobots(robots), ["/admin"]);
});

test("a site that disallows everyone is heard", () => {
  assert.deepEqual(parseRobots("User-agent: *\nDisallow: /"), ["/"]);
});

test("an empty Disallow means no restriction, not a block on everything", () => {
  assert.deepEqual(parseRobots("User-agent: *\nDisallow:"), []);
});

test("comments and blank lines are ignored", () => {
  const robots = "# a note\nUser-agent: *  # everyone\nDisallow: /admin # the admin area\n\n";
  assert.deepEqual(parseRobots(robots), ["/admin"]);
});

test("field names are matched regardless of case", () => {
  assert.deepEqual(parseRobots("USER-AGENT: *\nDISALLOW: /x"), ["/x"]);
});

test("a sitemap line is not mistaken for a rule", () => {
  const robots = "User-agent: *\nDisallow: /admin\nSitemap: https://example.com/sitemap.xml";
  assert.deepEqual(parseRobots(robots), ["/admin"]);
});

test("no robots rules at all yields none", () => {
  assert.deepEqual(parseRobots(""), []);
  assert.deepEqual(parseRobots("Sitemap: https://example.com/sitemap.xml"), []);
});
