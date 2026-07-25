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
  listLatestEntries,
  listNavLinks,
  listPageSlugs,
  listPages,
  listSlugs
} from "@/lib/content/read";
export type { Entry, EntryMeta, Page, PageMeta } from "@/lib/content/read";
