# openblog

See README.md for the human-facing overview.
This file is the map, invariants, and conventions for working in the code — don't duplicate one into the other.

@AGENTS.md

## Overview

Greenfield: the repo holds the engineering conventions and nothing else yet.
The stack is unchosen beyond "node" — replace this paragraph with what the code actually becomes.

## Layout

| Path | What lives there |
| --- | --- |
| `.githooks/` | Commit-message gate, pre-commit gate, secret scan. `core.hooksPath` points here. |
| `AGENTS.md` | Shared engineering conventions. |
| `Makefile` | The verb contract: `check`, `fmt`, `hooks`, `dev`. |

## Invariants (do not violate)

- `.githooks/commit-msg` is the source of truth for commit types and scopes — this repo is scopeless (`<type>: Subject.`) over types `feat|fix|chore|clean|revert`.
  Docs point at the hook, never the reverse.

## Conventions (project-specific)

<stack pins, patterns, naming, test markers — anything beyond AGENTS.md>

## Gotchas

- The Makefile's gate legs are guarded on `package.json` existing and no-op until it does, so `make check` is green on an empty tree.
  That guard is what lets the pre-commit hook pass before the app exists; delete it with the first real toolchain, or the gate stays silently empty.
