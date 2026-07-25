import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/layout";
import { site } from "@/lib/config";

import { bodyFont, displayFont } from "./fonts";
import "./globals.css";

// Every field here comes from site.config.ts, so a blog owner never edits this
// file to change how their site appears in a search result or a shared link.
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s — ${site.title}`
  },
  description: site.description,
  // Written by hand rather than relying on a conventional file, so the icon
  // resolves correctly under a GitHub Pages subdirectory. Replace
  // public/favicon.svg to change it.
  icons: { icon: `${site.basePath}/favicon.svg` },
  authors: [{ name: site.author.name, ...(site.author.url ? { url: site.author.url } : {}) }],
  openGraph: {
    type: "website",
    siteName: site.title,
    title: site.title,
    description: site.description,
    url: site.url
  },
  twitter: { card: "summary", title: site.title, description: site.description },
  alternates: {
    types: { "application/rss+xml": `${site.url}/feed.xml` }
  }
};

export default function RootLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <html lang={site.locale} data-preset={site.theme.preset} suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} min-h-screen`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
