# Dev workflow. `make dev` once after cloning; `make check` before every commit.
# Every leg caches (eslint --cache, prettier --cache, tsc --incremental,
# cspell --cache), so a warm no-change gate costs seconds.
.PHONY: check types test lint spell fmt hooks dev run build preview clean

# The gate — run all of it before declaring work done. CI runs exactly this.
check: types test lint spell

types:
	npm run typecheck

test:
	npm test

lint:
	npm run lint
	npm run format:check

spell:
	npm run spellcheck

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

clean:
	rm -rf .next .next-dev out node_modules .eslintcache .cspellcache tsconfig.tsbuildinfo
