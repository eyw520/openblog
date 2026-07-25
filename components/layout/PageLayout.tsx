import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/**
 * The frame every page sits in: masthead, content, footer. Pages supply only
 * their own content, so the chrome can change in one place.
 */
export function PageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className={cn("mx-auto w-full max-w-4xl flex-1 px-6 py-16", className)}>{children}</main>
      <SiteFooter />
    </div>
  );
}
