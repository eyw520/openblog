import type { AnchorHTMLAttributes, ReactNode } from "react";

import { Callout } from "./content/Callout";

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
 * Nothing else in the framework needs to change to add a component here.
 */
export const contentComponents = {
  callout: Callout,

  // Links out of the site open in a new tab; internal links do not, so a reader
  // following your own cross-references keeps one window and their history.
  a: ExternalAwareLink
};

function ExternalAwareLink({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode }): React.ReactElement {
  const isExternal = href !== undefined && /^https?:\/\//.test(href);

  return (
    <a href={href} {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...props}>
      {children}
    </a>
  );
}
