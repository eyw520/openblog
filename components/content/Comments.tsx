"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import type { ResolvedComments } from "@/lib/config";

const GISCUS_ORIGIN = "https://giscus.app";

/**
 * Reader comments, backed by GitHub Discussions through giscus.
 *
 * giscus is loaded by injecting its script rather than with next/script,
 * because it must land inside this element — it replaces its own parent with an
 * iframe. Nothing loads unless the blog has configured comments, so a blog
 * without them ships no third-party code at all.
 */
export function Comments({ config }: { config: ResolvedComments }): React.ReactElement {
  const container = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  const { repo, repoId, category, categoryId } = config;

  useEffect(() => {
    const element = container.current;
    if (!element) {
      return;
    }

    const script = document.createElement("script");
    script.src = `${GISCUS_ORIGIN}/client.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    Object.entries({
      "data-repo": repo,
      "data-repo-id": repoId,
      "data-category": category,
      "data-category-id": categoryId,
      // One discussion per page, matched on the path.
      "data-mapping": "pathname",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "top",
      "data-lang": "en",
      "data-loading": "lazy"
    }).forEach(([name, value]) => {
      script.setAttribute(name, value);
    });
    element.appendChild(script);

    return () => {
      // React may re-run this effect; without clearing, giscus stacks up.
      element.innerHTML = "";
    };
    // `theme` is deliberately absent: a change to it is handled below by
    // messaging the existing frame, rather than tearing the thread down and
    // reloading every comment.
     
  }, [repo, repoId, category, categoryId]);

  useEffect(() => {
    const frame = container.current?.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
    frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, GISCUS_ORIGIN);
  }, [theme]);

  return (
    <section aria-label="Comments" className="border-rule max-w-measure mt-20 border-t pt-10">
      <h2 className="font-display text-ink-muted mb-6 text-xs uppercase tracking-label">Comments</h2>
      <div ref={container} />
    </section>
  );
}
