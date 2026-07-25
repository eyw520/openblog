import assert from "node:assert/strict";
import { test } from "node:test";

import { galleryColumns, parseGalleryImages } from "./gallery";

test("a path and a description are split on the bar", () => {
  assert.deepEqual(parseGalleryImages("/a.jpg|Boats at low tide"), [
    { src: "/a.jpg", alt: "Boats at low tide" }
  ]);
});

test("several images are split on commas", () => {
  const images = parseGalleryImages("/a.jpg|Boats, /b.jpg|The wall");
  assert.deepEqual(
    images.map((image) => image.src),
    ["/a.jpg", "/b.jpg"]
  );
});

test("an image with no description is decorative rather than rejected", () => {
  assert.deepEqual(parseGalleryImages("/a.jpg"), [{ src: "/a.jpg", alt: "" }]);
});

test("a description containing commas stays one description", () => {
  const images = parseGalleryImages("/a.jpg|Boats, nets, and rope");
  assert.equal(images.length, 1);
  assert.equal(images[0]?.alt, "Boats, nets, and rope");
});

test("a comma still separates images when a real path follows it", () => {
  const images = parseGalleryImages("/a.jpg|Boats, nets, and rope, /b.jpg|The wall");
  assert.deepEqual(
    images.map((image) => [image.src, image.alt]),
    [
      ["/a.jpg", "Boats, nets, and rope"],
      ["/b.jpg", "The wall"]
    ]
  );
});

test("an external image URL also starts a new entry", () => {
  const images = parseGalleryImages("/a.jpg|One, https://example.com/b.jpg|Two");
  assert.equal(images.length, 2);
  assert.equal(images[1]?.src, "https://example.com/b.jpg");
});

test("whitespace around each part is trimmed", () => {
  assert.deepEqual(parseGalleryImages("  /a.jpg | Boats  "), [{ src: "/a.jpg", alt: "Boats" }]);
});

test("trailing separators and empty entries are dropped", () => {
  assert.deepEqual(parseGalleryImages("/a.jpg|Boats, , "), [{ src: "/a.jpg", alt: "Boats" }]);
  assert.deepEqual(parseGalleryImages(""), []);
  assert.deepEqual(parseGalleryImages("|no path"), []);
  assert.deepEqual(parseGalleryImages("just words"), []);
});

test("column count follows the number of pictures", () => {
  assert.equal(galleryColumns(1), 1);
  assert.equal(galleryColumns(2), 2);
  assert.equal(galleryColumns(3), 3);
  assert.equal(galleryColumns(4), 2);
  assert.equal(galleryColumns(6), 3);
});
