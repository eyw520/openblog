/**
 * Turning a video link into an embed.
 *
 * A writer pastes whatever URL the address bar gave them — a youtu.be short
 * link, a watch page with a playlist attached, a Vimeo page. Rather than asking
 * them to find an ID, this recognizes the shapes and extracts it. Pure, so
 * every accepted form is pinned by a test.
 */

export interface VideoEmbed {
  provider: "youtube" | "vimeo";
  id: string;
  /** The player URL to put in an iframe. */
  src: string;
}

/** Recognizes a YouTube or Vimeo URL, or returns null if it is neither. */
export function parseVideoUrl(url: string): VideoEmbed | null {
  const trimmed = url.trim();

  const youtube = matchYouTubeId(trimmed);
  if (youtube) {
    // youtube-nocookie serves the same player without setting tracking cookies
    // until the reader actually presses play.
    return { provider: "youtube", id: youtube, src: `https://www.youtube-nocookie.com/embed/${youtube}` };
  }

  const vimeo = /(?:^|\/\/)(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/.exec(trimmed);
  if (vimeo?.[1]) {
    return { provider: "vimeo", id: vimeo[1], src: `https://player.vimeo.com/video/${vimeo[1]}` };
  }

  return null;
}

/** YouTube IDs are exactly 11 characters of URL-safe base64. */
const YOUTUBE_ID = "[A-Za-z0-9_-]{11}";

function matchYouTubeId(url: string): string | null {
  const patterns = [
    new RegExp(`[?&]v=(${YOUTUBE_ID})`), //            /watch?v=ID
    new RegExp(`youtu\\.be/(${YOUTUBE_ID})`), //       youtu.be/ID
    new RegExp(`youtube(?:-nocookie)?\\.com/embed/(${YOUTUBE_ID})`), // /embed/ID
    new RegExp(`youtube\\.com/shorts/(${YOUTUBE_ID})`) // /shorts/ID
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(url);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}
