import type { ReactNode } from "react";

/**
 * An opening paragraph set larger than the body, the way a magazine sets the
 * first lines of a feature.
 *
 *   <lead>The tide was out, and the harbour was a field of mud.</lead>
 */
export function Lead({ children }: { children?: ReactNode }): React.ReactElement {
  return <div className="text-ink-muted mb-8 text-xl leading-relaxed [&>p]:m-0">{children}</div>;
}
