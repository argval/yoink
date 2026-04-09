"use client";

import { useState, useCallback } from "react";
import { DownloadButton } from "./download-button";
import { AssetChecksum } from "./asset-checksum";

type Asset = {
  name: string;
  browser_download_url: string;
  size: number;
  download_count: number;
};

export function DownloadSection({
  owner,
  repo,
  assets,
  tagName,
  publishedDate,
}: {
  owner: string;
  repo: string;
  assets: Asset[];
  tagName: string;
  publishedDate: string;
}) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const handlePrimaryAsset = useCallback((asset: Asset | null) => {
    setSelectedAsset(asset);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <DownloadButton
        owner={owner}
        repo={repo}
        assets={assets}
        onPrimaryAsset={handlePrimaryAsset}
      />
      <p className="text-sm text-foreground/50">
        {tagName} &middot; {publishedDate}
      </p>
      {selectedAsset && (
        <AssetChecksum assets={assets} primaryAsset={selectedAsset} />
      )}
    </div>
  );
}
