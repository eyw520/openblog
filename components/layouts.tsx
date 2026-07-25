import type { ResolvedCollection } from "@/lib/config";
import type { Entry, EntryMeta } from "@/lib/content/entry";

import { CollectionGrid } from "./content/CollectionGrid";
import { CollectionIndex } from "./content/CollectionIndex";
import { EntryArticle } from "./content/EntryArticle";
import { RecipeArticle } from "./content/RecipeArticle";

/**
 * YOUR LAYOUTS. The second extension point, next to components/registry.tsx.
 *
 * A layout renders one entry from top to bottom. Most collections never need
 * their own: declaring `fields` on a collection already shows them under the
 * title. Write a layout when the presentation itself matters — ingredients
 * beside a method, a paper's abstract above its citation, a trip's map.
 *
 * To add one:
 *   1. Write a component in components/content/ taking EntryLayoutProps.
 *   2. Add it here.
 *   3. Add its name to ENTRY_LAYOUTS in lib/config/define.ts, so a typo in
 *      site.config.ts is caught by `make check` instead of showing a wrong page.
 *   4. Point a collection at it: `layout: "yours"`.
 */

export interface EntryLayoutProps {
  entry: Entry;
  collection: ResolvedCollection;
  locale: string;
  /** The entry listed above this one in the archive, if any. */
  previous?: EntryMeta;
  /** The entry listed below it, if any. */
  next?: EntryMeta;
}

export const entryLayouts = {
  default: EntryArticle,
  recipe: RecipeArticle
};

/** What an archive layout is handed. */
export interface IndexLayoutProps {
  collection: ResolvedCollection;
  entries: EntryMeta[];
  locale: string;
}

/**
 * How a collection's archive is arranged. Same pairing rule as above: a name
 * here and in INDEX_LAYOUTS in lib/config/define.ts.
 */
export const indexLayouts = {
  list: CollectionIndex,
  grid: CollectionGrid
};
