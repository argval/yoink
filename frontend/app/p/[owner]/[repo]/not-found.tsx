export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-6xl mb-6">📦</p>
      <h1 className="text-2xl font-bold mb-2">No releases found</h1>
      <p className="text-foreground/50 mb-8">
        This repo either doesn&apos;t exist, is private, or hasn&apos;t published any releases yet.
      </p>
      <a
        href="https://github.com"
        className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
      >
        Back to GitHub
      </a>
    </main>
  );
}
