"use client";

import { useMemo, useState, useEffect, useRef } from "react";

type Asset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type Platform = "windows" | "macos" | "linux";

const platforms: Platform[] = ["windows", "macos", "linux"];

const platformLabels: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

const platformExtensions: Record<Platform, string[]> = {
  windows: [".exe", ".msi", ".zip"],
  macos: [".dmg", ".pkg", ".zip", ".tar.gz"],
  linux: [".appimage", ".deb", ".rpm", ".tar.gz", ".tar.xz", ".zip"],
};

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "windows"; // default for unknown/privacy UA
}

function isSource(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes("source") || lower.includes("src");
}

function mentionsOtherPlatform(name: string, current: Platform): boolean {
  const keywords: Record<Platform, string[]> = {
    windows: ["windows", "win32", "win64", "win-"],
    macos: ["macos", "darwin", "osx", "mac-", "apple"],
    linux: ["linux", "ubuntu", "debian", "fedora", "appimage"],
  };
  for (const [p, kws] of Object.entries(keywords)) {
    if (p === current) continue;
    for (const kw of kws) {
      if (name.includes(kw)) return true;
    }
  }
  return false;
}

function pickAssets(assets: Asset[], platform: Platform): Asset[] {
  const exts = platformExtensions[platform];
  const results: { asset: Asset; rank: number }[] = [];
  for (const asset of assets) {
    const name = asset.name.toLowerCase();
    if (isSource(name)) continue;
    if (mentionsOtherPlatform(name, platform)) continue;
    for (let rank = 0; rank < exts.length; rank++) {
      if (name.endsWith(exts[rank])) {
        results.push({ asset, rank });
        break;
      }
    }
  }
  results.sort((a, b) => a.rank - b.rank);
  return results.map((r) => r.asset);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DownloadButton({
  owner,
  repo,
  assets,
}: {
  owner: string;
  repo: string;
  assets: Asset[];
}) {
  const [platform, setPlatform] = useState<Platform>("windows");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const primaryAssets = useMemo(() => pickAssets(assets, platform), [assets, platform]);
  const primaryAsset = primaryAssets[0] ?? null;
  const primaryHref = primaryAsset?.browser_download_url ?? `https://github.com/${owner}/${repo}/releases/latest`;

  // Build dropdown items: other variants for this platform + other platforms
  const dropdownItems = useMemo(() => {
    const items: { label: string; asset: Asset }[] = [];

    // Other variants for current platform (e.g. arm64, x86, .deb vs .rpm)
    for (const a of primaryAssets.slice(1)) {
      items.push({ label: a.name, asset: a });
    }

    // Other platforms
    for (const p of platforms) {
      if (p === platform) continue;
      const pAssets = pickAssets(assets, p);
      if (pAssets.length > 0) {
        items.push({
          label: `${platformLabels[p]} — ${pAssets[0].name}`,
          asset: pAssets[0],
        });
        // Additional variants for this platform
        for (const a of pAssets.slice(1)) {
          items.push({ label: `${platformLabels[p]} — ${a.name}`, asset: a });
        }
      }
    }

    return items;
  }, [assets, platform, primaryAssets]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex" ref={dropdownRef}>
        {/* Main download button */}
        <a
          href={primaryHref}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-l-xl bg-foreground text-background font-semibold text-lg hover:opacity-90 transition-opacity"
        >
          <DownloadIcon />
          Download for {platformLabels[platform]}
        </a>

        {/* Dropdown toggle */}
        {dropdownItems.length > 0 && (
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center px-3 py-4 rounded-r-xl bg-foreground text-background border-l border-background/20 hover:opacity-90 transition-opacity"
            aria-label="Other download options"
          >
            <ChevronIcon open={open} />
          </button>
        )}

        {/* If no dropdown items, round the main button fully */}
        {dropdownItems.length === 0 && (
          <style>{`.relative > a:first-child { border-radius: 0.75rem; }`}</style>
        )}

        {/* Dropdown menu */}
        {open && (
          <div className="absolute top-full right-0 mt-2 w-max min-w-full max-w-sm rounded-xl border border-foreground/10 bg-background shadow-lg z-10 overflow-hidden">
            {dropdownItems.map((item) => (
              <a
                key={item.asset.name}
                href={item.asset.browser_download_url}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-foreground/5 transition-colors"
                onClick={() => setOpen(false)}
              >
                <span className="font-mono text-xs truncate">{item.label}</span>
                <span className="text-xs text-foreground/40 shrink-0">
                  {formatSize(item.asset.size)}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {primaryAsset && (
        <p className="text-xs text-foreground/40 font-mono">{primaryAsset.name}</p>
      )}
      {!primaryAsset && (
        <p className="text-xs text-foreground/40">
          No binary found for {platformLabels[platform]} &mdash; see all downloads below
        </p>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 3v10m0 0l-4-4m4 4l4-4M3 17h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
