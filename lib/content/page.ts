/**
 * Standalone pages — an about page, a colophon, a now page.
 *
 * A page is a Markdown file in content/pages/ that is not part of any
 * collection: it has no date, does not appear in an archive, and does not go
 * into the feed. Dropping the file in is the whole act of creating one, which
 * is why pages are discovered rather than declared in site.config.ts.
 */

export interface PageMeta {
  /** Filename without the extension, and the page's whole URL path. */
  slug: string;
  /** Site-absolute path, e.g. "/about". */
  href: string;
  title: string;
  /** SEO description; falls back to the site description when empty. */
  description: string;
  /** Whether the page appears in the site navigation. */
  nav: boolean;
  /** Navigation text; defaults to the title. */
  navLabel: string;
  /** Lower numbers sort earlier in the navigation. Defaults to 0. */
  navOrder: number;
}

export interface Page extends PageMeta {
  body: string;
}

export interface ParsePageInput {
  slug: string;
  data: Record<string, unknown>;
  body: string;
}

export type ParsePageResult = { ok: true; page: Page } | { ok: false; errors: string[] };

/** Validates and normalizes one page, with errors written for a non-programmer. */
export function parsePage(input: ParsePageInput): ParsePageResult {
  const { slug, data, body } = input;
  const file = `content/pages/${slug}.md`;
  const errors: string[] = [];

  const title = readString(data.title);
  if (title === undefined) {
    errors.push(`${file} — "title" is missing. Add this inside the --- block: title: About`);
  }

  if (data.nav !== undefined && typeof data.nav !== "boolean") {
    errors.push(`${file} — "nav" must be true or false, written without quotes.`);
  }

  if (data.navOrder !== undefined && typeof data.navOrder !== "number") {
    errors.push(`${file} — "navOrder" must be a number, for example navOrder: 1`);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const resolvedTitle = title ?? "";
  return {
    ok: true,
    page: {
      slug,
      href: `/${slug}`,
      title: resolvedTitle,
      description: readString(data.description) ?? "",
      nav: data.nav === true,
      navLabel: readString(data.navLabel) ?? resolvedTitle,
      navOrder: typeof data.navOrder === "number" ? data.navOrder : 0,
      body
    }
  };
}

/** Navigation order: by navOrder, then alphabetically so ties are not arbitrary. */
export function sortPagesForNav(pages: readonly PageMeta[]): PageMeta[] {
  return [...pages].sort((a, b) => a.navOrder - b.navOrder || a.navLabel.localeCompare(b.navLabel));
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
