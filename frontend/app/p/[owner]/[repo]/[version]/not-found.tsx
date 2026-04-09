export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-6xl mb-6">📦</p>
      <h1 className="text-2xl font-bold mb-2">Release not found</h1>
      <p className="text-foreground/50 mb-8">
        This version tag doesn&apos;t exist or hasn&apos;t been published.
      </p>
      <div className="flex gap-3">
        <a
          href="/"
          className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity"
        >
          Back to search
        </a>
      </div>
    </main>
  );
}
