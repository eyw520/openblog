import Link from "next/link";

import { site } from "@/lib/config";
import type { EntryMeta } from "@/lib/content/entry";

import { EntryRow } from "./EntryRow";

/** Everything carrying one tag, newest first. */
export function TagPage({
  label,
  entries,
  locale
}: {
  label: string;
  entries: EntryMeta[];
  locale: string;
}): React.ReactElement {
  return (
    <div>
      <header className="max-w-measure">
        <Link
          href={site.tags.route}
          className="font-display text-ink-muted hover:text-ink text-xs uppercase tracking-label transition-colors"
        >
          {site.tags.label}
        </Link>
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight">{label}</h1>
        <p className="text-ink-muted mt-4 text-lg leading-relaxed">
          {entries.length} {entries.length === 1 ? "post" : "posts"}.
        </p>
      </header>

      <ul className="border-rule mt-16 space-y-8 border-t pt-8">
        {entries.map((entry) => (
          <li key={`${entry.collection}/${entry.slug}`}>
            <EntryRow entry={entry} locale={locale} />
          </li>
        ))}
      </ul>
    </div>
  );
}
