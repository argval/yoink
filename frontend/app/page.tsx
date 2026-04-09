"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const POPULAR = [
  "cli/cli",
  "neovim/neovim",
  "astral-sh/uv",
  "BurntSushi/ripgrep",
  "sharkdp/bat",
  "casey/just",
];

const RECENT_KEY = "yoink:recent";

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(repo: string) {
  const prev = loadRecent().filter((r) => r !== repo);
  localStorage.setItem(RECENT_KEY, JSON.stringify([repo, ...prev].slice(0, 5)));
}

export default function Home() {
  const [input, setInput] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  function parseInput(value: string) {
    return value.match(/(?:github\.com\/)?([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)\/?$/);
  }

  function navigate(slug: string) {
    const match = slug.match(/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)/);
    if (!match) return;
    saveRecent(`${match[1]}/${match[2]}`);
    setRecent(loadRecent());
    router.push(`/p/${match[1]}/${match[2]}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const match = parseInput(input);
    if (match) navigate(`${match[1]}/${match[2]}`);
  }

  function removeRecent(slug: string) {
    const updated = loadRecent().filter((r) => r !== slug);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setRecent(updated);
  }

  const parsedHint = parseInput(input);
  const hintSlug = parsedHint ? `${parsedHint[1]}/${parsedHint[2]}` : null;

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-xl space-y-12 text-center">
        {/* Hero */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">Yoink</h1>
          <p className="text-lg text-foreground/60 max-w-md mx-auto">
            Clean download links for any public GitHub repo. Skip the releases
            page — give your users a one-click download.
          </p>
        </div>

        {/* Search */}
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="owner/repo or github.com/owner/repo"
                className="flex-1 px-4 py-3 rounded-xl border border-foreground/10 bg-transparent text-base placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-foreground text-background font-medium text-base hover:opacity-90 transition-opacity"
              >
                Go
              </button>
            </div>
            {hintSlug && (
              <p className="text-xs text-foreground/40 text-left pl-1">
                Press Go to view downloads for <span className="font-mono">{hintSlug}</span>
              </p>
            )}
          </form>

          {/* Recent searches */}
          {recent.length > 0 && (
            <div className="space-y-2 text-left">
              <p className="text-xs text-foreground/40 font-medium uppercase tracking-wide">Recent</p>
              <div className="flex flex-wrap gap-2">
                {recent.map((slug) => (
                  <div key={slug} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => navigate(slug)}
                      className="px-3 py-1.5 rounded-lg text-sm bg-foreground/5 hover:bg-foreground/10 transition-colors font-mono"
                    >
                      {slug}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecent(slug)}
                      className="text-foreground/20 hover:text-foreground/50 transition-colors text-xs px-1"
                      aria-label={`Remove ${slug}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular suggestions */}
          <div className="space-y-2 text-left">
            <p className="text-xs text-foreground/40 font-medium uppercase tracking-wide">Popular</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => navigate(slug)}
                  className="px-3 py-1.5 rounded-lg text-sm bg-foreground/5 hover:bg-foreground/10 transition-colors font-mono"
                >
                  {slug}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="space-y-6 text-left">
          <h2 className="text-lg font-semibold text-center">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-foreground/10 p-5 space-y-2">
              <p className="text-2xl">1.</p>
              <p className="text-sm font-medium">Direct download</p>
              <p className="text-xs text-foreground/50 font-mono break-all">yoink.dev/dl/owner/repo</p>
              <p className="text-xs text-foreground/40">
                Detects the user&apos;s platform and redirects straight to the right binary.
              </p>
            </div>
            <div className="rounded-xl border border-foreground/10 p-5 space-y-2">
              <p className="text-2xl">2.</p>
              <p className="text-sm font-medium">Landing page</p>
              <p className="text-xs text-foreground/50 font-mono break-all">yoink.dev/p/owner/repo</p>
              <p className="text-xs text-foreground/40">
                Clean download page with release notes, all assets, and a big download button.
              </p>
            </div>
            <div className="rounded-xl border border-foreground/10 p-5 space-y-2">
              <p className="text-2xl">3.</p>
              <p className="text-sm font-medium">Version badge</p>
              <p className="text-xs text-foreground/50 font-mono break-all">yoink.dev/badge/owner/repo</p>
              <p className="text-xs text-foreground/40">
                Dynamic SVG badge showing the current release version for your README.
              </p>
            </div>
            <div className="rounded-xl border border-foreground/10 p-5 space-y-2">
              <p className="text-2xl">4.</p>
              <p className="text-sm font-medium">Link API</p>
              <p className="text-xs text-foreground/50 font-mono break-all">yoink.dev/api/link/owner/repo</p>
              <p className="text-xs text-foreground/40">
                Returns JSON with the resolved download URL — for CI pipelines and scripts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
