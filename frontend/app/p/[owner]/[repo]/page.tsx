import type { Metadata } from "next";
import Markdown from "react-markdown";
import { DownloadButton } from "./download-button";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

type Props = {
  params: Promise<{ owner: string; repo: string }>;
};

type Asset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type ReleaseData = {
  owner: string;
  repo: string;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: Asset[];
};

async function getRelease(owner: string, repo: string): Promise<ReleaseData> {
  const res = await fetch(`${BACKEND_URL}/api/release/${owner}/${repo}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch release for ${owner}/${repo}`);
  }
  return res.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, repo } = await params;
  return {
    title: `${repo} — Download | Yoink`,
    description: `Download the latest release of ${owner}/${repo}`,
  };
}

export default async function ReleasePage({ params }: Props) {
  const { owner, repo } = await params;
  const release = await getRelease(owner, repo);

  const publishedDate = new Date(release.published_at).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {release.name || repo}
          </h1>
          <p className="text-foreground/60 text-lg">
            <a
              href={`https://github.com/${owner}/${repo}`}
              className="hover:underline"
            >
              {owner}/{repo}
            </a>
          </p>
        </div>

        {/* Download section */}
        <div className="flex flex-col items-center gap-3">
          <DownloadButton owner={owner} repo={repo} assets={release.assets} />
          <p className="text-sm text-foreground/50">
            {release.tag_name} &middot; {publishedDate}
          </p>
        </div>

        {/* Release notes */}
        {release.body && (
          <div className="border border-foreground/10 rounded-xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold mb-4">Release Notes</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none [&_a]:text-blue-500 [&_a:hover]:underline [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-sm [&_p]:text-sm [&_p]:leading-relaxed [&_code]:text-xs [&_code]:bg-foreground/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
              <Markdown>{release.body}</Markdown>
            </div>
          </div>
        )}

        {/* All assets */}
        <div className="border border-foreground/10 rounded-xl p-6 sm:p-8">
          <h2 className="text-lg font-semibold mb-4">All Downloads</h2>
          <ul className="space-y-2">
            {release.assets.map((asset) => (
              <li key={asset.name}>
                <a
                  href={asset.browser_download_url}
                  className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg hover:bg-foreground/5 transition-colors"
                >
                  <span className="text-sm font-mono truncate">
                    {asset.name}
                  </span>
                  <span className="text-xs text-foreground/40 shrink-0">
                    {formatSize(asset.size)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
