# Dev workflow. `make dev` once after cloning; `make check` before every commit.
# Every leg must cache: eslint --cache, prettier --cache (on check AND write),
# tsc --incremental (set "incremental": true in tsconfig; gitignore *.tsbuildinfo),
# cspell --cache. A warm no-change gate should cost seconds.
.PHONY: check lint types test fmt hooks dev

# Wire the repo's commit-message hook (dormant until core.hooksPath points at it).
# Node repos may prefer the npm `prepare` script: "prepare": "git config core.hooksPath .githooks"
hooks:
	git config core.hooksPath .githooks

ifeq ($(wildcard package.json),)

# No toolchain yet. The gate legs have nothing to run against an empty tree, so
# `make check` reports green by reporting nothing — which is what lets the
# pre-commit hook pass before the app exists. Delete this branch (through
# `else`) the moment package.json lands; the real legs are below it.
check lint types test fmt:
	@echo "$@: no package.json yet — nothing to run."

dev: hooks
	@echo "dev: no package.json yet — scaffold the app, then rerun."

else

# The gate — run all of it before declaring work done.
check: types lint test

lint:
	npm run lint
	npm run format:check

types:
	npm run typecheck

test:
	npm test

# Auto-fix what the gate would flag: style, formatting.
fmt:
	npm run format

# One-shot setup for a fresh clone: dependencies plus the commit hook.
dev: hooks
	npm install

endif
