import assert from "node:assert/strict";
import { test } from "node:test";

import { decodeEntities, fidelity, htmlToText, markdownToText, missingExcerpt, normalizeWords } from "./text";

test("tags become spaces and block ends become line breaks", () => {
  assert.equal(htmlToText("<p>One</p><p>Two</p>"), "One\nTwo");
});

test("script and style contents are dropped, not flattened into the text", () => {
  const html = "<p>Real</p><script>var x = 1;</script><style>.a{color:red}</style>";
  assert.equal(htmlToText(html), "Real");
});

test("entities are decoded, including numeric ones", () => {
  assert.equal(decodeEntities("Salt &amp; Light"), "Salt & Light");
  assert.equal(decodeEntities("&#8212;"), "—");
  assert.equal(decodeEntities("&#x2014;"), "—");
  assert.equal(decodeEntities("&unknownentity;"), "&unknownentity;");
});

test("markdown frontmatter is not counted as body text", () => {
  const md = "---\ntitle: A post\ndate: 2026-01-01\n---\n\nThe body.";
  assert.equal(markdownToText(md), "The body.");
});

test("code fences are dropped so a sample cannot pad the score", () => {
  assert.equal(markdownToText("Before\n\n```js\nconst x = 1;\n```\n\nAfter"), "Before\nAfter");
});

test("markdown syntax is stripped but its words are kept", () => {
  assert.equal(markdownToText("## A **bold** [link](/x) and _more_"), "A bold link and more");
});

test("identical text scores one", () => {
  assert.equal(fidelity("The tide was out.", "The tide was out."), 1);
});

test("a truncated import scores near the fraction it kept", () => {
  const source = "one two three four five six seven eight nine ten";
  assert.equal(fidelity(source, "one two three four five"), 0.5);
});

test("added words cost nothing, since an import may gain a heading", () => {
  assert.equal(fidelity("the tide", "Notes. The tide was out."), 1);
});

test("repetition is counted, so one mention cannot stand in for three", () => {
  assert.equal(fidelity("tide tide tide", "tide"), 1 / 3);
});

test("punctuation and case do not affect the score", () => {
  assert.equal(fidelity("The tide, was out!", "the tide was out"), 1);
});

test("curly and straight quotes are treated as the same word", () => {
  assert.equal(fidelity("it’s late", "it's late"), 1);
});

test("an empty source scores one, having nothing to lose", () => {
  assert.equal(fidelity("", "anything"), 1);
});

test("an empty import of a real source scores zero", () => {
  assert.equal(fidelity("some words here", ""), 0);
});

test("the missing excerpt points at where the text went astray", () => {
  const source = "the tide was out and the harbour was a field of mud";
  assert.match(missingExcerpt(source, "the tide was out"), /^and/);
});

test("nothing missing yields no excerpt", () => {
  assert.equal(missingExcerpt("the tide", "the tide was out"), "");
});

test("words are split on whitespace and punctuation alike", () => {
  assert.deepEqual(normalizeWords("Well—now, then."), ["well", "now", "then"]);
});

test("escaped markup is decoded and then stripped, as Atom feeds require", () => {
  assert.equal(htmlToText("&lt;p&gt;Body text.&lt;/p&gt;"), "Body text.");
});

test("prose that merely looks like a tag survives decoding", () => {
  assert.equal(htmlToText("under &lt;3 minutes &gt; the estimate"), "under <3 minutes > the estimate");
});
