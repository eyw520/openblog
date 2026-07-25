# openblog

A blog you own, written in Markdown, published to the web for free.

You write posts as plain text files. openblog turns them into a fast, static website and publishes it to GitHub Pages every time you save your work. There is no database, no hosting bill, no admin panel, and nothing running on a server that can break at three in the morning.

## What you need

- A [GitHub](https://github.com) account.
- [Node.js 20 or newer](https://nodejs.org).
- A text editor, or a coding assistant that can edit files for you.

## Getting started

```bash
git clone https://github.com/<username>/openblog.git my-blog
cd my-blog
make dev     # installs everything, once
make run     # opens the blog at http://localhost:3000
```

Leave `make run` going while you write — the site reloads as you save.

## Making it yours

Open `site.config.ts`. It holds your blog's name, your name, its description, and the address it will live at. Change those four things and the whole site follows.

The `url` matters more than it looks. It must be the full address your blog will have once published — for GitHub Pages that is `https://<username>.github.io/<repository>`, or just `https://yourdomain.com` if you have your own domain. Everything else, including the way stylesheets are linked, is worked out from it.

## Writing

Posts are Markdown files in `content/posts/`. Copy an existing one, rename it, and change the words:

```markdown
---
title: A morning walk
date: 2026-07-25
description: One sentence that appears under the title.
---

Your first paragraph.
```

The filename becomes the address, so `content/posts/a-morning-walk.md` is published at `/writing/a-morning-walk`. That is the whole system — there is no list to update and nothing to register.

[AUTHORING.md](AUTHORING.md) covers frontmatter, formatting, drafts, and adding new sections.

## Publishing

Once, in your repository's **Settings → Pages**, set **Source** to **GitHub Actions**.

After that:

```bash
make deploy
```

It checks your blog for problems, builds it, and pushes. GitHub publishes it a minute or so later. If anything is wrong — a mistyped date, a link to a page that does not exist — it stops and tells you which file and which line, before anything reaches the web.

## Commands

| Command | What it does |
| --- | --- |
| `make run` | Preview the blog on your own machine |
| `make check` | Check everything: types, tests, formatting, spelling, links |
| `make fmt` | Fix formatting automatically |
| `make build` | Build the finished site into `out/` |
| `make deploy` | Check, build, and publish |

## Using a coding assistant

Most of what people want from a blog is already a setting here, and [RECIPES.md](RECIPES.md) lists them: what someone asks for on the left, the one thing to change on the right. Point your assistant at it and ask for what you want in plain words — "add an about page", "make it warmer", "let people comment" — and it will find the existing option instead of inventing something.

[CLAUDE.md](CLAUDE.md) is the map of the codebase itself: its structure, its rules, and the reasons behind them. Read it before changing code.

## License

MIT.
