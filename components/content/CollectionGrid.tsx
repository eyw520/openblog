import Link from "next/link";

import type { EntryMeta } from "@/lib/content/entry";
import { formatDateShort } from "@/lib/format-date";
import { withBasePath } from "@/lib/paths";

import type { IndexLayoutProps } from "../layouts";

/**
 * An archive of cards, for collections where the picture is the point — recipes,
 * photographs, places. The list archive stays the default because for prose the
 * title and the date are what a reader scans.
 *
 * Entries without a cover image still appear, as a card with its title and
 * description. A grid that hid them would quietly lose posts.
 */
export function CollectionGrid({ collection, entries, locale }: IndexLayoutProps): React.ReactElement {
  return (
    <div>
      <header className="max-w-measure">
        <h1 className="font-display text-4xl font-semibold tracking-tight">{collection.label}</h1>
        {collection.description ? (
          <p className="text-ink-muted mt-4 text-lg leading-relaxed">{collection.description}</p>
        ) : null}
      </header>

      {entries.length === 0 ? (
        <p className="text-ink-muted border-rule mt-16 border-t pt-8">
          Nothing here yet. Add a Markdown file to <code className="text-ink">content/{collection.name}/</code>{" "}
          and it appears on this page.
        </p>
      ) : (
        <ul className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <li key={entry.slug}>
              <GridCard entry={entry} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GridCard({ entry, locale }: { entry: EntryMeta; locale: string }): React.ReactElement {
  return (
    <article>
      <Link href={entry.href} className="group block">
        {entry.image ? (
          <div className="border-rule bg-surface aspect-[4/3] overflow-hidden rounded-sm border">
            {/* A plain <img>: a static export has no image optimizer. */}
            <img
              src={withBasePath(entry.image)}
              alt={entry.imageAlt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="border-rule bg-surface aspect-[4/3] rounded-sm border" aria-hidden="true" />
        )}

        <time
          dateTime={entry.date}
          className="font-display text-ink-muted mt-4 block text-xs uppercase tracking-label"
        >
          {formatDateShort(entry.date, locale)}
        </time>

        <h3 className="font-display group-hover:text-accent mt-2 text-lg font-semibold leading-snug tracking-tight transition-colors">
          {entry.title}
          {entry.draft ? <span className="text-rubric ml-2 text-xs uppercase tracking-label">Draft</span> : null}
        </h3>

        {entry.description ? (
          <p className="text-ink-muted mt-2 leading-relaxed">{entry.description}</p>
        ) : null}
      </Link>
    </article>
  );
}
