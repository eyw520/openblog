import type { ReactNode } from "react";

/**
 * A line lifted out of the prose and set large, the way a magazine pulls a
 * sentence to slow a reader down.
 *
 *   <pull-quote source="Joan Didion">We tell ourselves stories in order to live.</pull-quote>
 *
 * Not a blockquote: a blockquote attributes words to someone else, while a pull
 * quote repeats the page's own. It is marked `aria-hidden` when it merely
 * repeats nearby text — but since openblog cannot know that, the quote stays
 * readable and the writer decides whether to duplicate a sentence or not.
 */
export function PullQuote({
  children,
  source
}: {
  children?: ReactNode;
  source?: string;
}): React.ReactElement {
  return (
    <aside className="border-accent my-12 border-l-2 pl-6 lg:-ml-10">
      <p className="font-display text-2xl font-semibold leading-snug tracking-tight [&>*]:m-0">{children}</p>
      {source ? (
        <p className="font-display text-ink-muted mt-3 text-xs uppercase tracking-label">{source}</p>
      ) : null}
    </aside>
  );
}
