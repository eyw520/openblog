import { site } from "@/lib/config";
import { sortEntries } from "@/lib/content/sort";
import { buildFeed } from "@/lib/feed";
import { listEntries } from "@/services/content";

// A route handler rather than a page: it emits XML, not HTML. `force-static`
// is what lets it exist in a static export — the file is written once at build
// time and served as out/feed.xml.
export const dynamic = "force-static";

export function GET(): Response {
  // Collections opt out with `feed: false`. Across collections the feed is
  // always newest-first, whatever order each archive chooses to display.
  const entries = sortEntries(
    site.collections
      .filter((collection) => collection.feed)
      .flatMap((collection) => listEntries(collection.name)),
    "date-desc"
  );

  return new Response(buildFeed(site, entries), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" }
  });
}
