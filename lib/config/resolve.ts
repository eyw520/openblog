import type { FieldSchema } from "../content/fields";
import type {
  Author,
  CollectionConfig,
  EntryLayout,
  IndexLayout,
  NavLink,
  SiteConfig,
  SocialLink,
  SortOrder,
  ThemePreset
} from "./define";

/** A collection with every optional field filled in. */
export interface ResolvedCollection {
  name: string;
  label: string;
  route: string;
  description: string;
  sort: SortOrder;
  nav: boolean;
  feed: boolean;
  fields: FieldSchema;
  layout: EntryLayout;
  indexLayout: IndexLayout;
  toc: boolean;
}

export interface ResolvedTheme {
  preset: ThemePreset;
}

export interface ResolvedDisplay {
  readingTime: boolean;
  copyright: string;
}

export interface ResolvedComments {
  provider: "giscus";
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  /** Collection names that show comments. */
  collections: string[];
}

export interface ResolvedTags {
  route: string;
  label: string;
  nav: boolean;
}

export interface ResolvedHome {
  latest: number;
  /** Collection names, already checked against what is declared. */
  collections: string[];
}

/** The site config the rest of the codebase reads: no optionals, no guessing. */
export interface ResolvedSite {
  title: string;
  description: string;
  author: Author;
  locale: string;
  /** Full canonical URL, no trailing slash: "https://you.github.io/blog". */
  url: string;
  /** Scheme and host only: "https://you.github.io". */
  origin: string;
  /**
   * The subdirectory the site is served from, without a trailing slash — "" for
   * a domain root, "/blog" for a GitHub Pages project site. Next needs this to
   * prefix every asset URL, which is why it is derived rather than asked for.
   */
  basePath: string;
  collections: ResolvedCollection[];
  home: ResolvedHome;
  tags: ResolvedTags;
  /** Null when no comment provider is configured. */
  comments: ResolvedComments | null;
  social: SocialLink[];
  theme: ResolvedTheme;
  display: ResolvedDisplay;
  nav: NavLink[];
  /**
   * True when site.config.ts listed `nav` by hand. The navigation builder uses
   * it to decide whether pages may append themselves: an owner who wrote the
   * menu out asked for exactly that menu, and a new file should not edit it.
   */
  navExplicit: boolean;
}

/**
 * Fills in defaults and derives everything that can be derived. Pure: the same
 * config always resolves to the same result, which is what makes it testable
 * without a filesystem or a build.
 */
export function resolveConfig(config: SiteConfig): ResolvedSite {
  const { origin, basePath } = splitUrl(config.url);
  const collections = config.collections.map(resolveCollection);

  return {
    title: config.title,
    description: config.description,
    author: config.author,
    locale: config.locale ?? "en",
    url: basePath === "" ? origin : `${origin}${basePath}`,
    origin,
    basePath,
    collections,
    home: {
      latest: config.home?.latest ?? 5,
      collections: config.home?.collections ?? collections.map((collection) => collection.name)
    },
    tags: {
      route: stripTrailingSlash(config.tags?.route ?? "/tags"),
      label: config.tags?.label ?? "Tags",
      nav: config.tags?.nav ?? false
    },
    comments: config.comments
      ? {
          ...config.comments,
          collections: config.comments.collections ?? collections.map((collection) => collection.name)
        }
      : null,
    social: config.social ?? [],
    theme: { preset: config.theme?.preset ?? "ink" },
    display: {
      readingTime: config.display?.readingTime ?? true,
      copyright: config.display?.copyright ?? ""
    },
    nav: config.nav ?? defaultNav(collections),
    navExplicit: config.nav !== undefined
  };
}

function resolveCollection(collection: CollectionConfig): ResolvedCollection {
  return {
    name: collection.name,
    label: collection.label,
    route: stripTrailingSlash(collection.route ?? `/${collection.name}`),
    description: collection.description ?? "",
    sort: collection.sort ?? "date-desc",
    nav: collection.nav ?? true,
    feed: collection.feed ?? true,
    fields: collection.fields ?? {},
    layout: collection.layout ?? "default",
    indexLayout: collection.indexLayout ?? "list",
    toc: collection.toc ?? false
  };
}

/** Nav defaults to the collections that asked to be in it, in declared order. */
function defaultNav(collections: ResolvedCollection[]): NavLink[] {
  return collections
    .filter((collection) => collection.nav)
    .map(({ label, route }) => ({ label, href: route }));
}

/**
 * Splits a site URL into its origin and its base path. An unparseable URL is
 * reported by `validateConfig`, so this falls back rather than throwing twice.
 */
function splitUrl(url: string): { origin: string; basePath: string } {
  try {
    const parsed = new URL(url);
    return { origin: parsed.origin, basePath: stripTrailingSlash(parsed.pathname) };
  } catch {
    return { origin: "", basePath: "" };
  }
}

/** "/blog/" -> "/blog"; "/" -> "". */
function stripTrailingSlash(value: string): string {
  const trimmed = value.replace(/\/+$/, "");
  return trimmed === "/" ? "" : trimmed;
}
