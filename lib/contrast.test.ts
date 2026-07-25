import assert from "node:assert/strict";
import { test } from "node:test";

import {
  contrastRatio,
  findContrastFailures,
  hslToRgb,
  parseHsl,
  parseThemeBlocks,
  tokenContrast
} from "./contrast";

test("black on white is the maximum ratio", () => {
  const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
  assert.ok(Math.abs(ratio - 21) < 0.01, `expected 21, got ${ratio}`);
});

test("a colour against itself is the minimum", () => {
  assert.equal(contrastRatio({ r: 80, g: 80, b: 80 }, { r: 80, g: 80, b: 80 }), 1);
});

test("the ratio does not depend on which colour is named first", () => {
  const a = { r: 20, g: 30, b: 40 };
  const b = { r: 200, g: 210, b: 220 };
  assert.equal(contrastRatio(a, b), contrastRatio(b, a));
});

test("HSL converts to the expected RGB", () => {
  assert.deepEqual(hslToRgb(0, 1, 0.5), { r: 255, g: 0, b: 0 });
  assert.deepEqual(hslToRgb(120, 1, 0.5), { r: 0, g: 255, b: 0 });
  assert.deepEqual(hslToRgb(240, 1, 0.5), { r: 0, g: 0, b: 255 });
  assert.deepEqual(hslToRgb(0, 0, 1), { r: 255, g: 255, b: 255 });
  assert.deepEqual(hslToRgb(0, 0, 0), { r: 0, g: 0, b: 0 });
});

test("a token in the stylesheet's own spelling is parsed", () => {
  assert.deepEqual(parseHsl("0 0% 100%"), { r: 255, g: 255, b: 255 });
  assert.deepEqual(parseHsl("  215 35% 12%  "), hslToRgb(215, 0.35, 0.12));
});

test("a malformed token is rejected rather than guessed at", () => {
  assert.equal(parseHsl("#141821"), null);
  assert.equal(parseHsl("215 35 12"), null);
  assert.equal(parseHsl(""), null);
});

test("the known-bad combination that shipped is caught", () => {
  // ink-muted at 70% opacity over paper measured 2.9:1 in the browser.
  const ratio = tokenContrast("215 14% 55%", "210 20% 98%");
  assert.ok(ratio !== null && ratio < 4.5, `expected a failing ratio, got ${String(ratio)}`);
});

test("the corrected combination passes", () => {
  const ratio = tokenContrast("215 14% 42%", "210 20% 98%");
  assert.ok(ratio !== null && ratio >= 4.5, `expected AA, got ${String(ratio)}`);
});

test("every palette in a stylesheet is found, light and dark", () => {
  const css = `
    :root { --paper: 0 0% 100%; --ink: 0 0% 0%; }
    :root.dark { --paper: 0 0% 0%; --ink: 0 0% 100%; }
    :root[data-preset="rust"] { --paper: 36 30% 97%; --ink: 25 20% 14%; }
    :root[data-preset="rust"].dark { --paper: 24 18% 10%; --ink: 36 20% 91%; }
  `;
  const blocks = parseThemeBlocks(css);
  assert.deepEqual(
    blocks.map((b) => `${b.preset}/${b.theme}`),
    ["ink/light", "ink/dark", "rust/light", "rust/dark"]
  );
});

test("a block with no tokens is not treated as a palette", () => {
  assert.deepEqual(parseThemeBlocks(":root { }"), []);
});

test("a failing palette is reported with its preset, theme, and use", () => {
  const css = ':root[data-preset="bad"] { --paper: 0 0% 100%; --ink: 0 0% 88%; }';
  const failures = findContrastFailures(css);
  assert.equal(failures.length, 1);
  assert.equal(failures[0]?.preset, "bad");
  assert.equal(failures[0]?.theme, "light");
  assert.equal(failures[0]?.usage, "body text");
});

test("a palette that restates only some tokens is checked on what it has", () => {
  // No --paper here, so the ink-on-paper pair simply cannot be judged.
  assert.deepEqual(findContrastFailures(':root[data-preset="p"] { --ink: 0 0% 50%; }'), []);
});

test("a sound palette reports nothing", () => {
  const css = ":root { --paper: 0 0% 100%; --ink: 0 0% 0%; --ink-muted: 0 0% 40%; }";
  assert.deepEqual(findContrastFailures(css), []);
});

test("a token written under a comment is still found", () => {
  // The stylesheet documents each group of tokens, so most tokens follow a
  // comment. Missing them silently is how a checker passes a broken palette.
  const css = `:root {
    /* The sheet. */
    --paper: 0 0% 100%;
    /* Text. */
    --ink: 0 0% 0%;
  }`;
  const [block] = parseThemeBlocks(css);
  assert.deepEqual(Object.keys(block?.tokens ?? {}).sort(), ["ink", "paper"]);
});

test("a comment between the selector and the brace does not hide the block", () => {
  const css = `/* ── ink ── */\n:root { --paper: 0 0% 100%; --ink: 0 0% 0%; }`;
  assert.equal(parseThemeBlocks(css).length, 1);
});
