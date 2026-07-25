import Link from "next/link";

import type { EntryMeta } from "@/lib/content/entry";
import { formatDateShort } from "@/lib/format-date";

/**
 * A short list of entries sharing tags with this one. Renders nothing when
 * there are none, so an untagged blog never shows an empty section.
 */
export function RelatedEntries({
  entries,
  locale
}: {
  entries: EntryMeta[];
  locale: string;
}): React.ReactElement | null {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="related-heading" className="border-rule max-w-measure mt-20 border-t pt-8">
      <h2 id="related-heading" className="font-display text-ink-muted text-xs uppercase tracking-label">
        Related
      </h2>
      <ul className="mt-5 space-y-4">
        {entries.map((entry) => (
          <li key={`${entry.collection}/${entry.slug}`}>
            <Link href={entry.href} className="group flex flex-wrap items-baseline gap-x-4">
              <time
                dateTime={entry.date}
                className="font-display text-ink-muted w-16 shrink-0 text-xs uppercase tracking-label"
              >
                {formatDateShort(entry.date, locale)}
              </time>
              <span className="font-display group-hover:text-accent font-semibold tracking-tight transition-colors">
                {entry.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
