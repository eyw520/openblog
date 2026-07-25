import fs from "node:fs";
import path from "node:path";

import { site } from "../lib/config";

/**
 * The two things GitHub Pages needs that Next does not write.
 *
 * Both are handled here, once, so nobody deploying this blog has to learn about
 * either of them. Run as `postbuild`, against the exported out/ directory.
 */

const OUT_DIR = path.join(process.cwd(), "out");

function main(): void {
  if (!fs.existsSync(OUT_DIR)) {
    throw new Error("No out/ directory — run `npm run build` before finalizing the export.");
  }

  // 1. Pages runs Jekyll by default, and Jekyll ignores directories beginning
  //    with an underscore. Without this file, the whole _next/ folder — every
  //    stylesheet and script — is silently dropped from the published site.
  fs.writeFileSync(path.join(OUT_DIR, ".nojekyll"), "");

  // 2. A custom domain has to be declared in a CNAME file, or Pages serves the
  //    site from github.io and the domain 404s. Derived from `url` so the two
  //    can never disagree; a github.io URL needs no CNAME at all.
  const host = hostOf(site.url);
  const cnamePath = path.join(OUT_DIR, "CNAME");

  if (host !== null && !host.endsWith(".github.io")) {
    fs.writeFileSync(cnamePath, `${host}\n`);
    console.log(`Export finalized: .nojekyll written, CNAME set to ${host}.`);
    return;
  }

  // A leftover CNAME from a previous custom domain would hijack the site.
  if (fs.existsSync(cnamePath)) {
    fs.rmSync(cnamePath);
  }
  console.log("Export finalized: .nojekyll written, no custom domain configured.");
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

main();
