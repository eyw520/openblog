import type { Heading } from "@/lib/content/headings";

/**
 * A contents list built from an entry's own headings.
 *
 * Shown only when there is enough of a piece to warrant it — a two-heading post
 * gets a list as long as the post, which helps nobody. Turn it on per collection
 * with `toc: true`; the threshold is the framework's judgement, not a setting,
 * because the right answer does not vary by blog.
 */
const MINIMUM_HEADINGS = 3;

export function TableOfContents({ headings }: { headings: Heading[] }): React.ReactElement | null {
  if (headings.length < MINIMUM_HEADINGS) {
    return null;
  }

  return (
    <nav aria-labelledby="contents-heading" className="border-rule my-10 border-y py-6">
      <h2
        id="contents-heading"
        className="font-display text-ink-muted text-xs uppercase tracking-label"
      >
        Contents
      </h2>
      <ol className="mt-4 space-y-2">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level > 2 ? "pl-5" : undefined}>
            <a href={`#${heading.id}`} className="hover:text-accent leading-snug transition-colors">
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
