"use client";

import { useMemo, useState, useEffect } from "react";

type Asset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type Platform = "windows" | "macos" | "linux" | "unknown";

const platformLabels: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  unknown: "",
};

const platformExtensions: Record<string, string[]> = {
  windows: [".exe", ".msi", ".zip"],
  macos: [".dmg", ".pkg", ".zip", ".tar.gz"],
  linux: [".appimage", ".deb", ".rpm", ".tar.gz", ".tar.xz", ".zip"],
};

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "unknown";
}

function isSource(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes("source") || lower.includes("src");
}

function mentionsOtherPlatform(name: string, current: Platform): boolean {
  const keywords: Record<string, string[]> = {
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

function pickAsset(assets: Asset[], platform: Platform): Asset | null {
  const exts = platformExtensions[platform];
  if (!exts) return null;

  let best: { asset: Asset; rank: number } | null = null;
  for (const asset of assets) {
    const name = asset.name.toLowerCase();
    if (isSource(name)) continue;
    if (mentionsOtherPlatform(name, platform)) continue;
    for (let rank = 0; rank < exts.length; rank++) {
      if (name.endsWith(exts[rank])) {
        if (!best || rank < best.rank) {
          best = { asset, rank };
        }
        break;
      }
    }
  }
  return best?.asset ?? null;
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
  const [platform, setPlatform] = useState<Platform>("unknown");
  useEffect(() => { setPlatform(detectPlatform()); }, []);
  const asset = useMemo(() => pickAsset(assets, platform), [assets, platform]);

  const label = platformLabels[platform];
  const href = asset?.browser_download_url ?? `https://github.com/${owner}/${repo}/releases/latest`;

  return (
    <div className="flex flex-col items-center gap-2">
      <a
        href={href}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-foreground text-background font-semibold text-lg hover:opacity-90 transition-opacity"
      >
        <DownloadIcon />
        Download{label ? ` for ${label}` : ""}
      </a>
      {asset && (
        <p className="text-xs text-foreground/40 font-mono">{asset.name}</p>
      )}
      {!asset && platform !== "unknown" && (
        <p className="text-xs text-foreground/40">
          No binary found for {label} &mdash; see all downloads below
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
