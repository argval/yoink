package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/yoink/picker"
)

// LinkHandler serves /api/link/:owner/:repo[/:version], returning JSON with the
// resolved download URL rather than issuing a redirect. Useful for scripts and
// CI pipelines that need the URL without following redirects:
//
//	curl -s yoink.dev/api/link/cli/cli | jq -r .url | xargs wget
//
// Query params:
//
//	?platform=windows|macos|linux   (override UA detection)
//	?arch=amd64|arm64|arm|386       (override UA detection)
type LinkHandler struct {
	redirect *RedirectHandler
}

func NewLinkHandler(r *RedirectHandler) *LinkHandler {
	return &LinkHandler{redirect: r}
}

// LinkResponse is the JSON payload returned by the link endpoint.
type LinkResponse struct {
	URL      string `json:"url"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
	Platform string `json:"platform"`
	Arch     string `json:"arch"`
	Version  string `json:"version"`
}

func (h *LinkHandler) Handle(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")

	release, err := h.redirect.getRelease(c, owner, repo)
	if err != nil {
		log.Printf("link: error fetching release for %s/%s: %v", owner, repo, err)
		c.JSON(httpStatusFromError(err), gin.H{"error": err.Error()})
		return
	}

	ua := c.GetHeader("User-Agent")
	platform := picker.DetectPlatform(ua)
	if p := c.Query("platform"); p != "" {
		platform = picker.Platform(p)
	}
	if platform == picker.Unknown {
		platform = picker.Windows
	}

	arch := picker.ResolveArch(c.Query("arch"), ua)
	asset := picker.PickAssetForArch(release.Assets, platform, arch)
	if asset == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":    "no suitable asset found for platform",
			"platform": string(platform),
			"arch":     string(arch),
			"url":      release.HTMLURL,
		})
		return
	}

	c.JSON(http.StatusOK, LinkResponse{
		URL:      asset.BrowserDownloadURL,
		Filename: asset.Name,
		Size:     asset.Size,
		Platform: string(platform),
		Arch:     string(arch),
		Version:  release.TagName,
	})
}

// HandleVersioned serves /api/link/:owner/:repo/:version.
func (h *LinkHandler) HandleVersioned(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")
	version := c.Param("version")

	release, err := h.redirect.getReleaseByTag(c, owner, repo, version)
	if err != nil {
		log.Printf("link: error fetching release %s for %s/%s: %v", version, owner, repo, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "release version not found"})
		return
	}

	ua := c.GetHeader("User-Agent")
	platform := picker.DetectPlatform(ua)
	if p := c.Query("platform"); p != "" {
		platform = picker.Platform(p)
	}
	if platform == picker.Unknown {
		platform = picker.Windows
	}

	arch := picker.ResolveArch(c.Query("arch"), ua)
	asset := picker.PickAssetForArch(release.Assets, platform, arch)
	if asset == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":    "no suitable asset found for platform",
			"platform": string(platform),
			"arch":     string(arch),
			"url":      release.HTMLURL,
		})
		return
	}

	c.JSON(http.StatusOK, LinkResponse{
		URL:      asset.BrowserDownloadURL,
		Filename: asset.Name,
		Size:     asset.Size,
		Platform: string(platform),
		Arch:     string(arch),
		Version:  release.TagName,
	})
}
