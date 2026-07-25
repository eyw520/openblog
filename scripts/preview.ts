import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

/**
 * Serves the built site the way GitHub Pages will.
 *
 * The subtlety this exists for: a project site is published under a
 * subdirectory, so every asset in out/ is linked as /<repo>/_next/… A plain
 * static server hands those pages out at the root instead, the asset paths miss,
 * and the preview renders with no styling at all — which looks exactly like the
 * deploy failure this framework works hardest to prevent.
 *
 * So the export is mounted at the base path taken from site.config.ts, and what
 * you see here is what will be published.
 */

const OUT_DIR = resolve(process.cwd(), "out");
const PORT = Number(process.env.PORT ?? 4000);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

async function main(): Promise<void> {
  if (!existsSync(OUT_DIR)) {
    throw new Error("No out/ directory — run `npm run build` first.");
  }

  const { site } = await import("../lib/config");
  const base = site.basePath;
  const home = `http://localhost:${PORT}${base}/`;

  createServer((request, response) => {
    const path = decodeURIComponent((request.url ?? "/").split("?")[0] ?? "/");

    // Anything outside the base path is not part of this site; send the reader
    // to where it actually starts rather than a bare 404.
    if (base !== "" && !path.startsWith(`${base}/`) && path !== base) {
      response.writeHead(302, { location: `${base}/` });
      response.end();
      return;
    }

    const file = resolveFile(path.slice(base.length));
    if (!file) {
      serve(response, join(OUT_DIR, "404.html"), 404);
      return;
    }
    serve(response, file, 200);
  }).listen(PORT, () => {
    console.log(`\nPreviewing the built site at ${home}`);
    if (base !== "") {
      console.log(`(served under ${base}, exactly as GitHub Pages will)`);
    }
    console.log("\nStop with Ctrl-C.\n");
  });
}

/** A request path to a file inside out/, or null if there is nothing there. */
function resolveFile(requestPath: string): string | null {
  // normalize collapses any "..", and the prefix check below refuses anything
  // that still climbs out of out/ — a preview server is still a server.
  const candidate = resolve(join(OUT_DIR, normalize(requestPath)));
  if (candidate !== OUT_DIR && !candidate.startsWith(OUT_DIR + sep)) {
    return null;
  }

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }
  const index = join(candidate, "index.html");
  return existsSync(index) ? index : null;
}

function serve(response: import("node:http").ServerResponse, file: string, status: number): void {
  if (!existsSync(file)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(status, {
    "content-type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream"
  });
  createReadStream(file).pipe(response);
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
