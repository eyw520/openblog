import { site } from "@/lib/config";

/** Attribution and the feed link. Deliberately quiet — the writing is the page. */
export function SiteFooter(): React.ReactElement {
  return (
    <footer className="border-rule mt-24 border-t">
      <div className="text-ink-muted mx-auto flex max-w-4xl flex-wrap items-baseline justify-between gap-4 px-6 py-8 text-sm">
        <p>
          {site.author.url ? (
            <a href={site.author.url} className="hover:text-ink transition-colors">
              {site.author.name}
            </a>
          ) : (
            site.author.name
          )}
        </p>
        {/* A plain anchor, not next/link — the feed is a static file, so the
            base path has to be applied by hand. */}
        <a
          href={`${site.basePath}/feed.xml`}
          className="font-display hover:text-ink text-xs uppercase tracking-label transition-colors"
        >
          RSS
        </a>
      </div>
    </footer>
  );
}
