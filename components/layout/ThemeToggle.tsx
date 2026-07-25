"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Switches between the light and dark sheets.
 *
 * The label renders empty until the component has mounted: the server cannot
 * know which theme the reader's system prefers, so committing to one during
 * render would flash the wrong label and warn about a hydration mismatch. The
 * button keeps its size throughout so the masthead never shifts.
 */
export function ThemeToggle(): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(isDark ? "light" : "dark");
      }}
      aria-label={mounted ? `Switch to the ${isDark ? "light" : "dark"} theme` : "Switch theme"}
      className="font-display text-ink-muted hover:text-ink w-12 text-right text-xs uppercase tracking-label transition-colors"
    >
      {mounted ? (isDark ? "Light" : "Dark") : ""}
    </button>
  );
}
