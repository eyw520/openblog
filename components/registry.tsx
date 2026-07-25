import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";

import { withBasePath } from "@/lib/paths";

import { Callout } from "./content/Callout";
import { Lead } from "./content/Lead";
import { Photo } from "./content/Photo";
import { VideoEmbed } from "./content/VideoEmbed";

/**
 * YOUR COMPONENTS. This is the extension point — the one file to edit when you
 * want something in a post that Markdown has no spelling for.
 *
 * Add an entry here and the tag becomes available in every Markdown file:
 *
 *   <callout kind="warning">Back up first.</callout>
 *
 * Two rules, both imposed by HTML rather than by openblog:
 *
 *   1. Tag names must be lowercase. The Markdown body is parsed as HTML, and
 *      HTML lowercases tag names — a `<Callout>` in a post arrives as
 *      `callout`, so that is the key to register it under.
 *   2. Attributes arrive as strings. `count="3"` is the string "3", never the
 *      number 3, so a component should validate what it is given.
 *
 * Avoid naming a tag after a real HTML element (`figure`, `video`, `aside`):
 * the key would also capture that element wherever Markdown produces it.
 *
 * Nothing else in the framework needs to change to add a component here.
 */
export const contentComponents = {
  callout: Callout,
  lead: Lead,
  photo: Photo,
  "video-embed": VideoEmbed,

  // The two overrides below fix links and images that Markdown emits as plain
  // HTML. Next does not apply the site's base path to those, so without this
  // every internal link and image breaks on a GitHub Pages project site.
  a: BlogLink,
  img: BlogImage
};

function BlogLink({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode }): React.ReactElement {
  const isExternal = href !== undefined && /^https?:\/\//.test(href);

  return (
    <a
      href={href === undefined ? undefined : withBasePath(href)}
      // Links out of the site open in a new tab; internal links do not, so a
      // reader following your own cross-references keeps one window.
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
    </a>
  );
}

function BlogImage({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>): React.ReactElement {
  // A plain <img>, not next/image: a static export has no image optimizer, so
  // next/image would add client weight for no benefit. `alt` defaults to empty
  // rather than being dropped, which marks the image decorative instead of
  // leaving a screen reader to announce the filename.
  return <img src={typeof src === "string" ? withBasePath(src) : src} alt={alt ?? ""} {...props} />;
}
