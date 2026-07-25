import assert from "node:assert/strict";
import { test } from "node:test";

import { fieldLabel, formatFieldValue, parseFields, type FieldSchema } from "./fields";

const FILE = "content/recipes/soup.md";

function expectOk(result: ReturnType<typeof parseFields>) {
  assert.equal(result.ok, true, result.ok ? "" : result.errors.join("\n"));
  return result.ok ? result.fields : assert.fail("unreachable");
}

function expectErrors(result: ReturnType<typeof parseFields>): string[] {
  assert.equal(result.ok, false);
  return result.ok ? assert.fail("unreachable") : result.errors;
}

test("declared fields are read and typed", () => {
  const schema: FieldSchema = {
    servings: { type: "number" },
    cuisine: { type: "text" },
    vegetarian: { type: "boolean" },
    ingredients: { type: "list" }
  };
  const fields = expectOk(
    parseFields(FILE, schema, {
      servings: 4,
      cuisine: " Italian ",
      vegetarian: true,
      ingredients: ["flour", " water "]
    })
  );
  assert.deepEqual(fields, {
    servings: 4,
    cuisine: "Italian",
    vegetarian: true,
    ingredients: ["flour", "water"]
  });
});

test("undeclared frontmatter is left alone, so writers keep private notes", () => {
  const fields = expectOk(parseFields(FILE, { servings: { type: "number" } }, { servings: 2, mood: "tired" }));
  assert.deepEqual(Object.keys(fields), ["servings"]);
});

test("an optional field that is absent is simply absent", () => {
  const fields = expectOk(parseFields(FILE, { cuisine: { type: "text" } }, {}));
  assert.deepEqual(fields, {});
});

test("a missing required field names the file and shows the line to add", () => {
  const errors = expectErrors(parseFields(FILE, { servings: { type: "number", required: true } }, {}));
  assert.equal(errors.length, 1);
  assert.match(errors[0] ?? "", /^content\/recipes\/soup\.md — "servings" is missing/);
  assert.match(errors[0] ?? "", /servings: 4/);
});

test("a quoted number is rejected rather than silently coerced", () => {
  const errors = expectErrors(parseFields(FILE, { servings: { type: "number" } }, { servings: "4" }));
  assert.match(errors[0] ?? "", /in quotes, which makes it text rather than a number/);
});

test("a choice outside its options lists the ones that work", () => {
  const schema: FieldSchema = { difficulty: { type: "choice", options: ["easy", "medium", "hard"] } };
  const errors = expectErrors(parseFields(FILE, schema, { difficulty: "brutal" }));
  assert.match(errors[0] ?? "", /must be one of: easy, medium, hard/);
});

test("a date field accepts both YAML spellings and normalizes them", () => {
  const schema: FieldSchema = { visited: { type: "date" } };
  assert.equal(expectOk(parseFields(FILE, schema, { visited: "2026-03-01" })).visited, "2026-03-01");
  assert.equal(
    expectOk(parseFields(FILE, schema, { visited: new Date("2026-03-01T00:00:00Z") })).visited,
    "2026-03-01"
  );
});

test("an impossible date is rejected", () => {
  const errors = expectErrors(parseFields(FILE, { visited: { type: "date" } }, { visited: "2026-02-31" }));
  assert.match(errors[0] ?? "", /year-month-day/);
});

test("a list of numbers is accepted and stringified, so coordinates work", () => {
  const fields = expectOk(parseFields(FILE, { coordinates: { type: "list" } }, { coordinates: [51.5, -0.12] }));
  assert.deepEqual(fields.coordinates, ["51.5", "-0.12"]);
});

test("a list containing something unusable is rejected whole", () => {
  const errors = expectErrors(parseFields(FILE, { tags: { type: "list" } }, { tags: ["ok", {}] }));
  assert.match(errors[0] ?? "", /must be a list of words or numbers/);
});

test("a value that is not a list at all is rejected", () => {
  const errors = expectErrors(parseFields(FILE, { tags: { type: "list" } }, { tags: "one" }));
  assert.equal(errors.length, 1);
});

test("every problem in a file is reported at once", () => {
  const schema: FieldSchema = {
    servings: { type: "number", required: true },
    difficulty: { type: "choice", options: ["easy"] },
    ingredients: { type: "list", required: true }
  };
  assert.equal(expectErrors(parseFields(FILE, schema, { difficulty: "hard" })).length, 3);
});

test("an empty string counts as absent rather than as a value", () => {
  const errors = expectErrors(parseFields(FILE, { cuisine: { type: "text", required: true } }, { cuisine: "" }));
  assert.match(errors[0] ?? "", /is missing/);
});

test("labels are humanized from the field name unless given", () => {
  assert.equal(fieldLabel("prepMinutes", { type: "number" }), "Prep minutes");
  assert.equal(fieldLabel("cook_time", { type: "number" }), "Cook time");
  assert.equal(fieldLabel("doi", { type: "text", label: "DOI" }), "DOI");
});

test("values format for display rather than as raw data", () => {
  assert.equal(formatFieldValue(["flour", "water"]), "flour, water");
  assert.equal(formatFieldValue(true), "Yes");
  assert.equal(formatFieldValue(4), "4");
});
