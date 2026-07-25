import { parseVideoUrl } from "@/lib/video";

/**
 * A YouTube or Vimeo video, embedded by pasting its ordinary URL:
 *
 *   <video-embed url="https://youtu.be/dQw4w9WgXcQ" title="How a lock works" />
 *
 * A URL neither service recognizes renders as a plain link instead of an empty
 * grey box, so a typo degrades into something a reader can still follow.
 */
export function VideoEmbed({ url, title }: { url?: string; title?: string }): React.ReactElement | null {
  if (url === undefined || url === "") {
    return null;
  }

  const embed = parseVideoUrl(url);
  if (!embed) {
    return (
      <p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          {title ?? url}
        </a>
      </p>
    );
  }

  return (
    <div className="border-rule my-10 aspect-video w-full overflow-hidden rounded-sm border">
      <iframe
        src={embed.src}
        // A frame with no accessible name is announced as "frame" and nothing
        // more, so a title is always supplied.
        title={title ?? `${embed.provider} video`}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
