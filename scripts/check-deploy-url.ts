import { execFileSync } from "node:child_process";

/**
 * Checks that site.config.ts points at the repository this blog is pushed to.
 *
 * Run by `make deploy` before anything is published. A wrong `url` produces a
 * site that builds cleanly, deploys successfully, and then loads with no
 * styling at all — the single most confusing way for a first deploy to fail,
 * and the one nobody can debug from the symptom.
 */
async function main(): Promise<void> {
  const { site } = await import("../lib/config");
  const { checkDeployUrl } = await import("../lib/github-pages");

  const remote = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf-8" }).trim();
  const verdict = checkDeployUrl(site.url, remote);

  switch (verdict.kind) {
    case "match":
      console.log(`Publishing to ${site.url}`);
      return;

    case "custom-domain":
      console.log(`Publishing to ${site.url} (custom domain; a CNAME file is written for you)`);
      console.log(
        `Point ${verdict.host} at GitHub Pages with your domain registrar if you have not already.`
      );
      return;

    case "unknown-remote":
      console.log(`Publishing to ${site.url}`);
      console.log(`Could not check that against "${verdict.remote}" — it is not a GitHub address.`);
      return;

    case "mismatch":
      console.error("");
      console.error("The address in site.config.ts is not where this blog will be published.");
      console.error("");
      console.error(`  site.config.ts says:  ${verdict.found}`);
      console.error(`  but it will live at:  ${verdict.expected}`);
      console.error("");
      console.error("Deploying now would publish a site with no styling, because every");
      console.error("stylesheet would be looked for in the wrong place.");
      console.error("");
      console.error(`Open site.config.ts and set:  url: "${verdict.expected}"`);
      console.error("");
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
