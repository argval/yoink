"use client";

import { useState, useEffect } from "react";

export type ReleaseSummary = {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
};

// Module-level cache deduplicates fetches across components on the same page.
const cache = new Map<string, ReleaseSummary[]>();

export function useReleases(owner: string, repo: string) {
  const key = `${owner}/${repo}`;
  const [releases, setReleases] = useState<ReleaseSummary[]>(cache.get(key) ?? []);
  const [loading, setLoading] = useState(!cache.has(key));

  useEffect(() => {
    if (cache.has(key)) {
      setReleases(cache.get(key)!);
      setLoading(false);
      return;
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
    fetch(`${backendUrl}/api/releases/${owner}/${repo}`)
      .then((r) => r.json())
      .then((data: ReleaseSummary[]) => {
        cache.set(key, data);
        setReleases(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [key, owner, repo]);

  return { releases, loading };
}
