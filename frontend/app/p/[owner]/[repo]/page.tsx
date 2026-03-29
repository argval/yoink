import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
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
  readme: string;
};

async function getRelease(owner: string, repo: string): Promise<ReleaseData> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/release/${owner}/${repo}`, {
      next: { revalidate: 300 },
    });
  } catch {
    throw new Error("Couldn't reach the download service. Try again in a moment.");
  }
  if (res.status === 404 || res.status === 502) {
    notFound();
  }
  if (!res.ok) {
    throw new Error(`Couldn't load release info for ${owner}/${repo}.`);
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
        <div className="text-center space-y-4">
          <Image
            src={`https://github.com/${owner}.png?size=96`}
            alt={`${owner} avatar`}
            width={64}
            height={64}
            className="rounded-2xl mx-auto"
          />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {repo}
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

        {/* About (README) */}
        {release.readme && (
          <details className="border border-foreground/10 rounded-xl group">
            <summary className="px-6 sm:px-8 py-5 cursor-pointer font-semibold text-lg flex items-center justify-between select-none">
              About
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-open:rotate-180"
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </summary>
            <div className="px-6 sm:px-8 pb-6 sm:pb-8">
              <div className="prose prose-sm dark:prose-invert max-w-none [&_a]:text-blue-500 [&_a:hover]:underline [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_li]:text-sm [&_p]:text-sm [&_p]:leading-relaxed [&_code]:text-xs [&_code]:bg-foreground/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-foreground/5 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_img]:rounded-lg [&_img]:max-w-full">
                <Markdown
                  rehypePlugins={[
                    rehypeRaw,
                    [rehypeSanitize, {
                      ...defaultSchema,
                      attributes: {
                        ...defaultSchema.attributes,
                        img: [...(defaultSchema.attributes?.img ?? []), "src", "alt", "width", "height", "align"],
                        svg: ["xmlns", "viewBox", "width", "height", "fill", "class", "style"],
                        path: ["d", "fill", "stroke", "strokeWidth"],
                      },
                      tagNames: [...(defaultSchema.tagNames ?? []), "svg", "path", "circle", "rect", "g"],
                    }],
                  ]}
                  urlTransform={(url) => resolveReadmeUrl(url, owner, repo)}
                >
                  {release.readme}
                </Markdown>
              </div>
            </div>
          </details>
        )}

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

// Resolve relative README URLs to absolute raw.githubusercontent.com URLs
function resolveReadmeUrl(url: string, owner: string, repo: string): string {
  if (!url) return url;
  // Already absolute
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  // Strip leading ./
  const path = url.replace(/^\.\//, "");
  return `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
