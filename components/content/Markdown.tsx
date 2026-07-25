import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

/**
 * The one Markdown renderer. Every piece of prose on the site goes through it,
 * so the reading treatment cannot drift between a post and a page.
 *
 * GFM adds tables, strikethrough, and task lists. `rehype-raw` allows inline
 * HTML, which lets a writer reach for a <mark> or a <sup> when Markdown has no
 * spelling for it. That is safe here and only here: content/ is written by the
 * person who owns the repository and is rendered at build time — there is no
 * reader-submitted input anywhere in a static blog.
 */
export function Markdown({ content, className }: { content: string; className?: string }): React.ReactElement {
  return (
    // Deliberately no `dark:prose-invert`: that modifier swaps in the typography
    // plugin's own dark palette and would override every token below. The prose
    // colors are already tokens, and tokens flip with the .dark class on their own.
    <div className={cn("prose", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
