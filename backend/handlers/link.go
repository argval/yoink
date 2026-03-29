package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/yoink/picker"
)

// LinkHandler serves /api/link/:owner/:repo, returning JSON with the resolved
// download URL rather than issuing a redirect. This is useful for scripts and
// CI pipelines that need the URL without following redirects.
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
	Version  string `json:"version"`
}

func (h *LinkHandler) Handle(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")

	release, err := h.redirect.getRelease(c, owner, repo)
	if err != nil {
		log.Printf("link: error fetching release for %s/%s: %v", owner, repo, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "could not fetch release info"})
		return
	}

	ua := c.GetHeader("User-Agent")
	platform := picker.DetectPlatform(ua)

	// Allow ?platform= override (windows, macos, linux)
	if p := c.Query("platform"); p != "" {
		platform = picker.Platform(p)
	}

	asset := picker.PickAsset(release.Assets, platform)
	if asset == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":    "no suitable asset found for platform",
			"platform": string(platform),
			"url":      release.HTMLURL,
		})
		return
	}

	c.JSON(http.StatusOK, LinkResponse{
		URL:      asset.BrowserDownloadURL,
		Filename: asset.Name,
		Size:     asset.Size,
		Platform: string(platform),
		Version:  release.TagName,
	})
}
