package picker

import (
	"strings"

	"github.com/yourusername/yoink/github"
)

type Platform string

const (
	Windows Platform = "windows"
	MacOS   Platform = "macos"
	Linux   Platform = "linux"
	Unknown Platform = "unknown"
)

// DetectPlatform parses a User-Agent string to determine the client's OS.
func DetectPlatform(userAgent string) Platform {
	ua := strings.ToLower(userAgent)
	switch {
	case strings.Contains(ua, "windows") || strings.Contains(ua, "win64") || strings.Contains(ua, "win32"):
		return Windows
	case strings.Contains(ua, "macintosh") || strings.Contains(ua, "mac os") || strings.Contains(ua, "darwin"):
		return MacOS
	case strings.Contains(ua, "linux") || strings.Contains(ua, "ubuntu") || strings.Contains(ua, "fedora") || strings.Contains(ua, "debian"):
		return Linux
	default:
		return Unknown
	}
}

// platformExtensions maps each platform to its preferred file extensions, in priority order.
var platformExtensions = map[Platform][]string{
	Windows: {".exe", ".msi", ".zip"},
	MacOS:   {".dmg", ".pkg", ".zip", ".tar.gz"},
	Linux:   {".AppImage", ".deb", ".rpm", ".tar.gz", ".tar.xz", ".zip"},
}

// PickAsset selects the best matching release asset for the given platform.
// Returns nil if no suitable asset is found.
func PickAsset(assets []github.Asset, platform Platform) *github.Asset {
	if len(assets) == 0 {
		return nil
	}

	// Score each asset: lower is better
	type scored struct {
		asset github.Asset
		rank  int
	}

	var candidates []scored

	exts, ok := platformExtensions[platform]
	if !ok {
		// Unknown platform — fall back to releases page (return nil)
		return nil
	}

	for _, asset := range assets {
		name := strings.ToLower(asset.Name)
		if isSource(name) {
			continue
		}
		for rank, ext := range exts {
			if strings.HasSuffix(name, strings.ToLower(ext)) {
				// Bonus: deprioritize assets that mention another platform
				if mentionsOtherPlatform(name, platform) {
					continue
				}
				candidates = append(candidates, scored{asset: asset, rank: rank})
				break
			}
		}
	}

	if len(candidates) == 0 {
		return nil
	}

	// Pick the candidate with the best (lowest) rank
	best := candidates[0]
	for _, c := range candidates[1:] {
		if c.rank < best.rank {
			best = c
		}
	}
	return &best.asset
}

// isSource returns true if the filename looks like a source archive.
func isSource(name string) bool {
	lower := strings.ToLower(name)
	return strings.Contains(lower, "source") || strings.Contains(lower, "src")
}

// mentionsOtherPlatform checks if a filename explicitly references a different platform.
func mentionsOtherPlatform(name string, current Platform) bool {
	platformKeywords := map[Platform][]string{
		Windows: {"windows", "win32", "win64", "win-"},
		MacOS:   {"macos", "darwin", "osx", "mac-", "apple"},
		Linux:   {"linux", "ubuntu", "debian", "fedora", "appimage"},
	}

	for p, keywords := range platformKeywords {
		if p == current {
			continue
		}
		for _, kw := range keywords {
			if strings.Contains(name, kw) {
				return true
			}
		}
	}
	return false
}
