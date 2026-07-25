/**
 * Comparing what the source said with what was imported.
 *
 * Everything here is pure, because this is where the loop's verdict actually
 * comes from: if the fidelity score is wrong, an agent either declares a
 * half-imported blog finished or grinds against a gate it cannot pass.
 */

/** Entities common enough in blog HTML to be worth resolving by hand. */
const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“"
};

export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-zA-Z]+);/g, (whole, name: string) => ENTITIES[name.toLowerCase()] ?? whole);
}

/**
 * Readable text from a fragment of HTML.
 *
 * Script and style contents are dropped rather than flattened — leaving them in
 * would pad the source's word count with code and quietly make the fidelity
 * score easier to pass.
 */
export function htmlToText(html: string): string {
  // Entities are decoded first, because Atom feeds escape their whole body —
  // `&lt;p&gt;` is markup that has not been spelled out yet, and stripping tags
  // before decoding would leave it in the text as literal angle brackets.
  //
  // The tag pattern then requires a letter after the bracket, so decoding first
  // cannot swallow ordinary prose like "&lt;3 minutes &gt; the estimate".
  return collapse(
    decodeEntities(html)
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|li|h[1-6]|blockquote|pre)>/gi, "\n")
      .replace(/<\/?[a-zA-Z][^>]*>/g, " ")
  );
}

/** Readable text from a Markdown body, so the two sides compare like with like. */
export function markdownToText(markdown: string): string {
  const withoutFrontmatter = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  return collapse(
    htmlToText(
      withoutFrontmatter
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/~~~[\s\S]*?~~~/g, " ")
        .replace(/`([^`]*)`/g, "$1")
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/^\s{0,3}#{1,6}\s+/gm, "")
        .replace(/^\s{0,3}>\s?/gm, "")
        .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, "")
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(\*|_)(.*?)\1/g, "$2")
    )
  );
}

/** Lowercased words, punctuation removed — the unit fidelity is measured in. */
export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[‘’“”]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

/**
 * How much of the source's wording survived, from 0 to 1.
 *
 * Multiset recall: each word counts as many times as the source used it, and
 * only as many times as the import repeats it. That is deliberately one-sided —
 * an import may add words (a heading, an attribution) without penalty, but it
 * cannot drop them. Dropping is the failure this loop exists to catch; a
 * truncated post scores low without needing a separate length rule.
 *
 * An empty source scores 1: there was nothing to lose.
 */
export function fidelity(source: string, imported: string): number {
  const sourceWords = normalizeWords(source);
  if (sourceWords.length === 0) {
    return 1;
  }

  const available = new Map<string, number>();
  for (const word of normalizeWords(imported)) {
    available.set(word, (available.get(word) ?? 0) + 1);
  }

  let matched = 0;
  for (const word of sourceWords) {
    const remaining = available.get(word) ?? 0;
    if (remaining > 0) {
      available.set(word, remaining - 1);
      matched += 1;
    }
  }

  return matched / sourceWords.length;
}

/**
 * The run of source words the import is missing, for the failure message.
 * Knowing *which* paragraph went astray is the difference between a fixable
 * report and a number.
 */
export function missingExcerpt(source: string, imported: string, words = 12): string {
  const sourceWords = normalizeWords(source);
  const available = new Set(normalizeWords(imported));

  const start = sourceWords.findIndex((word) => !available.has(word));
  if (start === -1) {
    return "";
  }
  return sourceWords.slice(start, start + words).join(" ");
}

function collapse(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}
