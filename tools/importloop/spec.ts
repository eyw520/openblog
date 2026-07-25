import { loadContract, loadSnapshot } from "./contract";

/**
 * Prints a SPEC.md strawman whose ACCEPT lines map onto the gates this job
 * enables, so an autonomous loop's specification and its verify command cannot
 * disagree about what "done" means.
 *
 *   npm run --silent import:spec -- <slug> > SPEC.md
 */
function main(): void {
  const slug = process.argv[2];
  if (!slug) {
    console.error("usage: npm run import:spec -- <slug>");
    process.exitCode = 1;
    return;
  }

  const { contract } = loadContract(slug);
  const snapshot = tryLoadSnapshot(slug);
  const total = snapshot?.posts.length;

  const accepts: string[] = [];
  if (contract.gates.coverage) {
    const share = Math.round(contract.gates.coverage.minimum * 100);
    accepts.push(
      `ACCEPT: \`npm run import:verify -- ${slug}\` reports coverage at or above ${share}%` +
        (total === undefined ? "" : ` of ${total} source posts`) +
        "."
    );
  }
  if (contract.gates.metadata) {
    accepts.push(`ACCEPT: every imported entry's title and date match the source exactly.`);
  }
  if (contract.gates.fidelity) {
    accepts.push(
      `ACCEPT: every imported entry retains at least ${Math.round(contract.gates.fidelity.minimum * 100)}% of its source wording.`
    );
  }
  if (contract.gates.assets) {
    accepts.push(`ACCEPT: every image an entry references exists under \`public/\`.`);
  }
  accepts.push("ACCEPT: `make check` exits 0.");

  console.log(`# Import ${contract.url} into openblog

## Goal

Reproduce the writing at ${contract.url} as entries in the \`${contract.collection}\` collection,
faithfully enough that no sentence is lost and no date is invented.

The design is deliberately not reproduced. openblog imposes its own; only the
words, the titles, the dates, and the pictures come across.

## Source of truth

\`tools/importloop/sources/${slug}/snapshot.json\` — a committed record of the source site${
    total === undefined ? "" : `, holding ${total} post(s)`
  }.
Everything is compared against it, offline. Do not re-snapshot mid-run: it would
move the target you are being measured against.

## Method

One post at a time. For each entry in the snapshot:

1. Create \`content/${contract.collection}/<slug>.md\`, where \`<slug>\` is the last
   path segment of the source URL.
2. Copy \`title\` and \`date\` from the snapshot exactly.
3. Rewrite the body as Markdown, keeping every sentence. Headings become \`##\`,
   quotes \`>\`, code fenced. Use openblog's own components where the source had
   something Markdown cannot say — see RECIPES.md.
4. For each image, save the file into \`public/\` and reference it from the site
   root (\`/name.jpg\`).
5. Run the verify command and fix what it names.

Do not paraphrase, summarize, or improve the writing. The fidelity gate measures
how much of the author's wording survived, and rewriting a sentence loses it.

## Accept

${accepts.join("\n")}

## Notes

- \`npm run import:verify -- ${slug}\` never touches the network and is safe to run
  as often as you like.
- Coverage below 100% is the normal state mid-import; it reports progress.
- A post the pairing cannot find is listed by URL. If you gave it a different
  slug on purpose, record that in \`mapping\` in \`import.json\`.
`);
}

function tryLoadSnapshot(slug: string): ReturnType<typeof loadSnapshot> | undefined {
  try {
    return loadSnapshot(slug);
  } catch {
    return undefined;
  }
}

main();
