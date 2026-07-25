import type { FieldSchema } from "../content/fields";

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
  /**
   * Extra frontmatter this collection's entries carry, declared once here and
   * checked on every file. A recipes collection might declare servings and
   * ingredients; a travels collection a country and coordinates.
   *
   * Declared fields are validated, exposed to layouts as `entry.fields`, and
   * listed under the title automatically — no component work is needed to make
   * them appear.
   */
  fields?: FieldSchema;
  /**
   * Which layout renders this collection's entries. Must be a key of
   * `entryLayouts` in components/layouts.tsx and a name in ENTRY_LAYOUTS below.
   * Defaults to "default".
   */
  layout?: EntryLayout;
  /**
   * How this collection's archive page is arranged. Defaults to "list".
   * A "grid" archive shows each entry's cover image.
   */
  indexLayout?: IndexLayout;
  /**
   * Show a contents list on entries with enough headings. Defaults to false;
   * useful for long-form collections like papers or guides.
   */
  toc?: boolean;
}

/**
 * The entry layouts that ship. Adding one means a component in
 * components/layouts.tsx and a name here, so a typo is caught by the gate
 * rather than showing the wrong page.
 */
export type EntryLayout = "default" | "recipe";

export const ENTRY_LAYOUTS: readonly EntryLayout[] = ["default", "recipe"];

/**
 * How a collection's archive is arranged. "list" is the dated index; "grid"
 * shows cover images, which is what a recipe or photography archive wants.
 * Adding one means a component in components/layouts.tsx and a name here.
 */
export type IndexLayout = "list" | "grid";

export const INDEX_LAYOUTS: readonly IndexLayout[] = ["list", "grid"];

/**
 * Tag browsing. Tags themselves need no configuration — add `tags:` to a post's
 * frontmatter and the tag pages appear. This only adjusts where they live.
 */
export interface TagsConfig {
  /** Base route for tag pages. Defaults to "/tags". */
  route?: string;
  /** The heading on the tag index. Defaults to "Tags". */
  label?: string;
  /** Show a link to the tag index in the navigation. Defaults to false. */
  nav?: boolean;
}

/**
 * Reader comments, powered by GitHub Discussions through giscus.
 *
 * Comments are off until this block is present. Getting the four identifiers is
 * a one-time visit to https://giscus.app, which reads them off your repository
 * after you enable Discussions and install the giscus app.
 *
 * Readers need a GitHub account to comment. That is the trade for a comment
 * system that costs nothing, stores no data of yours, and cannot go down
 * separately from GitHub itself.
 */
export interface CommentsConfig {
  /** Only giscus is supported today; named so other providers can be added. */
  provider: "giscus";
  /** The repository holding the discussions, as "owner/name". */
  repo: string;
  /** The repository's node id, from giscus.app. */
  repoId: string;
  /** The discussion category to post into, e.g. "Announcements". */
  category: string;
  /** That category's node id, from giscus.app. */
  categoryId: string;
  /** Which collections show comments, by `name`. Defaults to all of them. */
  collections?: string[];
}

/** A way to reach you, shown in the footer. */
export interface SocialLink {
  /** The visible text, e.g. "Email", "GitHub", "Mastodon". */
  label: string;
  /** A full URL, a "mailto:" address, or a path on this blog. */
  href: string;
}

/**
 * The shipped colour palettes, defined in app/globals.css. Adding your own
 * means adding a block there and a name here, so a typo is still caught.
 */
export type ThemePreset = "ink" | "rust" | "forest";

export const THEME_PRESETS: readonly ThemePreset[] = ["ink", "rust", "forest"];

export interface ThemeConfig {
  /** Which palette to use. Defaults to "ink". */
  preset?: ThemePreset;
}

/** Small presentation choices that do not warrant editing a component. */
export interface DisplayConfig {
  /** Show "N min read" on a post. Defaults to true. */
  readingTime?: boolean;
  /** A line at the foot of every page, e.g. "© 2026 Ada Lovelace". */
  copyright?: string;
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
  /** Where tag pages live. Tags work without this; it only moves them. */
  tags?: TagsConfig;
  /** Reader comments. Omit this and posts have none. */
  comments?: CommentsConfig;
  /** Ways to reach you, listed in the footer. */
  social?: SocialLink[];
  /** Which colour palette the blog uses. */
  theme?: ThemeConfig;
  /** Presentation choices that would otherwise mean editing a component. */
  display?: DisplayConfig;
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
