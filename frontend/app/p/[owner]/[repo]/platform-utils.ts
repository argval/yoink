export type Platform = "windows" | "macos" | "linux";
export type Arch = "amd64" | "arm64" | "";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("macintosh") || ua.includes("mac os") || ua.includes("darwin")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "windows";
}

export function detectArch(): Arch {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("arm64") || ua.includes("aarch64")) return "arm64";
  const uad = (navigator as Navigator & { userAgentData?: { architecture?: string } }).userAgentData;
  if (uad?.architecture) {
    const arch = uad.architecture.toLowerCase();
    if (arch.includes("arm")) return "arm64";
    if (arch.includes("x86") || arch.includes("amd64")) return "amd64";
  }
  return "";
}

export function assetPlatformLabel(name: string): string | null {
  const lower = name.toLowerCase();
  if (
    lower.includes("windows") || lower.includes("win32") || lower.includes("win64") ||
    lower.endsWith(".exe") || lower.endsWith(".msi")
  ) return "Windows";
  if (
    lower.includes("macos") || lower.includes("darwin") || lower.includes("osx") ||
    lower.includes("apple") || lower.endsWith(".dmg") || lower.endsWith(".pkg")
  ) return "macOS";
  if (
    lower.includes("linux") || lower.includes("ubuntu") || lower.includes("debian") ||
    lower.endsWith(".deb") || lower.endsWith(".rpm") || lower.endsWith(".appimage")
  ) return "Linux";
  return null;
}
