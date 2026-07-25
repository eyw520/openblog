"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Wraps next-themes so app/layout.tsx can stay a server component. The provider
 * writes a `class` on <html>, which is what Tailwind's `darkMode: "class"` and
 * the `.dark` token block in globals.css both key off.
 */
export function ThemeProvider({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemeProvider>
  );
}
