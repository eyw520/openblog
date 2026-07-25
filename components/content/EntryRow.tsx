import Link from "next/link";

import type { EntryMeta } from "@/lib/content/entry";
import { formatDateShort } from "@/lib/format-date";

/**
 * One line in a list of entries. Shared by the collection archive and the front
 * page so a post looks the same wherever it is listed.
 */
export function EntryRow({
  entry,
  locale,
  /** Indent the description to align under the title. Off in narrow columns. */
  indent = true
}: {
  entry: EntryMeta;
  locale: string;
  indent?: boolean;
}): React.ReactElement {
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
          <p className={`text-ink-muted max-w-measure mt-2 leading-relaxed ${indent ? "md:pl-20" : ""}`}>
            {entry.description}
          </p>
        ) : null}
      </Link>
    </article>
  );
}
