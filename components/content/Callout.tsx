import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * An aside for something the reader should not miss. Shipped as the worked
 * example for the component registry — copy it to build your own.
 *
 * Props arrive from Markdown as strings, so `kind` is validated rather than
 * trusted: a typo should fall back to a note, not render an unstyled box.
 */
export function Callout({ kind, children }: { kind?: string; children?: ReactNode }): React.ReactElement {
  const isWarning = kind === "warning";

  return (
    <aside
      className={cn(
        "bg-surface my-8 border-l-2 py-4 pl-5 pr-4",
        isWarning ? "border-rubric" : "border-accent"
      )}
    >
      <p
        className={cn(
          "font-display mb-2 text-xs uppercase tracking-label",
          isWarning ? "text-rubric" : "text-accent"
        )}
      >
        {isWarning ? "Warning" : "Note"}
      </p>
      <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
    </aside>
  );
}
