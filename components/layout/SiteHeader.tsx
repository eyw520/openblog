import Link from "next/link";

import { site } from "@/lib/config";
import { listNavLinks } from "@/services/content";

import { ThemeToggle } from "./ThemeToggle";

/**
 * The masthead: the blog's name, its navigation, and the theme switch, over a
 * single hairline rule. Navigation is derived — declaring a collection or
 * marking a page `nav: true` puts it here without anyone editing this file.
 */
export function SiteHeader(): React.ReactElement {
  const navLinks = listNavLinks();

  return (
    <header className="border-rule border-b">
      <div className="mx-auto flex max-w-4xl flex-wrap items-baseline gap-x-8 gap-y-3 px-6 py-6">
        <Link
          href="/"
          className="font-display text-ink hover:text-accent text-lg font-semibold tracking-tight transition-colors"
        >
          {site.title}
        </Link>

        <nav aria-label="Sections" className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display text-ink-muted hover:text-ink text-xs uppercase tracking-label transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
