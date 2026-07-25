# Dev workflow. `make dev` once after cloning; `make check` before every commit.
# Every leg caches (eslint --cache, prettier --cache, tsc --incremental,
# cspell --cache), so a warm no-change gate costs seconds.
.PHONY: check types test lint spell content contrast fmt hooks dev run build preview deploy clean

# The gate — run all of it before declaring work done. CI runs exactly this.
#
# `npm run check` is the same set of legs in one npm script, for Windows and
# anywhere else without make. Keep the two in step: if a leg is added here, add
# it there.
check: types test lint spell content contrast

types:
	npm run typecheck

test:
	npm test

lint:
	npm run lint
	npm run format:check

spell:
	npm run spellcheck

# Validates site.config.ts, every post's frontmatter, and every internal link.
content:
	npm run content:check

# Checks every theme palette for readable colour contrast.
contrast:
	npm run contrast:check

# Auto-fix what the gate would flag: lint violations, then formatting.
fmt:
	npm run lint:fix
	npm run format

# Wire the repo's git hooks (also run by npm's `prepare` on install).
hooks:
	git config core.hooksPath .githooks

# One-shot setup for a fresh clone: dependencies plus the git hooks.
dev: hooks
	npm install

# Start the local preview server at http://localhost:3000.
run:
	npm run dev

build:
	npm run build

preview:
	npm run preview

# Check, build, then push — GitHub publishes from there.
deploy:
	./scripts/deploy.sh

clean:
	rm -rf .next .next-dev out node_modules .eslintcache .cspellcache tsconfig.tsbuildinfo
