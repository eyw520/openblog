import Link from "next/link";

import type { ResolvedCollection } from "@/lib/config";
import type { EntryMeta } from "@/lib/content/entry";
import { groupByYear } from "@/lib/content/sort";
import { formatDateShort } from "@/lib/format-date";

/**
 * A collection's archive.
 *
 * Entries are grouped by year with the year set once in the left margin rather
 * than repeated on every row — the reader gets chronology from the structure
 * and each line stays short enough to scan. On narrow screens the rail folds
 * above its group, which keeps the reading order intact.
 */
export function CollectionIndex({
  collection,
  entries,
  locale
}: {
  collection: ResolvedCollection;
  entries: EntryMeta[];
  locale: string;
}): React.ReactElement {
  const groups = groupByYear(entries);

  return (
    <div>
      <header className="max-w-measure">
        <h1 className="font-display text-4xl font-semibold tracking-tight">{collection.label}</h1>
        {collection.description ? (
          <p className="text-ink-muted mt-4 text-lg leading-relaxed">{collection.description}</p>
        ) : null}
      </header>

      {groups.length === 0 ? (
        <p className="text-ink-muted border-rule mt-16 border-t pt-8">
          Nothing here yet. Add a Markdown file to{" "}
          <code className="text-ink">content/{collection.name}/</code> and it appears on this page.
        </p>
      ) : (
        <div className="mt-16 space-y-12">
          {groups.map((group) => (
            <section key={`${group.year}-${group.entries[0]?.slug ?? ""}`} className="border-rule border-t pt-6">
              <div className="md:grid md:grid-cols-[7rem_1fr] md:gap-x-8">
                <h2 className="font-display text-ink-muted/70 text-sm tabular-nums tracking-label">
                  {group.year}
                </h2>

                <ul className="mt-4 space-y-8 md:mt-0">
                  {group.entries.map((entry) => (
                    <li key={entry.slug}>
                      <EntryRow entry={entry} locale={locale} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function EntryRow({ entry, locale }: { entry: EntryMeta; locale: string }): React.ReactElement {
  return (
    <article>
      <Link href={entry.href} className="group block">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <time
            dateTime={entry.date}
            className="font-display text-ink-muted w-16 shrink-0 text-xs uppercase tracking-label"
          >
            {formatDateShort(entry.date, locale)}
          </time>
          <h3 className="font-display group-hover:text-accent text-lg font-semibold tracking-tight transition-colors">
            {entry.title}
          </h3>
          {entry.draft ? (
            <span className="text-rubric font-display text-xs uppercase tracking-label">Draft</span>
          ) : null}
        </div>
        {entry.description ? (
          <p className="text-ink-muted max-w-measure mt-2 leading-relaxed md:pl-20">{entry.description}</p>
        ) : null}
      </Link>
    </article>
  );
}
