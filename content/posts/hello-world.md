---
title: Hello world
date: 2026-07-01
description: The first post, and how to replace it with one of your own.
---

This file is a post. It lives at `content/posts/hello-world.md`, and everything above the second `---` is its frontmatter — the handful of facts the blog needs in order to list it, date it, and describe it.

To write your own, copy this file, give it a new name, and change the words. The filename becomes the last part of the web address, so `content/posts/a-good-morning.md` publishes at `/writing/a-good-morning`. Lowercase words joined by hyphens read best and travel well.

## What the frontmatter means

Only two lines are required. `title` is what readers see at the top of the post and in the archive. `date` decides where the post falls in the list, and must be written year-month-day, like `2026-07-01`.

Everything else is optional. `description` is the sentence under the title in the archive, and the one that shows up when someone shares a link. Add `draft: true` while a post is unfinished — it stays visible when you run the blog on your own machine and disappears from the published site, so you can leave work in progress in the folder without publishing it by accident.

## Deleting this post

Delete the file. There is nothing else to clean up — no index to update, no list to edit. The archive is built from whatever files are in the folder at the moment the site is built.
## Going beyond Markdown

Sometimes a paragraph needs to stand apart from the ones around it. Markdown has no way to say that, so openblog lets you register your own tags:

<callout kind="warning">
Deleting a post removes it from the feed. Anyone who already read it keeps their copy, but the link will break for everyone else.
</callout>

That box is a component, written in `components/content/Callout.tsx` and registered in `components/registry.tsx`. Add your own the same way — the registry is the only file you touch, and the new tag works in every post immediately.
