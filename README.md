# openblog

A blog you own, written in Markdown, published to the web for free.

You write posts as plain text files. openblog turns them into a fast, static website and publishes it to GitHub Pages every time you save your work. There is no database, no hosting bill, no admin panel, and nothing running on a server that can break at three in the morning.

## Starting from nothing

You need three things, all free. If you have a coding assistant, hand it this
section and it will do most of the typing.

**1. A GitHub account.** Sign up at [github.com](https://github.com). This is
where your writing lives and where the site is published from — you do not need
to know how to use it beyond this page.

**2. Your own copy of openblog.** On the openblog repository, press
**Use this template → Create a new repository**. Do not press Fork; a template
gives you a clean copy that is yours.

The name you give that repository decides your blog's web address:

| Repository name | Your blog lives at |
| --- | --- |
| `blog` | `https://<your-username>.github.io/blog` |
| `<your-username>.github.io` | `https://<your-username>.github.io` |

The second is the tidier address, and you get one per account. Either is fine,
but pick now — changing it later means changing one line and republishing.

**3. The tools to run it.** You need [Node.js 20 or newer](https://nodejs.org)
and Git. On a Mac, Git arrives with the Xcode command line tools
(`xcode-select --install`); on Windows, install
[Git for Windows](https://git-scm.com/download/win).

## Getting it onto your machine

```bash
git clone https://github.com/<your-username>/<your-repository>.git my-blog
cd my-blog
make dev     # installs everything, once
make run     # opens the blog at http://localhost:3000
```

Leave `make run` going while you write — the site reloads as you save.

> **On Windows**, `make` is not installed by default. Use the **Git Bash**
> terminal that came with Git for Windows, or run the underlying npm scripts
> directly — `npm install`, `npm run dev`, `npm run build`. The `Makefile`
> lists what each `make` command actually runs.

## Making it yours

Open `site.config.ts`. It holds your blog's name, your name, its description,
and the address it will live at. Change those four things and the whole site
follows.

The `url` must be the address from the table above — the one your repository
name gave you. Get it wrong and the published site loads without any styling,
so `make deploy` checks it against your repository before publishing anything
and tells you the exact line to write if it does not match.

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

Once, and only once: in your repository on github.com, go to
**Settings → Pages** and set **Source** to **GitHub Actions**. Nothing else
there needs touching.

Then, whenever you want the world to see your writing:

```bash
make deploy
```

That checks the address is right, checks the writing for problems, builds the
site, and pushes it. GitHub publishes a minute or two later; you can watch it
finish under the **Actions** tab of your repository.

If anything is wrong — a mistyped date, a link to a page that does not exist, an
address that does not match your repository — it stops and names the file and
the line, before anything reaches the web.

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
