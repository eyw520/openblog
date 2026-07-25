import Link from "next/link";

import type { SeriesPart } from "@/lib/content/relations";

/**
 * Where this entry sits in a sequence, and how to reach the rest of it.
 *
 * Placed above the prose rather than below: a reader who has landed on part
 * three of something needs to know that before they start reading, not after.
 */
export function SeriesNav({ name, parts }: { name: string; parts: SeriesPart[] }): React.ReactElement | null {
  if (parts.length === 0) {
    return null;
  }

  const position = parts.findIndex((part) => part.current) + 1;

  return (
    <nav aria-label={`${name} series`} className="border-rule bg-surface my-10 rounded-sm border p-5">
      <p className="font-display text-ink-muted text-xs uppercase tracking-label">
        {name}
        {position > 0 ? ` · Part ${position} of ${parts.length}` : ` · ${parts.length} parts`}
      </p>
      <ol className="mt-3 space-y-1">
        {parts.map((part) => (
          <li key={`${part.entry.collection}/${part.entry.slug}`} className="leading-snug">
            {part.current ? (
              <span aria-current="true" className="font-semibold">
                {part.part}. {part.entry.title}
              </span>
            ) : (
              <Link href={part.entry.href} className="hover:text-accent transition-colors">
                {part.part}. {part.entry.title}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
