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
| `tags` | No | A list, written `tags: [maps, travel]`. Creates tag pages automatically. |

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

## Components

These tags work in any post, alongside ordinary Markdown.

**A callout**, for something a reader should not skim past:

```markdown
<callout>Ordinary aside.</callout>

<callout kind="warning">Something that could go wrong.</callout>
```

**A photo with a caption.** Put the file in `public/` and link it from the site root:

```markdown
<photo src="/harbour.jpg" alt="Fishing boats at low tide" caption="Newlyn, March"></photo>
```

Add `wide="true"` to let a picture spread past the text on a wide screen.

**A video**, by pasting the ordinary YouTube or Vimeo link:

```markdown
<video-embed url="https://youtu.be/dQw4w9WgXcQ" title="How a lock works"></video-embed>
```

**A lead paragraph**, set larger, the way a magazine opens a feature:

```markdown
<lead>The tide was out, and the harbour was a field of mud.</lead>
```

### Always write the closing tag

```markdown
<photo src="/harbour.jpg" alt="Boats"></photo>   ✓
<photo src="/harbour.jpg" alt="Boats" />         ✗
```

The second form looks reasonable and is the one most people try, but HTML only allows a handful of built-in tags to close themselves that way. Any other tag written like that stays open, and the whole rest of your post becomes part of it — which means it disappears from the page. `make check` catches this and names the line, so you will not find out from a reader.

You can add your own tags like these. See "Adding a component" below.

## Tags

Add a list of tags to any post:

```markdown
tags: [maps, travel]
```

Pages listing everything under each tag appear on their own — `/tags` for the whole list, and `/tags/maps` for one of them. There is nothing to switch on, and nothing appears while no post has tags.

Tags are matched loosely, so `Web Design`, `web design`, and `web-design` are one tag. The first spelling you use is the one readers see. To put a Tags link in the navigation, set `tags: { nav: true }` in `site.config.ts`.

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

It is then available in every post as `<bookmark>`. Three rules, all from HTML rather than from openblog: tag names must be lowercase; attributes always arrive as strings, so `<bookmark count="3">` gives your component `"3"` and not `3`; and the tag needs a closing tag when it is used, as above. Avoid naming a tag after a real HTML element like `figure` or `video` — the name would also capture that element wherever Markdown produces one.

`components/content/Callout.tsx` is a small working example to copy.

## Changing how it looks

Every color on the site is defined once, at the top of `app/globals.css`, for both the light and dark themes. Change a value there and it changes everywhere — nothing else names a color, and `make check` fails if any code tries to.

The two typefaces are set in `app/fonts.ts`.

## Before you publish

```bash
make check
```

This checks that every post's frontmatter is valid, that no link points at a page which does not exist, and that nothing is misspelled. It names the file and the line for anything it finds. `make deploy` runs it for you, so a broken post cannot reach the web.
