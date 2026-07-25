# Recipes

What to change when someone asks for something. **Read this before writing code.** Nearly every common request is already an option, and answering one by writing a new component or a new route is almost always the wrong move — it puts the blog off the path that the gate, the feed, and the docs all understand.

If a request is not here, say so rather than improvising something that looks like a feature.

## Writing

| The request | What to do |
| --- | --- |
| "Add a post" | Create `content/<collection>/<slug>.md` with `title` and `date`. Nothing else. |
| "Hide this post for now" | Add `draft: true` to its frontmatter. |
| "Publish that draft" | Remove the `draft: true` line. |
| "This post was updated" | Add `updated: YYYY-MM-DD`. |
| "A guest wrote this one" | Add `author: Their Name` to that post's frontmatter. |
| "Add a summary under the title" | Add `description:` to its frontmatter. |
| "Delete a post" | Delete the file. There is no index to update. |

## Structure

| The request | What to do |
| --- | --- |
| "Add an about page" (or colophon, now, uses) | Create `content/pages/about.md` with `title`. Add `nav: true` to put it in the menu. |
| "Change the front page wording" | Edit `content/pages/home.md`. Its title, description, and body are the front page. |
| "Show more/fewer posts on the front page" | `home.latest` in `site.config.ts`. `0` removes the list. |
| "Add a section" (notes, reviews, photos, links) | Add to `collections` in `site.config.ts`, then create `content/<name>/`. Never add a route file. |
| "Put this section in a different order" | `sort` on that collection: `date-desc`, `date-asc`, or `title`. |
| "Publish it but keep it out of the menu" | `nav: false` on that collection. |
| "Add tags" | Add `tags: [one, two]` to a post's frontmatter. Tag pages appear on their own. |
| "Let people browse tags from the menu" | `tags: { nav: true }` in `site.config.ts`. |
| "Reorder the menu" | `navOrder` on a page, or write `nav` out by hand in `site.config.ts` for full control. |
| "Show pictures instead of a list" | `indexLayout: "grid"` on that collection. Uses each entry's `image`. |
| "Add a contents list to long posts" | `toc: true` on that collection. Appears once a post has three headings. |
| "These posts are a series" | `series: The Name` in each post's frontmatter, plus `seriesPart: 1`, `2`… if the order is not the date order. |
| "Show related posts" | Already on wherever posts share tags. Untagged posts show nothing. |

## Appearance

| The request | What to do |
| --- | --- |
| "Make it warmer / greener / different" | `theme.preset` in `site.config.ts`: `ink`, `rust`, or `forest`. |
| "Change one specific color" | Edit the token in `app/globals.css`. Never write a color into a component — the lint rule rejects it. |
| "Change the fonts" | `app/fonts.ts`, plus the matching `fontFamily` entry in `tailwind.config.ts`. |
| "Make the text wider/narrower" | `--measure` in `app/globals.css`. |
| "Hide the reading time" | `display.readingTime: false`. |
| "Add a copyright line" | `display.copyright` in `site.config.ts`. |

## In a post

| The request | What to do |
| --- | --- |
| "Add an image" | Put the file in `public/`, then `<photo src="/name.jpg" alt="..." caption="..."></photo>`, or plain Markdown `![alt](/name.jpg)`. |
| "Add several photos" | `<gallery images="/a.jpg|What a shows, /b.jpg|What b shows" caption="Optional"></gallery>`. |
| "Add a video" | `<video-embed url="<the YouTube or Vimeo link>"></video-embed>`. |
| "Highlight this paragraph" | `<callout>` , or `<callout kind="warning">`. |
| "Make the opening paragraph bigger" | `<lead>…</lead>`. |
| "Pull out a line, magazine style" | `<pull-quote source="Optional">…</pull-quote>`. |
| "Colour my code samples" | Already on. Put the language after the opening fence: ```` ```python ````. |
| "Add a picture at the top of the post" | `image: /name.jpg` and `imageAlt: what it shows` in the frontmatter. Also used for link previews and grid archives. |
| "I need a tag none of these give me" | Write it in `components/content/`, register it in `components/registry.tsx`. That is the only file to touch. |
| "I need new notation" (maths, diagrams) | Add the remark/rehype plugin to `contentPlugins` in `components/registry.tsx`. Never edit `Markdown.tsx`. |

**Every custom tag needs a closing tag.** `<photo ... />` silently swallows the rest of the post; `make check` catches it and names the line.

## Reach and publishing

| The request | What to do |
| --- | --- |
| "Add my email / GitHub / Mastodon" | `social` in `site.config.ts`. Shown in the footer. |
| "Add comments" | The `comments` block in `site.config.ts`. Values come from https://giscus.app. |
| "Comments only on essays" | `comments.collections: ["posts"]`. |
| "Where is the RSS feed?" | `/feed.xml`, always on. `feed: false` on a collection excludes it. |
| "Keep this out of search engines" | The sitemap is generated from published content; make the post a draft instead. |
| "Make my recipes show up properly on Google" | Already done — a `recipe` collection emits schema.org Recipe markup from its declared fields. |
| "Make shared links show a picture" | Give the post an `image` and `imageAlt`. |
| "People want to print my recipes" | Already handled; a print stylesheet drops the chrome and writes out link URLs. |
| "Publish the site" | `make deploy`. First time only: Settings → Pages → Source → GitHub Actions. |
| "Use my own domain" | Set `url` to `https://yourdomain.com`. The `CNAME` file is written automatically. |
| "Change the site icon" | Replace `public/favicon.svg`. Nothing else to edit. |
| "It deployed with no styling" | `url` is wrong. It must be the full published address, including the repository subdirectory on GitHub Pages. |

## Make it another kind of blog

A collection can declare its own frontmatter and pick how its entries render. This is how one framework serves a food blog, a travel blog, and a research blog without any of them editing framework code.

**Declaring fields is the first step, and often the only one.** Declared fields are validated on every file in the collection and shown under the entry's title automatically — no component work:

```ts
{
  name: "trips",
  label: "Travels",
  route: "/travels",
  fields: {
    country: { type: "text", required: true },
    visited: { type: "date" },
    coordinates: { type: "list", display: false }
  }
}
```

Types are `text`, `number`, `boolean`, `date`, `list`, and `choice` (which needs `options`). Add `required: true` to make a missing value fail the build, `label` to name it, and `display: false` to keep a field out of the automatic list while still validating and storing it.

**A layout is the second step, when the arrangement itself matters.** A recipe wants its ingredients beside the method, not in a row of labels:

```ts
{
  name: "recipes",
  label: "Recipes",
  route: "/recipes",
  layout: "recipe",
  fields: {
    servings: { type: "number", required: true },
    prepMinutes: { type: "number" },
    cookMinutes: { type: "number" },
    ingredients: { type: "list", required: true },
    difficulty: { type: "choice", options: ["easy", "medium", "hard"] }
  }
}
```

Create `content/recipes/`, and every file in it is checked against that shape.

To write a layout of your own, copy `components/content/RecipeArticle.tsx`, add it to `entryLayouts` in `components/layouts.tsx`, and add its name to `ENTRY_LAYOUTS` in `lib/config/define.ts` so a typo is caught by the gate.

### Four blueprints

Copy the collection that fits, then create the matching folder under `content/`.

**A food blog.** The recipe layout puts ingredients beside the method; the grid archive shows cover photos; schema.org Recipe markup is emitted from these fields automatically.

```ts
{
  name: "recipes", label: "Recipes", route: "/recipes",
  layout: "recipe", indexLayout: "grid",
  fields: {
    servings: { type: "number", required: true },
    prepMinutes: { type: "number" },
    cookMinutes: { type: "number" },
    ingredients: { type: "list", required: true },
    difficulty: { type: "choice", options: ["easy", "medium", "hard"] }
  }
}
```

**A travel blog.** Trips are usually several posts, so use `series` in the frontmatter; `<gallery>` carries the photographs.

```ts
{
  name: "trips", label: "Travels", route: "/travels",
  indexLayout: "grid",
  fields: {
    country: { type: "text", required: true },
    visited: { type: "date" },
    coordinates: { type: "list", display: false }
  }
}
```

**A research blog.** Long pieces want a contents list; footnotes (`[^1]`) and syntax highlighting already work. For mathematics, add `remark-math`/`rehype-katex` to `contentPlugins`.

```ts
{
  name: "papers", label: "Papers", route: "/papers",
  toc: true,
  fields: {
    authors: { type: "list" },
    doi: { type: "text", label: "DOI" },
    status: { type: "choice", options: ["draft", "preprint", "published"] },
    venue: { type: "text" }
  }
}
```

**A writing blog.** The default. Declare nothing; `series` handles multi-part essays.

```ts
{ name: "posts", label: "Writing", route: "/writing" }
```

## Moving an existing blog in

Given a URL, port it with `tools/importloop/` — snapshot the source once, then write Markdown against gates that check nothing was lost:

```bash
npm run import:init     -- oldblog https://old.example.com
npm run import:snapshot -- oldblog
npm run import:verify   -- oldblog
```

`import:verify` runs offline against the committed snapshot and exits non-zero while work remains, so it drives an autonomous loop directly. `npm run --silent import:spec -- oldblog > SPEC.md` writes the specification whose ACCEPT lines are exactly those gates.

Do not paraphrase while importing. The fidelity gate measures how much of the author's wording survived, and a rewritten sentence is a lost one. See `tools/importloop/README.md`.

## Not supported

Say so plainly rather than building one of these unasked:

- **Math, out of the box.** It is three lines away: `npm install remark-math rehype-katex`, add them to `contentPlugins` in `components/registry.tsx`, and import `katex/dist/katex.min.css` in `app/layout.tsx`.
- **Search.** No built-in search. Pagefind over the exported `out/` is the natural fit if it is genuinely wanted.
- **Pagination.** Archives list every entry.
- **Scheduled publishing.** A post dated in the future publishes immediately; use `draft: true` and remove it on the day.
- **Related posts, series, and reading order** beyond the previous/next links within a collection.
- **Newsletters, analytics, and likes.** All need a third party; none are wired in.
- **More than one language.** `locale` sets the page language; there is no translation system.

## Rules that outrank any request

1. **Never add a route file.** `app/[...slug]/page.tsx` serves every collection, page, and tag. If a URL does not resolve, fix `lib/routes.ts`.
2. **Never write a color literal** in `app/` or `components/`. Tokens only.
3. **Never reformat `content/`.** It belongs to the writer; Prettier is configured to leave it alone.
4. **Never let a bad post through quietly.** Validation failures stop the build on purpose.
5. **Run `make check` before saying anything is done.** It also prints the blog's shape — collections, layouts, fields, pages, tags — which is the quickest way to see that what you built is what you meant.
