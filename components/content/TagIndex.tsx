import Link from "next/link";

import { site } from "@/lib/config";
import type { TagSummary } from "@/lib/content/tags";

/**
 * Every tag in use, sized by nothing and ordered by use. A tag cloud with
 * varying type sizes reads as decoration; the count says the same thing
 * honestly and can be read aloud by a screen reader.
 */
export function TagIndex({ tags }: { tags: TagSummary[] }): React.ReactElement {
  return (
    <div>
      <header className="max-w-measure">
        <h1 className="font-display text-4xl font-semibold tracking-tight">{site.tags.label}</h1>
        <p className="text-ink-muted mt-4 text-lg leading-relaxed">
          {tags.length} {tags.length === 1 ? "tag" : "tags"} across the blog.
        </p>
      </header>

      <ul className="border-rule mt-16 flex flex-wrap gap-x-6 gap-y-4 border-t pt-8">
        {tags.map((tag) => (
          <li key={tag.slug}>
            <Link href={`${site.tags.route}/${tag.slug}`} className="group inline-flex items-baseline gap-2">
              <span className="font-display group-hover:text-accent font-semibold tracking-tight transition-colors">
                {tag.label}
              </span>
              <span className="font-display text-ink-muted text-xs tabular-nums">{tag.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
