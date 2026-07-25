import { site } from "@/lib/config";

/**
 * Attribution, the ways to reach the author, and the feed link. Deliberately
 * quiet — the writing is the page. Everything shown here comes from
 * site.config.ts, so no one edits this file to add a link.
 */
export function SiteFooter(): React.ReactElement {
  return (
    <footer className="border-rule mt-24 border-t">
      <div className="text-ink-muted mx-auto flex max-w-4xl flex-wrap items-baseline justify-between gap-x-8 gap-y-4 px-6 py-8 text-sm">
        <p>
          {site.author.url ? (
            <a href={site.author.url} className="hover:text-ink transition-colors">
              {site.author.name}
            </a>
          ) : (
            site.author.name
          )}
          {site.display.copyright ? (
            <span className="text-ink-muted ml-3">{site.display.copyright}</span>
          ) : null}
        </p>

        <nav aria-label="Elsewhere" className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          {site.social.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-display hover:text-ink text-xs uppercase tracking-label transition-colors"
              {...(link.href.startsWith("http") ? { rel: "me noopener noreferrer" } : {})}
            >
              {link.label}
            </a>
          ))}

          {/* A plain anchor, not next/link — the feed is a static file, so the
              base path has to be applied by hand. */}
          <a
            href={`${site.basePath}/feed.xml`}
            className="font-display hover:text-ink text-xs uppercase tracking-label transition-colors"
          >
            RSS
          </a>
        </nav>
      </div>
    </footer>
  );
}
