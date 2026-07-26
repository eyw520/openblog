import { spawnSync } from "node:child_process";

// Points git at .githooks so the commit-message and pre-commit checks run.
// Invoked by npm's `prepare`, which means it runs on every install.
//
// It must never fail the install. A copy of this blog can perfectly well exist
// outside a git repository — someone downloading a ZIP from GitHub rather than
// cloning is the common case — and `git config` exits non-zero there, which
// npm reports as a bare "code 128" with nothing to explain it.

const inGitRepo = spawnSync("git", ["rev-parse", "--git-dir"], { stdio: "ignore" }).status === 0;

if (!inGitRepo) {
  console.log("Not a git repository yet, so the commit hooks are not wired up.");
  console.log("Run `git init` and then `npm run hooks` when you want them.");
  process.exit(0);
}

const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "inherit" });

if (result.status !== 0) {
  console.log("Could not wire the git hooks. Everything else still works;");
  console.log("run `npm run hooks` later to try again.");
}

// Deliberately exit 0 either way: wiring hooks is a convenience, and failing it
// should never stop someone installing their blog.
process.exit(0);
