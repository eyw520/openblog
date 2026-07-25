import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionIndex, EntryArticle, PageArticle, TagIndex, TagPage } from "@/components/content";
import { PageLayout } from "@/components/layout";
import { site } from "@/lib/config";
import { entrySegments, indexSegments, pathSegments, resolveRoute } from "@/lib/routes";
import {
  getEntry,
  getPage,
  listEntries,
  listEntriesByTag,
  listPages,
  listTags,
  routeContext
} from "@/services/content";

/**
 * EVERY content page on the site — collection archives, posts, standalone
 * pages, and tag pages — is rendered here. This is the file that makes
 * "declare a collection in site.config.ts", "drop a file in content/pages/",
 * and "add tags to a post" each sufficient to publish: there is no per-section
 * route to write, and adding one would be the wrong fix for almost any problem.
 *
 * `lib/routes` decides what a path means; this file only fetches and renders.
 */

type RouteParams = { slug: string[] };

/** The complete list of pages to export. Anything absent here is not built. */
export function generateStaticParams(): RouteParams[] {
  const tags = listTags();

  return [
    ...site.collections.flatMap((collection) => [
      { slug: indexSegments(collection) },
      ...listEntries(collection.name).map((entry) => ({ slug: entrySegments(collection, entry.slug) }))
    ]),
    ...listPages().map((page) => ({ slug: [page.slug] })),
    // No tags means no tag index either — an empty page nobody can reach.
    ...(tags.length > 0
      ? [
          { slug: pathSegments(site.tags.route) },
          ...tags.map((tag) => ({ slug: [...pathSegments(site.tags.route), tag.slug] }))
        ]
      : [])
  ];
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug } = await params;
  const target = resolveRoute(routeContext(), slug);
  if (!target) {
    return {};
  }

  switch (target.kind) {
    case "index":
      return {
        title: target.collection.label,
        description: target.collection.description || site.description
      };

    case "page": {
      const page = getPage(target.slug);
      return page ? { title: page.title, description: page.description || site.description } : {};
    }

    case "tagIndex":
      return { title: site.tags.label, description: `Everything on this blog, by tag.` };

    case "tag": {
      const label = listTags().find((tag) => tag.slug === target.slug)?.label ?? target.slug;
      return { title: label, description: `Posts tagged ${label}.` };
    }

    case "entry": {
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
  }
}

export default async function ContentPage({
  params
}: {
  params: Promise<RouteParams>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const target = resolveRoute(routeContext(), slug);

  if (!target) {
    notFound();
  }

  if (target.kind === "tagIndex") {
    return (
      <PageLayout>
        <TagIndex tags={listTags()} />
      </PageLayout>
    );
  }

  if (target.kind === "tag") {
    const label = listTags().find((tag) => tag.slug === target.slug)?.label ?? target.slug;
    return (
      <PageLayout>
        <TagPage label={label} entries={listEntriesByTag(target.slug)} locale={site.locale} />
      </PageLayout>
    );
  }

  if (target.kind === "page") {
    const page = getPage(target.slug);
    if (!page) {
      notFound();
    }
    return (
      <PageLayout>
        <PageArticle page={page} />
      </PageLayout>
    );
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
