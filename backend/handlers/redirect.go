package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/yoink/cache"
	"github.com/yourusername/yoink/github"
	"github.com/yourusername/yoink/picker"
)

type RedirectHandler struct {
	gh    *github.Client
	cache *cache.Cache
}

func NewRedirectHandler(gh *github.Client, c *cache.Cache) *RedirectHandler {
	return &RedirectHandler{gh: gh, cache: c}
}

func (h *RedirectHandler) Handle(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")

	release, err := h.getRelease(c, owner, repo)
	if err != nil {
		log.Printf("error fetching release for %s/%s: %v", owner, repo, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "could not fetch release info"})
		return
	}

	ua := c.GetHeader("User-Agent")
	platform := picker.DetectPlatform(ua)
	arch := picker.ResolveArch(c.Query("arch"), ua)
	asset := picker.PickAssetForArch(release.Assets, platform, arch)
	if asset == nil {
		// Fallback: redirect to the GitHub releases page
		c.Redirect(http.StatusFound, release.HTMLURL)
		return
	}

	c.Redirect(http.StatusFound, asset.BrowserDownloadURL)
}

func (h *RedirectHandler) getRelease(c *gin.Context, owner, repo string) (*github.Release, error) {
	// Try cache first
	cached, err := h.cache.GetRelease(c.Request.Context(), owner, repo)
	if err != nil {
		log.Printf("cache read error: %v", err)
	}
	if cached != nil {
		return cached, nil
	}

	// Fetch from GitHub
	release, err := h.gh.GetLatestRelease(owner, repo)
	if err != nil {
		return nil, err
	}

	// Store in cache (best-effort)
	if cacheErr := h.cache.SetRelease(c.Request.Context(), owner, repo, release); cacheErr != nil {
		log.Printf("cache write error: %v", cacheErr)
	}

	return release, nil
}
