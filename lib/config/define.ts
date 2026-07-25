/**
 * The shape of site.config.ts — the one file a blog owner edits to make this
 * framework theirs. Everything here is authored by a human; `lib/config/resolve`
 * turns it into the fully-defaulted `ResolvedSite` the rest of the code reads.
 */

/** How a collection's entries are ordered on its index page and in the feed. */
export type SortOrder = "date-desc" | "date-asc" | "title";

export const SORT_ORDERS: readonly SortOrder[] = ["date-desc", "date-asc", "title"];

export interface Author {
  name: string;
  /** Shown in the RSS feed's author field when present. */
  email?: string;
  /** Linked from the footer when present. */
  url?: string;
}

export interface NavLink {
  label: string;
  /** A site-absolute path ("/about") or a full external URL. */
  href: string;
}

/**
 * A collection is a kind of writing — posts, notes, reviews. Declaring one here
 * generates its index page, an entry page per Markdown file, a nav item, and its
 * share of the feed. There is no route file to write.
 */
export interface CollectionConfig {
  /** Directory under content/ holding this collection's Markdown files. */
  name: string;
  /** Human-readable name, used in the nav and as the index page's heading. */
  label: string;
  /** URL base for the collection. Defaults to `/<name>`. */
  route?: string;
  /** One-line description shown under the heading on the index page. */
  description?: string;
  /** Entry order. Defaults to newest first. */
  sort?: SortOrder;
  /** Show this collection in the site navigation. Defaults to true. */
  nav?: boolean;
  /** Include this collection's entries in the RSS feed. Defaults to true. */
  feed?: boolean;
}

/**
 * The front page. Its words come from content/pages/home.md; these are the
 * knobs for what appears under them.
 */
export interface HomeConfig {
  /** How many recent entries to list. 0 hides the list entirely. Defaults to 5. */
  latest?: number;
  /** Which collections the list draws from, by `name`. Defaults to all of them. */
  collections?: string[];
}

export interface SiteConfig {
  /** The blog's name — the masthead, the browser tab, the feed title. */
  title: string;
  /** One sentence describing the blog, used for SEO and the feed. */
  description: string;
  author: Author;
  /**
   * Where the blog will live, as a full URL.
   *
   * This single field drives canonical URLs, the RSS feed, the sitemap, and —
   * critically — the base path every asset is served from. A GitHub Pages
   * project site lives under a subdirectory ("https://you.github.io/blog"),
   * and getting that wrong is what makes a deployed blog load without styles.
   */
  url: string;
  collections: CollectionConfig[];
  /** Front-page options. Its prose lives in content/pages/home.md. */
  home?: HomeConfig;
  /** Site navigation. Defaults to every collection with `nav` left on. */
  nav?: NavLink[];
  /** BCP 47 language tag for the <html lang> attribute. Defaults to "en". */
  locale?: string;
}

/**
 * Identity function that types a site.config.ts export. It does no work at
 * runtime; it exists so editors and agents get completion and inline docs while
 * writing the config.
 */
export function defineConfig(config: SiteConfig): SiteConfig {
  return config;
}
