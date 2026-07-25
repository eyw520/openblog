import type { MetadataRoute } from "next";

import { site } from "@/lib/config";
import { listEntries } from "@/services/content";

export const dynamic = "force-static";

/**
 * Every page a search engine should know about: the front page, each
 * collection's archive, and each entry. Generated from the same config and
 * content as the site itself, so it cannot fall out of step with what exists.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [{ url: `${site.url}/`, changeFrequency: "weekly", priority: 1 }];

  for (const collection of site.collections) {
    pages.push({ url: `${site.url}${collection.route}`, changeFrequency: "weekly", priority: 0.8 });

    for (const entry of listEntries(collection.name)) {
      pages.push({
        url: `${site.url}${entry.href}`,
        // The revision date when there is one, else the publication date.
        lastModified: entry.updated ?? entry.date,
        changeFrequency: "yearly",
        priority: 0.6
      });
    }
  }

  return pages;
}
