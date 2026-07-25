import type { ResolvedCollection } from "@/lib/config";
import { site } from "@/lib/config";
import type { Entry } from "@/lib/content/entry";
import { entryStructuredData } from "@/lib/structured-data";

/**
 * The entry's schema.org description, embedded for search engines.
 *
 * `dangerouslySetInnerHTML` is the documented way to emit a JSON-LD block —
 * React would otherwise escape the JSON into nonsense. What goes in is built by
 * openblog from validated content, never from anything a reader supplied, and
 * `<` is escaped so the string cannot close the script tag early.
 */
export function StructuredData({
  entry,
  collection
}: {
  entry: Entry;
  collection: ResolvedCollection;
}): React.ReactElement {
  const json = JSON.stringify(entryStructuredData(site, collection, entry)).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
