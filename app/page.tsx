import { PageLayout } from "@/components/layout";
import { site } from "@/lib/config";

export default function HomePage(): React.ReactElement {
  return (
    <PageLayout>
      <h1 className="font-display max-w-measure text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {site.title}
      </h1>
      <p className="text-ink-muted max-w-measure mt-6 text-lg leading-relaxed">{site.description}</p>
    </PageLayout>
  );
}
