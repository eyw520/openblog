import assert from "node:assert/strict";
import { test } from "node:test";

import { parseEntry, readingMinutes, type ParseEntryInput } from "./entry";

function input(overrides: Partial<ParseEntryInput> = {}): ParseEntryInput {
  return {
    collection: "posts",
    route: "/writing",
    slug: "first-light",
    data: { title: "First Light", date: "2026-03-01" },
    body: "A short body.",
    ...overrides
  };
}

function expectOk(result: ReturnType<typeof parseEntry>) {
  assert.equal(result.ok, true, result.ok ? "" : result.errors.join("\n"));
  return result.ok ? result.entry : assert.fail("unreachable");
}

test("a minimal entry parses and derives its href from the collection route", () => {
  const entry = expectOk(parseEntry(input()));
  assert.equal(entry.title, "First Light");
  assert.equal(entry.href, "/writing/first-light");
  assert.equal(entry.collection, "posts");
});

test("optional fields default rather than appearing as undefined", () => {
  const entry = expectOk(parseEntry(input()));
  assert.equal(entry.description, "");
  assert.equal(entry.draft, false);
  assert.equal(entry.updated, undefined);
});

test("a missing title names the file and shows the line to write", () => {
  const result = parseEntry(input({ data: { date: "2026-03-01" } }));
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.errors[0] ?? "", /^content\/posts\/first-light\.md — "title" is missing/);
  assert.match(result.ok ? "" : result.errors[0] ?? "", /title: My Post/);
});

test("a missing date is reported with an example date", () => {
  const result = parseEntry(input({ data: { title: "First Light" } }));
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.errors[0] ?? "", /"date" is missing/);
  assert.match(result.ok ? "" : result.errors[0] ?? "", /\d{4}-\d{2}-\d{2}/);
});

test("all problems in one file are reported together", () => {
  const result = parseEntry(input({ data: {} }));
  assert.equal(result.ok, false);
  assert.equal(result.ok ? 0 : result.errors.length, 2);
});

test("an unquoted YAML date arrives as a Date and is normalized to ISO", () => {
  const entry = expectOk(parseEntry(input({ data: { title: "T", date: new Date("2026-03-01T00:00:00Z") } })));
  assert.equal(entry.date, "2026-03-01");
});

test("a date written the American way is rejected, not silently misread", () => {
  const result = parseEntry(input({ data: { title: "T", date: "03/01/2026" } }));
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.errors[0] ?? "", /must be written as year-month-day/);
});

test("a day that does not exist is rejected rather than rolled forward", () => {
  const result = parseEntry(input({ data: { title: "T", date: "2026-02-31" } }));
  assert.equal(result.ok, false);
});

test("draft must be a boolean, since draft: \"true\" would silently publish", () => {
  const result = parseEntry(input({ data: { title: "T", date: "2026-03-01", draft: "true" } }));
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.errors[0] ?? "", /must be true or false/);
});

test("draft: true is carried through", () => {
  const entry = expectOk(parseEntry(input({ data: { title: "T", date: "2026-03-01", draft: true } })));
  assert.equal(entry.draft, true);
});

test("unknown frontmatter keys are ignored, so writers can keep their own notes", () => {
  const entry = expectOk(parseEntry(input({ data: { title: "T", date: "2026-03-01", mood: "bright" } })));
  assert.equal(entry.title, "T");
});

test("reading time is at least one minute and scales with length", () => {
  assert.equal(readingMinutes(""), 1);
  assert.equal(readingMinutes("word ".repeat(200)), 1);
  assert.equal(readingMinutes("word ".repeat(201)), 2);
});

test("code blocks do not inflate reading time", () => {
  const prose = "word ".repeat(100);
  const withCode = `${prose}\n\n\`\`\`\n${"token ".repeat(500)}\n\`\`\``;
  assert.equal(readingMinutes(withCode), readingMinutes(prose));
});
