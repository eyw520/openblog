import "server-only";

/**
 * The content reader as pages should import it. The `server-only` marker above
 * turns an accidental import from a client component into a build error rather
 * than a bundle that tries to read the filesystem in a browser.
 */
export {
  getEntry,
  getHomePage,
  getPage,
  listAllEntries,
  listEntries,
  listEntriesByTag,
  listLatestEntries,
  listNavLinks,
  listPageSlugs,
  listPages,
  listRelatedEntries,
  listSeriesParts,
  listSlugs,
  listTags,
  routeContext
} from "@/lib/content/read";
export type { Entry, EntryMeta, Page, PageMeta, SeriesPart, TagSummary } from "@/lib/content/read";
