import { withBasePath } from "@/lib/paths";

/**
 * An image with an optional caption.
 *
 * Named `photo` rather than `figure` on purpose: registering the real HTML tag
 * would capture every <figure> a post produces, not just the ones meant for
 * this. Put the image file in public/ and reference it from the site root:
 *
 *   <photo src="/harbour.jpg" alt="Fishing boats at low tide" caption="Newlyn, March" />
 */
export function Photo({
  src,
  alt,
  caption,
  wide
}: {
  src?: string;
  alt?: string;
  caption?: string;
  /** Any value lets the image break out past the reading measure. */
  wide?: string;
}): React.ReactElement | null {
  if (src === undefined || src === "") {
    return null;
  }

  return (
    <figure className={`my-10 ${wide === undefined ? "" : "lg:-mx-24"}`}>
      {/* A plain <img>: a static export has no image optimizer to justify next/image. */}
      <img src={withBasePath(src)} alt={alt ?? ""} className="border-rule w-full rounded-sm border" />
      {caption ? (
        <figcaption className="font-display text-ink-muted mt-3 text-xs uppercase tracking-label">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
