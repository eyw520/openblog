import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

/**
 * The gate is defined twice — once as `make check`, once as `npm run check` for
 * Windows — and two definitions of the same thing drift. This asserts they run
 * the same set of npm scripts, so adding a leg to one and forgetting the other
 * fails here rather than in somebody's unchecked commit.
 */

const root = process.cwd();
const makefile = readFileSync(join(root, "Makefile"), "utf-8");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf-8")) as {
  scripts: Record<string, string>;
};

/** The npm scripts a make target runs, following its dependencies. */
function scriptsForTarget(target: string, seen = new Set<string>()): Set<string> {
  const found = new Set<string>();
  if (seen.has(target)) {
    return found;
  }
  seen.add(target);

  const rule = new RegExp(`^${target}:([^\\n]*)\\n((?:\\t[^\\n]*\\n)*)`, "m").exec(makefile);
  if (!rule) {
    return found;
  }

  for (const dependency of (rule[1] ?? "").trim().split(/\s+/).filter(Boolean)) {
    for (const script of scriptsForTarget(dependency, seen)) {
      found.add(script);
    }
  }
  for (const match of (rule[2] ?? "").matchAll(/npm run ([a-z:-]+)/g)) {
    if (match[1]) {
      found.add(match[1]);
    }
  }
  // `npm test` is the one leg spelled without "run". The anchor allows it to be
  // the first line of the rule body, which it is.
  if (/(^|\n)\tnpm test\b/.test(rule[2] ?? "")) {
    found.add("test");
  }
  return found;
}

/** The npm scripts a package.json script chains together. */
function scriptsInCommand(command: string): Set<string> {
  const found = new Set<string>();
  for (const match of command.matchAll(/npm run ([a-z:-]+)/g)) {
    if (match[1]) {
      found.add(match[1]);
    }
  }
  for (const match of command.matchAll(/npm test\b/g)) {
    if (match[0]) {
      found.add("test");
    }
  }
  return found;
}

test("`make check` and `npm run check` run exactly the same legs", () => {
  const fromMake = [...scriptsForTarget("check")].sort();
  const fromNpm = [...scriptsInCommand(packageJson.scripts.check ?? "")].sort();

  assert.ok(fromMake.length > 0, "no legs found for `make check` — has the Makefile changed shape?");
  assert.deepEqual(
    fromNpm,
    fromMake,
    `The two spellings of the gate have drifted.\n` +
      `  make check: ${fromMake.join(", ")}\n` +
      `  npm check:  ${fromNpm.join(", ")}\n` +
      `Add the missing leg to whichever is short.`
  );
});

test("every leg the gate names is a real npm script", () => {
  for (const script of scriptsForTarget("check")) {
    assert.ok(
      script in packageJson.scripts,
      `\`make check\` runs "${script}", which package.json does not define`
    );
  }
});
