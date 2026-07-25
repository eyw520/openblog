# openblog — a Markdown-first blog framework that deploys itself to GitHub Pages

**Answering a request? Read RECIPES.md first.** It maps what people ask for onto the option that already does it. Almost every common request is configuration, not code, and building a bespoke answer to one is the most likely way to damage this codebase.

See README.md for the human-facing overview and AUTHORING.md for the writer's guide.
This file is the map, invariants, and conventions for working in the code — don't duplicate one into the other.

@AGENTS.md

## Overview

A static blog generator built on Next.js 15 (App Router, `output: "export"`).
Content is Markdown read from disk at build time; there is no server, no database, and no runtime data fetching anywhere.
The people using this framework are mostly not programmers — they drive it through an agent, so an error message is a user interface and should read like one.

## Commands

```bash
make run       # dev server on :3000
make check     # the gate: typecheck, tests, lint, format, spellcheck, content
make fmt       # auto-fix lint and formatting
make build     # static export to out/
make deploy    # check, build, push (GitHub Actions publishes)
```

Node 20 (`.nvmrc`).

## Layout

| Path | What lives there |
| --- | --- |
| `RECIPES.md` | Request → option. The first place to look, and the file to update when an option is added. |
| `site.config.ts` | The blog owner's settings. The root of almost every derived value. |
| `content/` | Authored Markdown, one folder per collection. Never reformat it. |
| `app/` | Routes, root layout, `globals.css` theme tokens, fonts. |
| `app/[...slug]/` | The single catch-all serving every collection index, entry, page, and tag. |
| `components/registry.tsx` | Extension point one: custom Markdown tags, and extra Markdown syntax via `contentPlugins`. |
| `components/layouts.tsx` | Extension point two: how a collection's entries and its archive render. |
| `public/` | Static files served from the site root. `favicon.svg` lives here. |
| `components/layout/`, `components/content/` | Chrome, and the content renderers. |
| `lib/config/` | Config types, validation, and resolution. Pure. |
| `lib/content/` | Frontmatter parsing, per-collection field schemas, sorting, the reader. |
| `lib/routes.ts` | Maps URL segments to a collection index, entry, page, or tag. Pure. |
| `lib/structured-data.ts` | schema.org JSON-LD for an entry. Pure. |
| `lib/paths.ts` | Applies the base path to raw hrefs Markdown produces. |
| `services/content/` | `server-only` re-export of the reader, for pages to import. |
| `scripts/` | The content checker, the export finalizer, the test runner, deploy. |

## Invariants (do not violate)

- **Never add a route file for a collection.** Collections are declared in `site.config.ts` and served by `app/[...slug]/page.tsx`. A new route file means the config abstraction has been abandoned; fix the resolver in `lib/routes.ts` instead.
- **Never write a color literal in `app/` or `components/`.** Every color is a token in `app/globals.css`, so one file restyles the site. ESLint fails the build on hex and `rgb()`/`hsl()` literals — the rule exists because a literal silently breaks every user's theme override.
- **Three registries, no fourth mechanism.** Tags and Markdown plugins in `components/registry.tsx`; entry and archive layouts in `components/layouts.tsx`. A capability that does not fit one of those is probably a config option instead.
- **Every new capability is an option, not a code path.** Add it to `site.config.ts` with a validated default, then record it in RECIPES.md. An option nobody can discover is an option that does not exist.
- **`site.config.ts` is the only source of site identity.** `basePath`, canonical URLs, the feed, the sitemap, and the nav are all derived from its `url` and `collections`. Do not hardcode any of them.
- **Validation rules live in `lib/`, never in a script.** `scripts/check-content.ts` imports the real config loader and the real reader, so the gate cannot drift from the build. A checker that reimplements a rule is a checker that eventually disagrees with it.
- **Errors reaching a blog owner name the file, the field, and the fix.** Compare `lib/config/validate.ts` and `lib/content/entry.ts` before writing a new one.
- **A malformed post fails the build.** Never skip or silently drop content; an author who believes they published something must not be quietly wrong.

## Conventions

- `lib/` is pure and tested (`*.test.ts`, node:test via tsx). `services/` is thin `server-only` I/O over it. Push logic out of components into `lib/` and assert it there — there is no DOM test tier.
- Build output must be reproducible: sorting is stable, and the feed is dated from the newest entry rather than the clock.
- Dates are calendar days formatted in UTC (`lib/format-date.ts`). Never format a post date in local time; it shifts the day for readers west of UTC.
- Commit messages: `<type>: Sentence case ending with period.`, type ∈ feat|fix|chore|clean|revert. No scopes. Enforced by `.githooks/commit-msg`.

## Gotchas

- **`dark:prose-invert` is forbidden.** It replaces the typography plugin's color variables with its own dark palette, overriding every theme token. The tokens already flip with the `.dark` class.
- **`lib/content/read.ts` deliberately lacks `server-only`.** The gate script must import it, and `server-only` throws outside a React Server Component. `services/content/` adds the guard for pages; importing `node:fs` already keeps it out of client bundles.
- **Nothing reachable from `next.config.ts` may use the `@/` alias** — that includes everything `lib/config` imports. It loads outside webpack, where the alias does not exist.
- **`next.config.ts` imports `lib/config` with a relative path**, not `@/`. It loads outside webpack, where the alias does not exist.
- Dev and build use different output directories (`.next-dev` / `.next`), gated on `NEXT_BUILD_MODE`, so a running dev server cannot poison a production build.
- Drafts are included only when `NODE_ENV === "development"`, so `listEntries` returns different results in dev and build. That is intended.
- **Custom tags in Markdown cannot self-close.** `<photo ... />` stays open and swallows the rest of the post, because HTML only permits that for void elements. `scripts/check-content.ts` fails the gate on it.
- **Raw hrefs need `withBasePath`.** Next prefixes `<Link>` and its own assets, but not the plain `<a>`/`<img>` Markdown produces, so `components/registry.tsx` overrides both.
- `content/pages/home.md` is reserved for the front page and is deliberately not published at `/home`.
- **A layout name lives in two files**: the component in `components/layouts.tsx` and the name in `ENTRY_LAYOUTS`/`INDEX_LAYOUTS` in `lib/config/define.ts`. The duplication is deliberate — it is what lets the gate catch a typo instead of rendering the wrong page.
- **Heading anchors come from `github-slugger` on both sides** — `lib/content/headings.ts` for the contents list, `rehype-slug` for the ids. Never hand-roll a second slug function; the two must agree exactly.
- Config errors throw while `lib/config` is being imported. Scripts must import it *inside* their error handler, or the reader gets a stack trace instead of the guidance.
