import fs from "node:fs";
import path from "node:path";

/**
 * The content gate.
 *
 * Three failures can reach a deployed blog without anything crashing: a
 * site.config.ts that does not mean what its author thought, a post whose
 * frontmatter is malformed, and a link to a page that no longer exists. The
 * first two are caught by importing the real config and the real reader — the
 * same code the build uses, so this can never drift from it. The third is
 * checked here.
 *
 * Run by `make check`, and again by `npm run build` before anything is written.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

// Markdown `](/path)` with an optional "title", and raw HTML `href="/path"`.
// Only site-absolute links are checked: external URLs are somebody else's
// problem, and anchors and relative links resolve against a page that exists.
const LINK_PATTERN = /\]\((\/[^)\s]*)(?:\s[^)]*)?\)|href=["'](\/[^"']*)["']/g;

// Any `<tag ... />` in the prose. Harmless for the void elements below, and a
// content-eating trap for everything else — see checkSelfClosingTags.
const SELF_CLOSING_PATTERN = /<([a-z][a-z0-9-]*)\b[^>]*\/>/g;

/** HTML elements that are allowed to close themselves, because they hold nothing. */
const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

async function main(): Promise<void> {
  // Imported here rather than at the top of the file on purpose: loading
  // lib/config is what validates site.config.ts, and it throws on a bad one.
  // A static import would run that before the error handler below exists, and
  // the reader would get a Node stack trace instead of the guidance.
  const { site } = await import("../lib/config");
  const { listEntries, listPages } = await import("../lib/content/read");

  // That import has now validated site.config.ts, and listEntries validates
  // every post's frontmatter. Both throw with their own guidance.
  const knownPaths = new Set<string>(["/"]);
  let entryCount = 0;

  for (const collection of site.collections) {
    knownPaths.add(normalize(collection.route));
    for (const entry of listEntries(collection.name)) {
      knownPaths.add(normalize(entry.href));
      entryCount += 1;
    }
  }

  // A page whose slug matches a collection route would never be served: the
  // resolver checks collections first. Reporting it beats a page that silently
  // shows the wrong thing.
  const collectionRoutes = new Set(site.collections.map((collection) => normalize(collection.route)));
  const pages = listPages();
  const shadowed = pages.filter((page) => collectionRoutes.has(normalize(page.href)));

  if (shadowed.length > 0) {
    console.error("\nSome pages cannot be reached:\n");
    for (const page of shadowed) {
      console.error(
        `  • content/pages/${page.slug}.md would be published at ${page.href}, ` +
          `but a collection in site.config.ts already uses that address.`
      );
    }
    console.error("\nRename the page's file, or change that collection's `route`.\n");
    process.exit(1);
  }

  for (const page of pages) {
    knownPaths.add(normalize(page.href));
  }

  const files = markdownFiles(CONTENT_DIR);
  checkSelfClosingTags(files);

  const problems: string[] = [];
  let linkCount = 0;

  for (const file of files) {
    const text = fs.readFileSync(file, "utf-8");
    const relative = path.relative(process.cwd(), file);
    LINK_PATTERN.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = LINK_PATTERN.exec(text)) !== null) {
      const href = match[1] ?? match[2];
      if (href === undefined) {
        continue;
      }
      linkCount += 1;
      if (!knownPaths.has(normalize(href))) {
        problems.push(`${relative} links to ${href}, which is not a page on this blog.`);
      }
    }
  }

  if (problems.length > 0) {
    console.error("\nSome links point at pages that do not exist:\n");
    for (const problem of problems) {
      console.error(`  • ${problem}`);
    }
    console.error("\nCheck the address, or remove the link. Pages that do exist:\n");
    for (const known of [...knownPaths].sort()) {
      console.error(`  ${known}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log(
    `Content is in order: ${site.collections.length} collection(s), ` +
      `${entryCount} entr${entryCount === 1 ? "y" : "ies"}, ${pages.length} page(s), ` +
      `${linkCount} internal link(s) checked.`
  );
}

/**
 * Catches `<photo ... />` and friends.
 *
 * HTML lets only a fixed list of elements close themselves. Any other tag
 * written that way stays open, and the rest of the post becomes its children —
 * so the writing after it silently disappears from the published page. The
 * failure looks like the component ate the post, with nothing to explain why,
 * which is exactly the kind of thing a gate should say out loud.
 */
function checkSelfClosingTags(files: string[]): void {
  const problems: string[] = [];

  for (const file of files) {
    const relative = path.relative(process.cwd(), file);
    const lines = fs.readFileSync(file, "utf-8").split("\n");

    lines.forEach((line, index) => {
      SELF_CLOSING_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = SELF_CLOSING_PATTERN.exec(line)) !== null) {
        const tag = match[1];
        if (tag === undefined || VOID_ELEMENTS.has(tag)) {
          continue;
        }
        problems.push(
          `${relative}:${index + 1} — <${tag} ... /> cannot close itself, so everything after it ` +
            `would vanish from the page. Write it as <${tag} ...></${tag}> instead.`
        );
      }
    });
  }

  if (problems.length > 0) {
    console.error("\nSome tags would swallow the writing that follows them:\n");
    for (const problem of problems) {
      console.error(`  • ${problem}`);
    }
    console.error("");
    process.exit(1);
  }
}

/** Drops the query, the fragment, and any trailing slash so forms compare equal. */
function normalize(href: string): string {
  const bare = href.split("#")[0]?.split("?")[0] ?? "";
  if (bare === "" || bare === "/") {
    return "/";
  }
  return bare.replace(/\/+$/, "");
}

function markdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...markdownFiles(full));
    } else if (entry.name.endsWith(".md")) {
      found.push(full);
    }
  }
  return found.sort();
}

// The config loader and the content reader throw with guidance already written
// for a human. Printing the message alone keeps that guidance readable — a
// Node stack trace above it would bury the one line that says what to fix.
main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
