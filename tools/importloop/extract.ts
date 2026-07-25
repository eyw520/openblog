/**
 * Reading things out of a fetched page.
 *
 * Kept apart from snapshot.ts, which runs as a script the moment it is
 * imported: these two need testing, and importing them from snapshot.ts would
 * have started a crawl to do it.
 */

/**
 * The part of a page that is the post.
 *
 * Deliberately simple: `<article>`, then `<main>`, then the whole body. A
 * cleverer extractor would guess more often and be wrong more quietly — and
 * when this guesses badly the fidelity gate fails loudly, which is the outcome
 * we want. Prefer a feed with full content over relying on this.
 */
export function mainContent(html: string): string {
  return (
    /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(html)?.[1] ??
    /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ??
    /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ??
    html
  );
}

/**
 * The Disallow paths a general crawler must respect.
 *
 * Only the `User-agent: *` group is read. A site that singles out a named
 * crawler is not talking about us, and a site that disallows everyone is —
 * reading this correctly is the difference between being a good guest and
 * hammering someone's server after they asked you not to.
 */
export function parseRobots(body: string): string[] {
  const disallowed: string[] = [];
  let appliesToUs = false;

  for (const raw of body.split("\n")) {
    const line = raw.split("#")[0]?.trim() ?? "";
    if (line.length === 0) {
      continue;
    }
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      appliesToUs = value === "*";
    } else if (appliesToUs && field === "disallow" && value.length > 0) {
      disallowed.push(value);
    }
  }
  return disallowed;
}
