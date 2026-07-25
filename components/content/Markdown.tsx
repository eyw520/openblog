import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

import { contentComponents } from "../registry";

/**
 * The one Markdown renderer. Every piece of prose on the site goes through it,
 * so the reading treatment cannot drift between one page and another.
 *
 * GFM adds tables, strikethrough, and task lists. `rehype-raw` allows inline
 * HTML, which is what lets a writer reach for a <mark> when Markdown has no
 * spelling for it — and what makes the component registry work at all. That is
 * safe here and only here: content/ is written by the person who owns the
 * repository and rendered at build time, so there is no reader-submitted input
 * anywhere in the pipeline.
 *
 * To add your own tag, edit components/registry.tsx — not this file.
 */
export function Markdown({ content, className }: { content: string; className?: string }): React.ReactElement {
  return (
    // Deliberately no `dark:prose-invert`: that modifier swaps in the typography
    // plugin's own dark palette and would override every token below. The prose
    // colors are already tokens, and tokens flip with the .dark class on their own.
    <div className={cn("prose", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // rehypeRaw first: it parses the raw HTML into nodes that highlighting
        // then walks. Reversed, fenced code inside raw HTML goes uncoloured.
        rehypePlugins={[rehypeRaw, [rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={contentComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
