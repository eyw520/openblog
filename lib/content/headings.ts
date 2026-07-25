import GithubSlugger, { slug } from "github-slugger";

/**
 * Finding the headings in a Markdown body.
 *
 * A long piece — a paper, a guide, a multi-part essay — wants a table of
 * contents, and the anchors it links to must match the ids the renderer puts on
 * the headings. The renderer uses rehype-slug, which is github-slugger; this
 * uses the same library rather than a lookalike, so the two cannot drift and
 * leave a contents list whose links all miss.
 */

export interface Heading {
  /** 2 for `##`, 3 for `###`. */
  level: number;
  /** The heading text, with Markdown emphasis stripped. */
  text: string;
  /** The anchor id, matching what rehype-slug-style ids would produce. */
  id: string;
}

/**
 * Headings between the given levels, in document order.
 *
 * `#` is excluded by default: the entry's title is already the page's only
 * first-level heading, and a body that adds another competes with it.
 *
 * Fenced code blocks are skipped, because a `# comment` in a shell sample is
 * not a heading and would otherwise appear in the contents.
 */
export function extractHeadings(body: string, minLevel = 2, maxLevel = 3): Heading[] {
  const headings: Heading[] = [];
  // A slugger instance carries the duplicate counter, exactly as rehype-slug's
  // does over one document.
  const slugger = new GithubSlugger();
  let inFence = false;

  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }

    const match = /^(#{1,6})\s+(.*\S)\s*$/.exec(line);
    if (!match?.[1] || !match[2]) {
      continue;
    }

    const level = match[1].length;
    if (level < minLevel || level > maxLevel) {
      continue;
    }

    const text = stripInlineMarkdown(match[2]);
    if (text.length === 0) {
      continue;
    }

    headings.push({ level, text, id: slugger.slug(text) || "section" });
  }

  return headings;
}

/** "A **bold** heading" -> "A bold heading". */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .trim();
}

/**
 * The anchor for a single heading, ignoring duplicates.
 *
 * Two sections can share a name — "Method" appears in every recipe — and the
 * suffixing that keeps them apart is handled by the slugger instance inside
 * `extractHeadings`, not here.
 */
export function headingSlug(text: string): string {
  return slug(text);
}
