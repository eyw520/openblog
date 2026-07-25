import { site } from "@/lib/config";

/**
 * Prefixing site-absolute paths with the blog's base path.
 *
 * Next applies `basePath` to <Link> and to its own asset URLs, but not to plain
 * HTML that Markdown produces. A writer who links to /writing or embeds
 * /photo.jpg is describing a path within their blog, and on a GitHub Pages
 * project site that blog lives under a subdirectory — so those raw hrefs must
 * be rewritten or every one of them 404s once deployed.
 */

/** Pure form: the same rule, with the base path passed in so it can be tested. */
export function applyBasePath(basePath: string, href: string): string {
  // Only site-absolute paths are ours to rewrite. Protocol-relative URLs
  // ("//example.com") start with a slash too and must be left alone.
  if (basePath === "" || !href.startsWith("/") || href.startsWith("//")) {
    return href;
  }
  // An href that already carries the prefix is left as-is, so applying this
  // twice is harmless.
  if (href === basePath || href.startsWith(`${basePath}/`)) {
    return href;
  }
  return `${basePath}${href}`;
}

/** Rewrites an href or src for this blog's base path. */
export function withBasePath(href: string): string {
  return applyBasePath(site.basePath, href);
}
