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
| "Add a video" | `<video-embed url="<the YouTube or Vimeo link>"></video-embed>`. |
| "Highlight this paragraph" | `<callout>` , or `<callout kind="warning">`. |
| "Make the opening paragraph bigger" | `<lead>…</lead>`. |
| "Colour my code samples" | Already on. Put the language after the opening fence: ```` ```python ````. |
| "I need something none of these do" | Write it in `components/content/`, register it in `components/registry.tsx`. That is the only file to touch. |

**Every custom tag needs a closing tag.** `<photo ... />` silently swallows the rest of the post; `make check` catches it and names the line.

## Reach and publishing

| The request | What to do |
| --- | --- |
| "Add my email / GitHub / Mastodon" | `social` in `site.config.ts`. Shown in the footer. |
| "Add comments" | The `comments` block in `site.config.ts`. Values come from https://giscus.app. |
| "Comments only on essays" | `comments.collections: ["posts"]`. |
| "Where is the RSS feed?" | `/feed.xml`, always on. `feed: false` on a collection excludes it. |
| "Keep this out of search engines" | The sitemap is generated from published content; make the post a draft instead. |
| "Publish the site" | `make deploy`. First time only: Settings → Pages → Source → GitHub Actions. |
| "Use my own domain" | Set `url` to `https://yourdomain.com`. The `CNAME` file is written automatically. |
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

| Blog | Fields worth declaring | Layout |
| --- | --- | --- |
| Food | `servings`, `prepMinutes`, `cookMinutes`, `ingredients`, `difficulty` | `recipe` |
| Travel | `country`, `visited`, `coordinates` | `default` is usually enough |
| Research | `authors`, `doi`, `status`, `published` | `default`, or one showing an abstract |
| Writing | none | `default` |

## Not supported

Say so plainly rather than building one of these unasked:

- **Math.** No KaTeX or MathJax; `$…$` renders literally.
- **Structured data (JSON-LD).** Recipe and article rich results are not emitted.
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
5. **Run `make check` before saying anything is done.**
