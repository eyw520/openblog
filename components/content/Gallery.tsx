import { galleryColumns, parseGalleryImages } from "@/lib/gallery";
import { withBasePath } from "@/lib/paths";
import { cn } from "@/lib/utils";

/**
 * Several pictures in one block — a trip's photographs, a recipe's steps, a
 * paper's figures.
 *
 *   <gallery images="/a.jpg|Boats at low tide, /b.jpg|The harbour wall"
 *            caption="Newlyn, March"></gallery>
 *
 * Each image is `path|description`, separated by commas. On a wide screen the
 * gallery breaks out past the reading measure, because pictures want the room
 * that prose does not.
 */
export function Gallery({
  images,
  caption
}: {
  images?: string;
  caption?: string;
}): React.ReactElement | null {
  const parsed = images === undefined ? [] : parseGalleryImages(images);
  if (parsed.length === 0) {
    return null;
  }

  const columns = galleryColumns(parsed.length);

  return (
    <figure className="my-10 lg:-mx-24">
      <div
        className={cn(
          "grid gap-3",
          columns === 3 && "sm:grid-cols-3",
          columns === 2 && "sm:grid-cols-2"
        )}
      >
        {parsed.map((image) => (
          <img
            key={image.src}
            src={withBasePath(image.src)}
            alt={image.alt}
            loading="lazy"
            className="border-rule w-full rounded-sm border object-cover"
          />
        ))}
      </div>
      {caption ? (
        <figcaption className="font-display text-ink-muted mt-3 text-xs uppercase tracking-label">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
