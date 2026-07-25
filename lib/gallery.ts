/**
 * Reading a gallery's images out of a Markdown attribute.
 *
 * An attribute in a post is a single string, so a gallery is written as a list
 * of `path|description` pairs separated by commas:
 *
 *   <gallery images="/a.jpg|Boats at low tide, /b.jpg|The harbour wall"></gallery>
 *
 * Parsing is pure and separate from rendering so the awkward cases — a missing
 * description, a stray comma, a trailing separator — are pinned by tests rather
 * than discovered on a published page.
 */

export interface GalleryImage {
  src: string;
  /** Empty means the picture is decorative, which is a valid choice. */
  alt: string;
}

/**
 * Splits the `images` attribute into pairs, discarding anything unusable.
 *
 * A comma only starts a new image when what follows actually looks like one.
 * Descriptions are written in ordinary prose and ordinary prose has commas in
 * it — treating every comma as a separator would turn "Boats, nets, and rope"
 * into three images, two of them broken, with nothing said about it.
 */
export function parseGalleryImages(value: string): GalleryImage[] {
  const images: GalleryImage[] = [];

  for (const segment of value.split(",")) {
    const item = segment.trim();
    if (item.length === 0) {
      continue;
    }

    if (looksLikePath(item)) {
      const separator = item.indexOf("|");
      images.push(
        separator === -1
          ? { src: item, alt: "" }
          : { src: item.slice(0, separator).trim(), alt: item.slice(separator + 1).trim() }
      );
      continue;
    }

    // Not a path: the writer's description continued past a comma.
    const current = images.at(-1);
    if (current) {
      current.alt = current.alt.length > 0 ? `${current.alt}, ${item}` : item;
    }
  }

  return images.filter((image) => image.src.length > 0);
}

/** A new image begins at a site-absolute path or a full URL, never mid-sentence. */
function looksLikePath(item: string): boolean {
  return item.startsWith("/") || /^https?:\/\//.test(item);
}

/**
 * How many columns a gallery of this size should use.
 *
 * Two pictures side by side read as a pair; three as a row; more than three
 * wants a grid that wraps. Chosen from the count rather than asked for, because
 * the writer knows how many pictures they have, not how wide the screen is.
 */
export function galleryColumns(count: number): 1 | 2 | 3 {
  if (count <= 1) {
    return 1;
  }
  return count % 3 === 0 ? 3 : 2;
}
