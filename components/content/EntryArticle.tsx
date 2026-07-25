import Link from "next/link";

import { site } from "@/lib/config";
import type { EntryMeta } from "@/lib/content/entry";
import { extractHeadings } from "@/lib/content/headings";
import { listRelatedEntries, listSeriesParts } from "@/services/content";
import { tagSlug } from "@/lib/content/tags";
import { formatDate } from "@/lib/format-date";

import type { EntryLayoutProps } from "../layouts";
import { Comments } from "./Comments";
import { FieldList } from "./FieldList";
import { RelatedEntries } from "./RelatedEntries";
import { SeriesNav } from "./SeriesNav";
import { TableOfContents } from "./TableOfContents";
import { Markdown } from "./Markdown";
import { StructuredData } from "./StructuredData";

/**
 * The default entry layout: title block, prose, and the way out to neighbours.
 *
 * Neighbours are in the collection's own archive order — the entry listed just
 * above this one, and the one just below. Deliberately not "older" and "newer":
 * a collection sorted by title has neighbours too, and those labels would be a
 * lie there.
 */
export function EntryArticle({
  entry,
  collection,
  locale,
  previous,
  next
}: EntryLayoutProps): React.ReactElement {
  // Comments are opt-in per collection: a notes stream usually does not want
  // the same conversation an essay does. Bound to a local so the null check
  // narrows the value handed to <Comments> below.
  const comments = site.comments;
  const showComments = comments !== null && comments.collections.includes(collection.name);

  return (
    <article>
      <StructuredData entry={entry} collection={collection} />

      <header className="border-rule max-w-measure border-b pb-8">
        <Link
          href={collection.route}
          className="font-display text-ink-muted hover:text-ink text-xs uppercase tracking-label transition-colors"
        >
          {collection.label}
        </Link>

        <h1 className="font-display mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {entry.title}
        </h1>

        {entry.description ? (
          <p className="text-ink-muted mt-5 text-lg leading-relaxed">{entry.description}</p>
        ) : null}

        <p className="font-display text-ink-muted mt-6 flex flex-wrap items-baseline gap-x-3 text-xs uppercase tracking-label">
          <time dateTime={entry.date}>{formatDate(entry.date, locale)}</time>
          {site.display.readingTime ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{entry.readingMinutes} min read</span>
            </>
          ) : null}
          {entry.updated ? (
            <>
              <span aria-hidden="true">·</span>
              <span>Updated {formatDate(entry.updated, locale)}</span>
            </>
          ) : null}
          {entry.draft ? <span className="text-rubric">· Draft</span> : null}
        </p>

        <FieldList schema={collection.fields} fields={entry.fields} locale={locale} />

        {entry.tags.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
            {entry.tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`${site.tags.route}/${tagSlug(tag)}`}
                  className="font-display text-ink-muted hover:text-accent text-xs uppercase tracking-label transition-colors"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {entry.series ? <SeriesNav name={entry.series} parts={listSeriesParts(entry)} /> : null}

      {collection.toc ? <TableOfContents headings={extractHeadings(entry.body)} /> : null}

      <Markdown content={entry.body} className="mt-12" />

      <RelatedEntries entries={listRelatedEntries(entry)} locale={locale} />

      {showComments ? <Comments config={comments} /> : null}

      {previous !== undefined || next !== undefined ? (
        <nav aria-label="More in this collection" className="border-rule max-w-measure mt-20 border-t pt-8">
          <ul className="flex flex-wrap justify-between gap-6">
            {previous ? <NeighbourLink label="Previous" entry={previous} /> : <li />}
            {next ? <NeighbourLink label="Next" entry={next} align="right" /> : null}
          </ul>
        </nav>
      ) : null}
    </article>
  );
}

function NeighbourLink({
  label,
  entry,
  align = "left"
}: {
  label: string;
  entry: EntryMeta;
  align?: "left" | "right";
}): React.ReactElement {
  return (
    <li className={align === "right" ? "text-right" : undefined}>
      <Link href={entry.href} className="group block max-w-xs">
        <span className="font-display text-ink-muted block text-xs uppercase tracking-label">{label}</span>
        <span className="font-display group-hover:text-accent mt-1 block font-semibold tracking-tight transition-colors">
          {entry.title}
        </span>
      </Link>
    </li>
  );
}
