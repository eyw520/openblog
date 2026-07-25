import Link from "next/link";

import { PageLayout } from "@/components/layout";

export default function NotFound(): React.ReactElement {
  return (
    <PageLayout>
      <h1 className="font-display text-4xl font-semibold tracking-tight">This page does not exist</h1>
      <p className="text-ink-muted max-w-measure mt-6 text-lg leading-relaxed">
        The link may be out of date, or the post may have been renamed.
      </p>
      <Link
        href="/"
        className="font-display text-accent mt-8 inline-block text-xs uppercase tracking-label hover:underline"
      >
        Back to the front page
      </Link>
    </PageLayout>
  );
}
