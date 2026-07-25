import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

/**
 * A size budget for the exported site.
 *
 * A static blog is fast until somebody adds a chart library to one component
 * and nobody notices for six months. The limits below are the current build
 * with headroom, not aspirations — the point is to make growth a decision
 * rather than a drift.
 *
 * JavaScript is measured gzipped, because that is what a reader actually
 * downloads; the raw figure is roughly three times larger and would make the
 * budget look reassuring for the wrong reason.
 *
 * Run after `npm run build`. Raising a limit is fine when the weight buys
 * something; doing it without noticing is what this prevents.
 */

/** Every JavaScript chunk, gzipped. Currently ~243 kB. */
const MAX_JS_GZIP_KB = 300;

/** The whole exported site, fonts and all. GitHub Pages allows 1 GB. */
const MAX_TOTAL_MB = 25;

function main(): void {
  const out = join(process.cwd(), "out");
  if (!existsSync(out)) {
    throw new Error("No out/ directory — run `npm run build` first.");
  }

  const chunks = filesUnder(join(out, "_next", "static", "chunks"), ".js");
  const jsGzipKb = chunks.reduce((total, file) => total + gzipSync(readFileSync(file)).length, 0) / 1024;
  const totalMb = filesUnder(out).reduce((total, file) => total + statSync(file).size, 0) / 1024 / 1024;

  const problems: string[] = [];
  if (jsGzipKb > MAX_JS_GZIP_KB) {
    problems.push(
      `JavaScript is ${jsGzipKb.toFixed(0)} kB gzipped, over the ${MAX_JS_GZIP_KB} kB budget.\n` +
        `      Something new is being shipped to the browser. If it is worth it, raise\n` +
        `      MAX_JS_GZIP_KB in scripts/check-bundle-size.ts and say why in the commit.`
    );
  }
  if (totalMb > MAX_TOTAL_MB) {
    problems.push(
      `The site is ${totalMb.toFixed(1)} MB, over the ${MAX_TOTAL_MB} MB budget.\n` +
        `      Usually this is images. Resize them before adding, or raise the budget.`
    );
  }

  if (problems.length > 0) {
    console.error("\nThe built site is heavier than expected:\n");
    for (const problem of problems) {
      console.error(`  • ${problem}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log(
    `Size is within budget: ${jsGzipKb.toFixed(0)} kB JavaScript gzipped ` +
      `(limit ${MAX_JS_GZIP_KB}), ${totalMb.toFixed(2)} MB total (limit ${MAX_TOTAL_MB}).`
  );
}

/** Every file under a directory, optionally only one extension. */
function filesUnder(dir: string, extension?: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...filesUnder(path, extension));
    } else if (extension === undefined || entry.name.endsWith(extension)) {
      found.push(path);
    }
  }
  return found;
}

main();
