# Writing for your blog

Everything you publish is a Markdown file under `content/`. This is the reference for what goes in one.

## A post

```markdown
---
title: A morning walk
date: 2026-07-25
description: One sentence that appears under the title in the archive.
---

Your first paragraph starts here.
```

The block between the two `---` lines is the frontmatter — facts about the post rather than the post itself. Everything after it is the writing.

Save it as `content/posts/a-morning-walk.md` and it publishes at `/writing/a-morning-walk`. Lowercase words joined by hyphens make the best filenames: they become the web address, and addresses with spaces or capitals cause trouble elsewhere.

## Frontmatter

| Field | Required | What it does |
| --- | --- | --- |
| `title` | Yes | The heading readers see, and the link text in the archive. |
| `date` | Yes | Where the post falls in the list. Must be `YYYY-MM-DD`. |
| `description` | No | The line under the title in the archive, and the preview when the link is shared. |
| `draft` | No | `true` hides the post from the published site. |
| `updated` | No | A revision date, shown next to the original. Also `YYYY-MM-DD`. |
| `author` | No | Overrides the site author for this post alone. |

Dates must be written year-month-day. `2026-07-25` is right; `July 25 2026` and `07/25/2026` are both rejected when you run `make check`, because guessing which number is the month is how a blog ends up with posts dated in the wrong order.

Anything else you add is ignored, so you can keep your own notes in the frontmatter without breaking anything.

## Drafts

Add `draft: true` and the post disappears from the published site but stays visible while you are writing with `make run`. Remove the line when you are ready. Nothing else needs to happen — there is no separate folder for unfinished work.

## Formatting

| To get | Write |
| --- | --- |
| **Bold** | `**bold**` |
| *Italic* | `*italic*` |
| A link | `[the text](https://example.com)` |
| A link within your blog | `[the archive](/writing)` |
| A heading | `## Heading` |
| A quotation | `> Quoted line` |
| A list | `- Item` on each line |
| A numbered list | `1. Item` on each line |
| `Code` | `` `code` `` |
| An image | `![Description](/photo.jpg)` |
| A horizontal rule | `---` |

Tables, ~~strikethrough~~, and task lists work too.

Start headings at `##`. The post's title is already the `#` on the page, and a second one confuses both readers and search engines.

Images go in the `public/` folder and are linked from the site root: a file at `public/photo.jpg` is written `![Description](/photo.jpg)`. Always describe the image in the square brackets — that description is what someone using a screen reader hears.

## Callouts

For something a reader should not skim past:

```markdown
<callout>Ordinary aside.</callout>

<callout kind="warning">Something that could go wrong.</callout>
```

You can add your own tags like this one. See "Adding a component" below.

## Adding a section

A section — openblog calls it a collection — is a kind of writing with its own page. To add one, open `site.config.ts`:

```ts
collections: [
  { name: "posts", label: "Writing", route: "/writing" },
  { name: "notes", label: "Notes", route: "/notes" }
]
```

Then create the folder `content/notes/` and put a Markdown file in it. The section gets its own archive page, a page per entry, a link in the navigation, and its own entries in the feed. There is nothing else to set up.

Options: `sort` takes `date-desc` (newest first, the default), `date-asc`, or `title`. `nav: false` publishes the section without listing it in the navigation. `feed: false` keeps it out of the RSS feed.

## Adding a component

Write it in `components/content/`, then register it in `components/registry.tsx`:

```tsx
export const contentComponents = {
  callout: Callout,
  bookmark: Bookmark
};
```

It is then available in every post as `<bookmark>`. Two rules, both from HTML rather than from openblog: tag names must be lowercase, and attributes always arrive as strings, so `<bookmark count="3">` gives your component `"3"` and not `3`.

`components/content/Callout.tsx` is a small working example to copy.

## Changing how it looks

Every color on the site is defined once, at the top of `app/globals.css`, for both the light and dark themes. Change a value there and it changes everywhere — nothing else names a color, and `make check` fails if any code tries to.

The two typefaces are set in `app/fonts.ts`.

## Before you publish

```bash
make check
```

This checks that every post's frontmatter is valid, that no link points at a page which does not exist, and that nothing is misspelled. It names the file and the line for anything it finds. `make deploy` runs it for you, so a broken post cannot reach the web.
