import { join } from "node:path";

import { type GateResult, loadContract, loadSnapshot, sourceDir } from "./contract";
import {
  assetsGate,
  coverageGate,
  describeSnapshot,
  fidelityGate,
  metadataGate,
  strayEntries
} from "./gates";
import { type EntryLike, pairPosts } from "./match";

/**
 * The single command an iterating agent runs.
 *
 * Exit code 0 means the import is faithful (accept: "gates") or ready to be
 * read by a person (accept: "human"). Non-zero means there is work left, and
 * the output says which post and what is wrong with it — so this is directly
 * usable as an autonomous loop's verify command.
 *
 * It never touches the network: everything is compared against the committed
 * snapshot, so running it a hundred times costs nothing and the source site
 * never notices.
 */
async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug) {
    console.error("usage: npm run import:verify -- <slug>");
    process.exitCode = 1;
    return;
  }

  const { contract } = loadContract(slug);
  const snapshot = loadSnapshot(slug);

  // Imported through the real reader, so the gate sees exactly what the site
  // will build — including frontmatter validation, which fails first and loudly.
  const { listEntries } = await import("../../lib/content/read");
  const { site } = await import("../../lib/config");

  const collection = site.collections.find((candidate) => candidate.name === contract.collection);
  if (!collection) {
    throw new Error(
      `import.json points at a collection called "${contract.collection}", ` +
        `but site.config.ts declares: ${site.collections.map((c) => c.name).join(", ") || "none"}.`
    );
  }

  const entries: EntryLike[] = listEntries(collection.name).map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    date: entry.date,
    // listEntries returns metadata; the body comes from the same read.
    body: ""
  }));

  const { getEntry } = await import("../../lib/content/read");
  for (const entry of entries) {
    entry.body = getEntry(collection.name, entry.slug)?.body ?? "";
  }

  console.log(`importloop: verifying "${slug}"`);
  console.log(describeSnapshot(snapshot, join(sourceDir(slug), "snapshot.json")));
  console.log(`content/${collection.name}/ — ${entries.length} entr${entries.length === 1 ? "y" : "ies"}\n`);

  const pairings = pairPosts(contract, snapshot.posts, entries);
  const results: GateResult[] = [];

  if (contract.gates.coverage) {
    results.push(coverageGate(pairings, contract.gates.coverage.minimum));
  }
  if (contract.gates.metadata) {
    results.push(metadataGate(pairings));
  }
  if (contract.gates.fidelity) {
    results.push(fidelityGate(pairings, contract.gates.fidelity.minimum));
  }
  if (contract.gates.assets) {
    results.push(assetsGate(pairings, join(process.cwd(), "public")));
  }

  let failed = 0;
  for (const result of results) {
    console.log(
      `${result.passed ? "PASS" : "FAIL"}  ${result.gate}${result.summary ? ` — ${result.summary}` : ""}`
    );
    for (const failure of result.failures) {
      console.log(`      ${failure}`);
    }
    if (!result.passed) {
      failed += 1;
    }
  }

  const strays = strayEntries(entries, pairings);
  if (strays.length > 0) {
    console.log(
      `\nnote: ${strays.length} entr${strays.length === 1 ? "y" : "ies"} no source post accounts for`
    );
    console.log(`      ${strays.join(", ")}`);
    console.log("      Fine if you added them. If not, a slug is probably misspelled.");
  }

  if (failed > 0) {
    console.log(`\n${failed}/${results.length} gates failed\n`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `\nall ${results.length} gates passed` +
      (contract.accept === "human" ? " — ready for someone to read it before calling it done" : "") +
      "\n"
  );
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
