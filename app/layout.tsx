import type { Metadata } from "next";
import type { ReactNode } from "react";

import { bodyFont, displayFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "openblog",
  description: "A Markdown-first blog framework that deploys itself to GitHub Pages."
};

export default function RootLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} min-h-screen`}>{children}</body>
    </html>
  );
}
