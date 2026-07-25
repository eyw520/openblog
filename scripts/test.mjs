import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Runs every *.test.ts in the repo through node's built-in test runner, with tsx
// stripping the types. Node 20's --test cannot glob, so the files are collected
// here; a repo with no tests yet exits 0 rather than failing the gate.

const IGNORED = new Set(["node_modules", ".next", ".next-dev", "out", ".git"]);

function collectTests(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectTests(full));
    } else if (/\.test\.tsx?$/.test(entry.name)) {
      found.push(full);
    }
  }
  return found;
}

const tests = collectTests(process.cwd()).sort();

if (tests.length === 0) {
  console.log("No *.test.ts files found — nothing to run.");
  process.exit(0);
}

// `tsx` resolves from node_modules/.bin, which npm puts on PATH for scripts.
const result = spawnSync("tsx", ["--test", ...tests], { stdio: "inherit" });
process.exit(result.status ?? 1);
