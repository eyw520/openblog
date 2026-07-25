---
title: Adding a section to your blog
date: 2026-05-18
description: How collections work, and why there is no routing to write.
---

A blog usually outgrows a single stream of posts. You start with essays, then want somewhere to put short notes, or reading logs, or photographs — things that deserve their own page rather than being mixed into the main list.

In openblog that is one edit. Open `site.config.ts` and add to `collections`:

```ts
collections: [
  { name: "posts", label: "Writing", route: "/writing" },
  { name: "notes", label: "Notes", route: "/notes" }
]
```

Then make a folder called `content/notes/` and put a Markdown file in it. That is the whole procedure. The new section gets its own archive page, a page for each entry, a link in the navigation bar, and its own entries in the feed.

## Why it works this way

The alternative — a file somewhere that lists your sections, a second file that describes how their web addresses are built, a third that adds them to the menu — is how most sites do it, and it is why adding a section to most sites is a chore. Every one of those files is a chance to forget a step and end up with a page that exists but cannot be reached.

Here the configuration is the only description of your blog's shape, and everything else is derived from it. There is nothing to keep in sync because there is only one copy.

## Settings worth knowing

`sort` controls the order of a section's archive. It defaults to newest first; `date-asc` runs oldest first, which suits a series meant to be read in order, and `title` sorts alphabetically, which suits a reference list.

`nav: false` keeps a section out of the navigation bar while still publishing it — useful for something you want to link to yourself rather than advertise. `feed: false` keeps it out of the RSS feed, which is worth doing for sections that are not really writing.
