// Relative, not "@/site.config": next.config.ts loads this module outside
// webpack, where the path alias does not exist.
import rawConfig from "../../site.config";
import { type ResolvedCollection, type ResolvedSite, resolveConfig } from "./resolve";
import { validateConfig } from "./validate";

export type { ResolvedCollection, ResolvedSite };
export { defineConfig } from "./define";
export type { Author, CollectionConfig, NavLink, SiteConfig, SortOrder } from "./define";

// Validation runs at import time, so a broken site.config.ts fails the build
// with a readable list of problems instead of rendering an empty or wrong page.
// Every route imports `site`, which makes this check unavoidable in practice.
const errors = validateConfig(rawConfig);

if (errors.length > 0) {
  throw new Error(
    ["Your site.config.ts needs attention:", "", ...errors.map((error) => `  • ${error}`), ""].join("\n")
  );
}

/** The blog's configuration, with defaults applied. Import this, not site.config.ts. */
export const site: ResolvedSite = resolveConfig(rawConfig);

/** Look up a declared collection by its `name`, or undefined if there is none. */
export function findCollection(name: string): ResolvedCollection | undefined {
  return site.collections.find((collection) => collection.name === name);
}
