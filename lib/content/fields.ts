import { isCalendarDate, toCalendarDate, todayIso } from "./dates";

/**
 * Fields a collection declares for itself.
 *
 * A recipe has servings and ingredients; a trip has a country and coordinates;
 * a paper has a DOI and a status. openblog does not know about any of those, and
 * should not — instead a collection declares the shape of its own frontmatter in
 * site.config.ts, and every entry in it is checked against that shape with the
 * same plain-English errors the built-in fields get.
 *
 * This is what lets one framework serve a food blog and a research blog without
 * either of them editing framework code.
 */

export type FieldType = "text" | "number" | "boolean" | "date" | "list" | "choice";

export const FIELD_TYPES: readonly FieldType[] = ["text", "number", "boolean", "date", "list", "choice"];

/** A field's value once validated. `list` is always a list of strings. */
export type FieldValue = string | number | boolean | string[];

export interface FieldDefinition {
  type: FieldType;
  /** Entries missing a required field fail the build. Defaults to false. */
  required?: boolean;
  /** The permitted values. Required when `type` is "choice", ignored otherwise. */
  options?: string[];
  /** How the field is labelled when shown. Defaults to a readable form of its name. */
  label?: string;
  /** Set false to keep a field out of the automatic metadata list. Defaults to true. */
  display?: boolean;
}

export type FieldSchema = Record<string, FieldDefinition>;

export type ParseFieldsResult =
  | { ok: true; fields: Record<string, FieldValue> }
  | { ok: false; errors: string[] };

/**
 * Validates one entry's declared fields.
 *
 * Only declared fields are read; anything else in the frontmatter is left alone,
 * so a writer can keep private notes there. Every problem is collected rather
 * than thrown on, so one run reports everything wrong with the file.
 */
export function parseFields(
  file: string,
  schema: FieldSchema,
  data: Record<string, unknown>
): ParseFieldsResult {
  const errors: string[] = [];
  const fields: Record<string, FieldValue> = {};

  for (const [name, definition] of Object.entries(schema)) {
    const raw = data[name];

    if (raw === undefined || raw === null || raw === "") {
      if (definition.required === true) {
        errors.push(`${file} — "${name}" is missing. Add a line inside the --- block: ${example(name, definition)}`);
      }
      continue;
    }

    const parsed = coerce(raw, definition);
    if (parsed === null) {
      errors.push(
        `${file} — "${name}" ${describeProblem(raw, definition)} ` +
          `Write it as: ${example(name, definition)}`
      );
      continue;
    }
    fields[name] = parsed;
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, fields };
}

/** The value in the shape the definition promises, or null if it does not fit. */
function coerce(raw: unknown, definition: FieldDefinition): FieldValue | null {
  switch (definition.type) {
    case "text":
      return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;

    case "number":
      // Deliberately not accepting "4": a quoted number in frontmatter is
      // usually a mistake, and silently coercing it hides the real error.
      return typeof raw === "number" && Number.isFinite(raw) ? raw : null;

    case "boolean":
      return typeof raw === "boolean" ? raw : null;

    case "date":
      return toCalendarDate(raw);

    case "list":
      return coerceList(raw);

    case "choice": {
      const options = definition.options ?? [];
      return typeof raw === "string" && options.includes(raw.trim()) ? raw.trim() : null;
    }
  }
}

/** A list of non-empty strings; numbers are allowed and stringified. */
function coerceList(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }
  const items: string[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim().length > 0) {
      items.push(item.trim());
    } else if (typeof item === "number" && Number.isFinite(item)) {
      items.push(String(item));
    } else {
      return null;
    }
  }
  return items;
}

function describeProblem(raw: unknown, definition: FieldDefinition): string {
  if (definition.type === "choice") {
    return `reads "${String(raw)}" but must be one of: ${(definition.options ?? []).join(", ")}.`;
  }
  if (definition.type === "date") {
    return `reads "${String(raw)}" but must be a date written year-month-day, like ${todayIso()}.`;
  }
  if (definition.type === "list") {
    return "must be a list of words or numbers.";
  }
  if (definition.type === "number" && typeof raw === "string") {
    return `reads "${raw}" in quotes, which makes it text rather than a number.`;
  }
  return `should be ${article(definition.type)} ${definition.type}, but reads "${String(raw)}".`;
}

/** A line the writer can paste into their frontmatter. */
function example(name: string, definition: FieldDefinition): string {
  switch (definition.type) {
    case "text":
      return `${name}: some words`;
    case "number":
      return `${name}: 4`;
    case "boolean":
      return `${name}: true`;
    case "date":
      return `${name}: ${todayIso()}`;
    case "list":
      return `${name}: [one, two]`;
    case "choice":
      return `${name}: ${definition.options?.[0] ?? "one-of-the-options"}`;
  }
}

function article(type: string): string {
  return "aeiou".includes(type[0] ?? "") ? "an" : "a";
}

/** "prepMinutes" -> "Prep minutes", unless the definition names it outright. */
export function fieldLabel(name: string, definition: FieldDefinition): string {
  if (definition.label !== undefined && definition.label.trim().length > 0) {
    return definition.label;
  }
  const spaced = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** A field's value as display text. Lists read as a sentence, not as JSON. */
export function formatFieldValue(value: FieldValue): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

/** True if the schema declares this field and it holds a usable date. */
export function isDateField(definition: FieldDefinition, value: FieldValue): value is string {
  return definition.type === "date" && typeof value === "string" && isCalendarDate(value);
}
