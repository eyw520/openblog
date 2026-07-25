import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionIndex, EntryArticle } from "@/components/content";
import { PageLayout } from "@/components/layout";
import { site } from "@/lib/config";
import { entrySegments, indexSegments, resolveRoute } from "@/lib/routes";
import { getEntry, listEntries } from "@/services/content";

/**
 * EVERY collection page on the site — both archives and posts — is rendered
 * here. This is the file that makes "declare a collection in site.config.ts"
 * sufficient to publish one: there is no per-collection route to write, and
 * adding one would be the wrong fix for almost any problem.
 *
 * `lib/routes` decides what a path means; this file only fetches and renders.
 */

type RouteParams = { slug: string[] };

/** The complete list of pages to export. Anything absent here is not built. */
export function generateStaticParams(): RouteParams[] {
  return site.collections.flatMap((collection) => [
    { slug: indexSegments(collection) },
    ...listEntries(collection.name).map((entry) => ({ slug: entrySegments(collection, entry.slug) }))
  ]);
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug } = await params;
  const target = resolveRoute(site.collections, slug);
  if (!target) {
    return {};
  }

  if (target.kind === "index") {
    return {
      title: target.collection.label,
      description: target.collection.description || site.description
    };
  }

  const entry = getEntry(target.collection.name, target.slug);
  if (!entry) {
    return {};
  }

  const description = entry.description || site.description;
  return {
    title: entry.title,
    description,
    openGraph: {
      type: "article",
      title: entry.title,
      description,
      publishedTime: entry.date,
      url: `${site.url}${entry.href}`
    }
  };
}

export default async function CollectionPage({
  params
}: {
  params: Promise<RouteParams>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const target = resolveRoute(site.collections, slug);

  if (!target) {
    notFound();
  }

  if (target.kind === "index") {
    return (
      <PageLayout>
        <CollectionIndex
          collection={target.collection}
          entries={listEntries(target.collection.name)}
          locale={site.locale}
        />
      </PageLayout>
    );
  }

  const entry = getEntry(target.collection.name, target.slug);
  if (!entry) {
    notFound();
  }

  // Neighbours follow the collection's own ordering, so they always match what
  // the archive shows — whatever that collection is sorted by.
  const entries = listEntries(target.collection.name);
  const position = entries.findIndex((candidate) => candidate.slug === entry.slug);

  return (
    <PageLayout>
      <EntryArticle
        entry={entry}
        collection={target.collection}
        locale={site.locale}
        {...(position > 0 ? { previous: entries[position - 1] } : {})}
        {...(position >= 0 && position < entries.length - 1 ? { next: entries[position + 1] } : {})}
      />
    </PageLayout>
  );
}
