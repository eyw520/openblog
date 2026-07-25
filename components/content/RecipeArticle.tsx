import Link from "next/link";

import { site } from "@/lib/config";
import { formatDate } from "@/lib/format-date";

import type { EntryLayoutProps } from "../layouts";
import { Comments } from "./Comments";
import { Markdown } from "./Markdown";

/**
 * A worked example of a custom entry layout — and a usable recipe page.
 *
 * It reads the fields its collection declared rather than any fields openblog
 * knows about: `ingredients` becomes a list beside the method, and the times
 * become a strip of statistics. A collection declaring different fields simply
 * shows what it has.
 *
 * Copy this file to build a layout for trips, papers, or anything else. The
 * accompanying collection is in RECIPES.md under "Make it a food blog".
 */
export function RecipeArticle({
  entry,
  collection,
  locale,
  previous,
  next
}: EntryLayoutProps): React.ReactElement {
  const ingredients = entry.fields.ingredients;
  const list = Array.isArray(ingredients) ? ingredients : [];

  // Only the numeric ones become statistics; a collection that declares none of
  // them simply shows no strip.
  const stats: { name: string; label: string; value: number; unit: string }[] = [];
  for (const [name, { label, unit }] of Object.entries(STATS)) {
    const value = entry.fields[name];
    if (typeof value === "number") {
      stats.push({ name, label, value, unit });
    }
  }

  const comments = site.comments;
  const showComments = comments !== null && comments.collections.includes(collection.name);

  return (
    <article>
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

        {stats.length > 0 ? (
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map((stat) => (
              <div key={stat.name}>
                <dt className="font-display text-ink-muted text-xs uppercase tracking-label">
                  {stat.label}
                </dt>
                <dd className="font-display mt-1 text-2xl tabular-nums">
                  {stat.value}
                  {stat.unit ? <span className="text-ink-muted ml-1 text-sm">{stat.unit}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <p className="font-display text-ink-muted mt-6 text-xs uppercase tracking-label">
          <time dateTime={entry.date}>{formatDate(entry.date, locale)}</time>
        </p>
      </header>

      {/* Ingredients sit beside the method on a wide screen, because that is how
          a recipe is actually used — read one column, work from the other. */}
      <div className="mt-12 lg:grid lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-x-12">
        {list.length > 0 ? (
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <h2 className="font-display text-ink-muted text-xs uppercase tracking-label">Ingredients</h2>
            <ul className="border-rule mt-4 space-y-2 border-t pt-4">
              {list.map((item) => (
                <li key={item} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        ) : null}

        <div className={list.length > 0 ? "mt-10 lg:mt-0" : ""}>
          <Markdown content={entry.body} />
        </div>
      </div>

      {showComments ? <Comments config={comments} /> : null}

      {previous !== undefined || next !== undefined ? (
        <nav aria-label="More in this collection" className="border-rule max-w-measure mt-20 border-t pt-8">
          <ul className="flex flex-wrap justify-between gap-6">
            {previous ? <NeighbourLink label="Previous" href={previous.href} title={previous.title} /> : <li />}
            {next ? <NeighbourLink label="Next" href={next.href} title={next.title} align="right" /> : null}
          </ul>
        </nav>
      ) : null}
    </article>
  );
}

/**
 * The numeric fields this layout promotes to a statistic, with the unit spelled
 * out — "Prep 10" alone does not say ten of what.
 */
const STATS: Record<string, { label: string; unit: string }> = {
  prepMinutes: { label: "Prep", unit: "min" },
  cookMinutes: { label: "Cook", unit: "min" },
  servings: { label: "Serves", unit: "" }
};

function NeighbourLink({
  label,
  href,
  title,
  align = "left"
}: {
  label: string;
  href: string;
  title: string;
  align?: "left" | "right";
}): React.ReactElement {
  return (
    <li className={align === "right" ? "text-right" : undefined}>
      <Link href={href} className="group block max-w-xs">
        <span className="font-display text-ink-muted block text-xs uppercase tracking-label">{label}</span>
        <span className="font-display group-hover:text-accent mt-1 block font-semibold tracking-tight transition-colors">
          {title}
        </span>
      </Link>
    </li>
  );
}
