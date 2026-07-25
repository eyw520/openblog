import Link from "next/link";

import { EntryRow, Markdown } from "@/components/content";
import { PageLayout } from "@/components/layout";
import { site } from "@/lib/config";
import { getHomePage, listLatestEntries } from "@/services/content";

/**
 * The front page.
 *
 * Its words come from content/pages/home.md when that file exists, so the first
 * thing a reader sees is editable without opening any code. Without it, the
 * site title and description stand in — a new blog is never blank.
 */
export default function HomePage(): React.ReactElement {
  const home = getHomePage();
  const latest = listLatestEntries();

  return (
    <PageLayout>
      <header className="max-w-measure">
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {home?.title ?? site.title}
        </h1>
        <p className="text-ink-muted mt-6 text-lg leading-relaxed">{home?.description ?? site.description}</p>
      </header>

      {home?.body ? <Markdown content={home.body} className="mt-10" /> : null}

      {latest.length > 0 ? (
        <section className="border-rule mt-20 border-t pt-6">
          <h2 className="font-display text-ink-muted text-sm tracking-label">LATEST</h2>
          <ul className="mt-6 space-y-8">
            {latest.map((entry) => (
              <li key={`${entry.collection}/${entry.slug}`}>
                <EntryRow entry={entry} locale={site.locale} />
              </li>
            ))}
          </ul>

          {site.collections.length === 1 && site.collections[0] ? (
            <Link
              href={site.collections[0].route}
              className="font-display text-ink-muted hover:text-ink mt-10 inline-block text-xs uppercase tracking-label transition-colors"
            >
              All {site.collections[0].label} →
            </Link>
          ) : null}
        </section>
      ) : null}
    </PageLayout>
  );
}
