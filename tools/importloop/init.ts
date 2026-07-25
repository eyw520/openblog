import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { type ImportContract, sourceDir } from "./contract";

/** Writes a starting import.json so nobody has to remember its shape. */
function main(): void {
  const [slug, url] = process.argv.slice(2);
  if (!slug || !url) {
    console.error("usage: npm run import:init -- <slug> <url>");
    process.exitCode = 1;
    return;
  }

  const dir = sourceDir(slug);
  const file = join(dir, "import.json");
  if (existsSync(file)) {
    console.error(`${file} already exists; edit it rather than starting again.`);
    process.exitCode = 1;
    return;
  }

  const contract: Omit<ImportContract, "slug"> = {
    url,
    collection: "posts",
    accept: "human",
    // Most feeds carry an excerpt, not the post. Fetching each page is the
    // slower, correct default; turn it off if the feed has full content.
    fetchPages: true,
    gates: {
      // Starts below 1 so an import in progress reports progress rather than
      // one long failure. Raise it to 1 when every post is meant to be across.
      coverage: { minimum: 0.0 },
      metadata: true,
      fidelity: { minimum: 0.9 },
      assets: true
    }
  };

  mkdirSync(dir, { recursive: true });
  writeFileSync(file, `${JSON.stringify(contract, null, 2)}\n`);

  console.log(`wrote tools/importloop/sources/${slug}/import.json`);
  console.log(`\nnext:\n  npm run import:snapshot -- ${slug}\n  npm run import:verify -- ${slug}\n`);
}

main();
