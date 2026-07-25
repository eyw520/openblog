# importloop

Moving an existing blog into openblog, verifiably.

An agent is given a URL and writes Markdown. This harness never writes any of
it — it decides whether what was written is faithful to the source, and says
what is wrong when it is not. That division is deliberate: a harness that did
the importing could not also be trusted to judge it.

## The three commands

```bash
npm run import:init     -- <slug> <url>   # write the job's import.json
npm run import:snapshot -- <slug>         # read the source, once
npm run import:verify   -- <slug>         # check the import, offline, repeatedly
npm run import:spec     -- <slug>         # print a SPEC.md whose ACCEPT lines are the gates
```

`import:verify` exits non-zero while work remains, so it is directly usable as
an autonomous loop's verify command.

## Why a snapshot

The source site is read exactly once, into `sources/<slug>/snapshot.json`, which
is committed. Every gate compares against that file and never touches the
network.

The network is the only part of this that could answer the same question two
different ways, so it is taken out of the loop entirely. An agent iterating
against the fidelity gate would otherwise re-fetch somebody's blog every few
seconds; here that is impossible by construction, the loop runs in
milliseconds, and two runs a week apart give the same verdict.

`snapshot.ts` identifies itself, honours robots.txt, and waits between requests.
Import writing you have the right to republish — usually your own, moving house.

## Why it compares words, not appearance

The obvious way to check a port is to compare the two sites side by side. That
cannot work here: openblog deliberately imposes its own design, so a screenshot
of the source and a screenshot of the import *should* differ, and a visual
comparison would fail every time regardless of how good the import was.

So the reference is the source's content. The gates measure how much of the
writing survived, and say nothing about how it looks.

## The gates

| Gate | Asks |
| --- | --- |
| `coverage` | Does every source post have an entry? Set below 1 while importing; it then reports progress rather than one long failure. |
| `metadata` | Do titles and dates say what the source said? |
| `fidelity` | Did the words survive? Multiset recall of the source's wording — adding is free, dropping is not. A summarized post scores near zero. |
| `assets` | Does every image an entry references exist in `public/`? |

Fidelity is the one that matters. It is one-sided on purpose: an import may gain
a heading or an attribution without penalty, but it cannot quietly lose a
paragraph, and a truncated post fails without needing a separate length rule.

## Pairing

A source post is matched to an entry by `mapping` in `import.json`, then by the
last segment of its URL, then by its title. Nothing fuzzier — a near-miss match
would pair two different posts and report the result as bad writing rather than
bad matching. An unmatched post is named, with its URL.

## What it does not do

- **Convert anything.** No HTML-to-Markdown. The agent writes the prose, and the
  gate checks it; a converter here would make the work trivial and unverified.
- **Crawl.** It reads a feed, or failing that a sitemap. It does not follow links.
- **Extract cleverly.** Page extraction is `<article>`, then `<main>`, then the
  body. A smarter guess would be wrong more quietly — and when this guesses
  badly, fidelity fails loudly, which is the outcome worth having. Prefer a feed
  with full content.
