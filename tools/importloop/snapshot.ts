import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { type Snapshot, type SourcePost, loadContract, sourceDir } from "./contract";
import { mainContent, parseRobots } from "./extract";
import { findFeedUrl, parseFeed, parseSitemap } from "./feed";
import { htmlToText } from "./text";

/**
 * Taking one record of a source site, so every later run is offline.
 *
 * This is the only part of importloop that touches the network, and it runs
 * once per import job rather than once per iteration. An agent grinding against
 * the fidelity gate would otherwise re-fetch someone else's blog every few
 * seconds — this makes that impossible by construction, and makes verify
 * reproducible as a side effect.
 *
 * Manners, since this reads a server that is not ours: it identifies itself,
 * honours robots.txt, and waits between requests. Import content you have the
 * right to republish — usually your own blog, moving house.
 */

const USER_AGENT = "openblog-importloop (+https://github.com/openblog; one-time site import)";
const DELAY_MS = 750;
const FEED_GUESSES = ["/feed.xml", "/rss.xml", "/feed", "/atom.xml", "/index.xml", "/feed/"];

async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug) {
    console.error("usage: npm run import:snapshot -- <slug>");
    process.exitCode = 1;
    return;
  }

  const { contract } = loadContract(slug);
  console.log(`importloop: snapshotting ${contract.url}`);

  const robots = await loadRobots(contract.url);
  const allowed = (url: string): boolean => robots.allows(new URL(url).pathname);

  if (!allowed(contract.url)) {
    console.error(`\nrobots.txt on ${contract.url} asks crawlers to stay out. Stopping.\n`);
    process.exitCode = 1;
    return;
  }

  const { posts, discovery } = await discoverPosts(contract.url, allowed);
  const excluded = new Set(contract.exclude ?? []);
  const kept = posts.filter((post) => !excluded.has(post.url));

  const filled = contract.fetchPages === true ? await fillBodies(kept, allowed) : kept;

  const snapshot: Snapshot = {
    source: contract.url,
    fetchedAt: new Date().toISOString(),
    discovery,
    posts: filled
  };

  const dir = sourceDir(slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "snapshot.json"), `${JSON.stringify(snapshot, null, 2)}\n`);

  const thin = filled.filter((post) => post.text.split(/\s+/).length < 50).length;
  console.log(`\nwrote ${filled.length} post(s) via ${discovery} to sources/${slug}/snapshot.json`);
  if (thin > 0 && contract.fetchPages !== true) {
    console.log(
      `${thin} post(s) look like excerpts rather than full bodies. ` +
        `Set "fetchPages": true in import.json and snapshot again, or the fidelity gate ` +
        `will be measuring against a summary.`
    );
  }
  console.log("Commit the snapshot: it is the reference every gate compares against.\n");
}

async function discoverPosts(
  siteUrl: string,
  allowed: (url: string) => boolean
): Promise<{ posts: SourcePost[]; discovery: "feed" | "sitemap" }> {
  const feedUrl = await findFeed(siteUrl, allowed);

  if (feedUrl) {
    console.log(`feed: ${feedUrl}`);
    const posts = parseFeed(await get(feedUrl));
    if (posts.length > 0) {
      return { posts, discovery: "feed" };
    }
    console.log("feed had no entries; falling back to the sitemap");
  }

  const sitemapUrl = new URL("/sitemap.xml", siteUrl).toString();
  if (!allowed(sitemapUrl)) {
    throw new Error("No feed, and robots.txt disallows the sitemap. Nothing can be read.");
  }

  const urls = parseSitemap(await get(sitemapUrl)).filter(allowed);
  if (urls.length === 0) {
    throw new Error(
      `Found neither a feed nor a sitemap at ${siteUrl}. ` +
        "importloop reads structured listings only; it does not crawl links."
    );
  }

  console.log(`sitemap: ${urls.length} url(s)`);
  const posts: SourcePost[] = [];
  for (const url of urls) {
    posts.push(await fetchPost(url));
    await pause();
  }
  return { posts, discovery: "sitemap" };
}

async function findFeed(siteUrl: string, allowed: (url: string) => boolean): Promise<string | null> {
  try {
    const declared = findFeedUrl(await get(siteUrl), siteUrl);
    if (declared && allowed(declared)) {
      return declared;
    }
  } catch {
    // The home page may not be readable; the guesses below still might be.
  }

  for (const path of FEED_GUESSES) {
    const candidate = new URL(path, siteUrl).toString();
    if (!allowed(candidate)) {
      continue;
    }
    await pause();
    try {
      const body = await get(candidate);
      if (/<(rss|feed)\b/i.test(body)) {
        return candidate;
      }
    } catch {
      // Not there. Try the next spelling.
    }
  }
  return null;
}

/** Replaces feed excerpts with the text of each post's own page. */
async function fillBodies(posts: SourcePost[], allowed: (url: string) => boolean): Promise<SourcePost[]> {
  const filled: SourcePost[] = [];
  for (const post of posts) {
    if (!allowed(post.url)) {
      console.log(`skipped (robots.txt): ${post.url}`);
      filled.push(post);
      continue;
    }
    await pause();
    const fetched = await fetchPost(post.url);
    // Keep the feed's title and date: they are structured, where the page's are
    // guessed. Take the page's body, which is why we came.
    filled.push({
      ...post,
      text: fetched.text.length > post.text.length ? fetched.text : post.text,
      images: fetched.images.length > 0 ? fetched.images : post.images
    });
    console.log(`fetched ${post.url}`);
  }
  return filled;
}

async function fetchPost(url: string): Promise<SourcePost> {
  const html = await get(url);
  const body = mainContent(html);
  return {
    url,
    title: htmlToText(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? ""),
    date: "",
    text: htmlToText(body),
    images: [...body.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)]
      .map((match) => match[1])
      .filter((src): src is string => src !== undefined)
      .map((src) => new URL(src, url).toString())
  };
}

interface Robots {
  allows: (path: string) => boolean;
}

async function loadRobots(siteUrl: string): Promise<Robots> {
  try {
    const body = await get(new URL("/robots.txt", siteUrl).toString());
    const rules = parseRobots(body);
    return { allows: (path) => rules.every((rule) => !path.startsWith(rule)) };
  } catch {
    // No robots.txt means no restrictions stated.
    return { allows: () => true };
  }
}

async function get(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.text();
}

function pause(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, DELAY_MS));
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
