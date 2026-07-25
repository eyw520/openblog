import "server-only";

/**
 * The content reader as pages should import it. The `server-only` marker above
 * turns an accidental import from a client component into a build error rather
 * than a bundle that tries to read the filesystem in a browser.
 */
export { getEntry, listAllEntries, listEntries, listSlugs } from "@/lib/content/read";
export type { Entry, EntryMeta } from "@/lib/content/read";
