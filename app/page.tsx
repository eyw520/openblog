export default function HomePage(): React.ReactElement {
  return (
    <main className="mx-auto max-w-measure px-6 py-24">
      <p className="font-display text-ink-muted text-xs uppercase tracking-label">Installed</p>
      <h1 className="font-display mt-4 text-5xl font-semibold tracking-tight">openblog</h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-muted">
        The shell renders. Content, routes, and the site configuration arrive in the commits that follow.
      </p>
    </main>
  );
}
