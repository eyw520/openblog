import assert from "node:assert/strict";
import { test } from "node:test";

import { parseVideoUrl } from "./video";

test("a standard YouTube watch URL is recognized", () => {
  const embed = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(embed?.provider, "youtube");
  assert.equal(embed?.id, "dQw4w9WgXcQ");
});

test("a youtu.be short link is recognized", () => {
  assert.equal(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ")?.id, "dQw4w9WgXcQ");
});

test("extra parameters like a playlist or timestamp do not confuse it", () => {
  assert.equal(
    parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLx&t=42s")?.id,
    "dQw4w9WgXcQ"
  );
  assert.equal(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ?t=42")?.id, "dQw4w9WgXcQ");
});

test("embed and shorts URLs are recognized", () => {
  assert.equal(parseVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")?.id, "dQw4w9WgXcQ");
  assert.equal(parseVideoUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")?.id, "dQw4w9WgXcQ");
});

test("YouTube embeds use the no-cookie player", () => {
  assert.equal(
    parseVideoUrl("https://youtu.be/dQw4w9WgXcQ")?.src,
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
  );
});

test("a Vimeo URL is recognized", () => {
  const embed = parseVideoUrl("https://vimeo.com/123456789");
  assert.equal(embed?.provider, "vimeo");
  assert.equal(embed?.src, "https://player.vimeo.com/video/123456789");
});

test("surrounding whitespace from a paste is tolerated", () => {
  assert.equal(parseVideoUrl("  https://youtu.be/dQw4w9WgXcQ  ")?.id, "dQw4w9WgXcQ");
});

test("something that is not a video URL returns null rather than a broken embed", () => {
  assert.equal(parseVideoUrl("https://example.com/video"), null);
  assert.equal(parseVideoUrl(""), null);
  assert.equal(parseVideoUrl("dQw4w9WgXcQ"), null);
});

test("an id of the wrong length is rejected instead of half-matched", () => {
  assert.equal(parseVideoUrl("https://www.youtube.com/watch?v=tooshort"), null);
});
