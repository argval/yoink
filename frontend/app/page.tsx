"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [input, setInput] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const match = input.match(
      /(?:github\.com\/)?([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)\/?$/
    );
    if (match) {
      router.push(`/p/${match[1]}/${match[2]}`);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
      <div className="w-full max-w-xl space-y-12 text-center">
        {/* Hero */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            Yoink
          </h1>
          <p className="text-lg text-foreground/60 max-w-md mx-auto">
            Clean download links for any public GitHub repo. Skip the releases
            page — give your users a one-click download.
          </p>
        </div>

        {/* Try it */}
        <form onSubmit={handleSubmit} className="space-y-3">
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
          <p className="text-xs text-foreground/30">
            Try <button type="button" onClick={() => { setInput("cli/cli"); }} className="underline hover:text-foreground/50">cli/cli</button> or{" "}
            <button type="button" onClick={() => { setInput("neovim/neovim"); }} className="underline hover:text-foreground/50">neovim/neovim</button>
          </p>
        </form>

        {/* How it works */}
        <div className="space-y-6 text-left">
          <h2 className="text-lg font-semibold text-center">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-foreground/10 p-5 space-y-2">
              <p className="text-2xl">1.</p>
              <p className="text-sm font-medium">Direct download link</p>
              <p className="text-xs text-foreground/50 font-mono break-all">
                yoink.dev/dl/owner/repo
              </p>
              <p className="text-xs text-foreground/40">
                Detects the user&apos;s platform and redirects straight to the right
                binary.
              </p>
            </div>
            <div className="rounded-xl border border-foreground/10 p-5 space-y-2">
              <p className="text-2xl">2.</p>
              <p className="text-sm font-medium">Landing page</p>
              <p className="text-xs text-foreground/50 font-mono break-all">
                yoink.dev/p/owner/repo
              </p>
              <p className="text-xs text-foreground/40">
                Clean download page with release notes, all assets, and a big
                download button.
              </p>
            </div>
            <div className="rounded-xl border border-foreground/10 p-5 space-y-2">
              <p className="text-2xl">3.</p>
              <p className="text-sm font-medium">Version badge</p>
              <p className="text-xs text-foreground/50 font-mono break-all">
                yoink.dev/badge/owner/repo
              </p>
              <p className="text-xs text-foreground/40">
                Dynamic SVG badge showing the current release version for your
                README.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
