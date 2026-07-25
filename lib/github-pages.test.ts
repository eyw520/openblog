import assert from "node:assert/strict";
import { test } from "node:test";

import { checkDeployUrl, pagesUrl, parseGitHubRemote } from "./github-pages";

test("an https remote is understood", () => {
  assert.deepEqual(parseGitHubRemote("https://github.com/ada/notes.git"), { owner: "ada", name: "notes" });
});

test("an ssh remote is understood", () => {
  assert.deepEqual(parseGitHubRemote("git@github.com:ada/notes.git"), { owner: "ada", name: "notes" });
});

test("a remote without the .git suffix or with a token still parses", () => {
  assert.deepEqual(parseGitHubRemote("https://github.com/ada/notes"), { owner: "ada", name: "notes" });
  assert.deepEqual(parseGitHubRemote("https://x-token@github.com/ada/notes"), {
    owner: "ada",
    name: "notes"
  });
});

test("a remote that is not GitHub yields nothing rather than a guess", () => {
  assert.equal(parseGitHubRemote("https://gitlab.com/ada/notes"), null);
  assert.equal(parseGitHubRemote(""), null);
});

test("an ordinary repository is served from a subdirectory", () => {
  assert.equal(pagesUrl({ owner: "ada", name: "notes" }), "https://ada.github.io/notes");
});

test("a repository named after the user is served from the domain root", () => {
  assert.equal(pagesUrl({ owner: "ada", name: "ada.github.io" }), "https://ada.github.io");
});

test("the owner's capitalisation does not change the address", () => {
  assert.equal(pagesUrl({ owner: "Ada", name: "Notes" }), "https://ada.github.io/Notes");
});

test("a matching url passes", () => {
  const verdict = checkDeployUrl("https://ada.github.io/notes", "git@github.com:ada/notes.git");
  assert.equal(verdict.kind, "match");
});

test("a trailing slash is not a mismatch", () => {
  assert.equal(checkDeployUrl("https://ada.github.io/notes/", "https://github.com/ada/notes").kind, "match");
});

test("the wrong repository name is caught with the correction", () => {
  const verdict = checkDeployUrl("https://ada.github.io/openblog", "https://github.com/ada/notes");
  assert.equal(verdict.kind, "mismatch");
  assert.equal(verdict.kind === "mismatch" ? verdict.expected : "", "https://ada.github.io/notes");
});

test("the wrong owner is caught too — the commonest copy-paste error", () => {
  const verdict = checkDeployUrl("https://example.github.io/openblog", "https://github.com/ada/openblog");
  assert.equal(verdict.kind, "mismatch");
  assert.equal(verdict.kind === "mismatch" ? verdict.expected : "", "https://ada.github.io/openblog");
});

test("a user site configured as a project site is caught", () => {
  const verdict = checkDeployUrl(
    "https://ada.github.io/ada.github.io",
    "git@github.com:ada/ada.github.io.git"
  );
  assert.equal(verdict.kind, "mismatch");
  assert.equal(verdict.kind === "mismatch" ? verdict.expected : "", "https://ada.github.io");
});

test("a custom domain is left alone rather than corrected to github.io", () => {
  const verdict = checkDeployUrl("https://fieldnotes.com", "https://github.com/ada/notes");
  assert.equal(verdict.kind, "custom-domain");
});

test("a non-GitHub remote is reported as unknown, not as a mismatch", () => {
  assert.equal(
    checkDeployUrl("https://ada.github.io/notes", "https://gitlab.com/ada/notes").kind,
    "unknown-remote"
  );
});

test("an unparseable configured url is a mismatch with the right answer given", () => {
  const verdict = checkDeployUrl("ada.github.io/notes", "https://github.com/ada/notes");
  assert.equal(verdict.kind, "mismatch");
});
