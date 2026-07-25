import type { ResolvedCollection, ResolvedSite } from "@/lib/config";
import type { Entry } from "@/lib/content/entry";

/**
 * schema.org JSON-LD for an entry.
 *
 * This is the markup search engines read to show a post as something richer
 * than a blue link — a recipe with its time and servings, an article with its
 * author and date. It is invisible on the page and easy to forget, which is
 * exactly why the framework emits it rather than leaving it to each blog.
 *
 * Built as plain data and serialized by the caller, so what goes in the page can
 * be asserted directly in tests.
 */

/** ISO 8601 duration, which is the only form schema.org accepts for a time. */
export function minutesToDuration(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes));
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  if (hours === 0) {
    return `PT${rest}M`;
  }
  return rest === 0 ? `PT${hours}H` : `PT${hours}H${rest}M`;
}

/**
 * The structured description of one entry.
 *
 * A collection using the recipe layout is described as a Recipe; everything
 * else is a BlogPosting. The layout is the signal because it is the same thing
 * the blog owner already chose — no second setting to keep in step.
 */
export function entryStructuredData(
  site: ResolvedSite,
  collection: ResolvedCollection,
  entry: Entry
): Record<string, unknown> {
  const url = `${site.url}${entry.href}`;
  const author = { "@type": "Person", name: entry.author ?? site.author.name };

  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": collection.layout === "recipe" ? "Recipe" : "BlogPosting",
    mainEntityOfPage: url,
    url,
    headline: entry.title,
    datePublished: entry.date,
    author,
    publisher: { "@type": "Person", name: site.author.name },
    inLanguage: site.locale
  };

  if (entry.description) {
    base.description = entry.description;
  }
  if (entry.updated) {
    base.dateModified = entry.updated;
  }
  if (entry.image) {
    base.image = absolute(site, entry.image);
  }
  if (entry.tags.length > 0) {
    base.keywords = entry.tags.join(", ");
  }

  return base["@type"] === "Recipe" ? { ...base, ...recipeFields(entry) } : base;
}

/** The Recipe-specific properties, taken from whatever fields the entry has. */
function recipeFields(entry: Entry): Record<string, unknown> {
  const fields: Record<string, unknown> = { name: entry.title };

  const ingredients = entry.fields.ingredients;
  if (Array.isArray(ingredients) && ingredients.length > 0) {
    fields.recipeIngredient = ingredients;
  }

  const servings = entry.fields.servings;
  if (typeof servings === "number") {
    fields.recipeYield = String(servings);
  }

  const prep = entry.fields.prepMinutes;
  const cook = entry.fields.cookMinutes;
  if (typeof prep === "number") {
    fields.prepTime = minutesToDuration(prep);
  }
  if (typeof cook === "number") {
    fields.cookTime = minutesToDuration(cook);
  }
  if (typeof prep === "number" && typeof cook === "number") {
    fields.totalTime = minutesToDuration(prep + cook);
  }

  return fields;
}

/** A blog-relative path as a full URL; an external URL is left alone. */
function absolute(site: ResolvedSite, path: string): string {
  return /^https?:\/\//.test(path) ? path : `${site.url}${path}`;
}
