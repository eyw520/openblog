import type { Page } from "@/lib/content/page";

import { Markdown } from "./Markdown";

/**
 * A standalone page. Deliberately plainer than an entry: no date, no reading
 * time, no neighbours — none of those mean anything for an about page.
 */
export function PageArticle({ page }: { page: Page }): React.ReactElement {
  return (
    <article>
      <header className="border-rule max-w-measure border-b pb-8">
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {page.title}
        </h1>
        {page.description ? (
          <p className="text-ink-muted mt-5 text-lg leading-relaxed">{page.description}</p>
        ) : null}
      </header>

      <Markdown content={page.body} className="mt-12" />
    </article>
  );
}
