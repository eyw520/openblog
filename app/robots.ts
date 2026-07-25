import type { MetadataRoute } from "next";

import { site } from "@/lib/config";

export const dynamic = "force-static";

/**
 * Lets crawlers read everything and points them at the sitemap. Drafts never
 * reach the published site, so there is nothing here to hide.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`
  };
}
