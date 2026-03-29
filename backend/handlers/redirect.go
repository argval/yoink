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

	platform := picker.DetectPlatform(c.GetHeader("User-Agent"))
	asset := picker.PickAsset(release.Assets, platform)
	if asset == nil {
		c.Redirect(http.StatusFound, release.HTMLURL)
		return
	}

	c.Redirect(http.StatusFound, asset.BrowserDownloadURL)
}

// HandleVersioned handles /dl/:owner/:repo/:version — download a specific release tag.
func (h *RedirectHandler) HandleVersioned(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")
	version := c.Param("version")

	release, err := h.getReleaseByTag(c, owner, repo, version)
	if err != nil {
		log.Printf("error fetching release %s for %s/%s: %v", version, owner, repo, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "release version not found"})
		return
	}

	platform := picker.DetectPlatform(c.GetHeader("User-Agent"))
	asset := picker.PickAsset(release.Assets, platform)
	if asset == nil {
		c.Redirect(http.StatusFound, release.HTMLURL)
		return
	}

	c.Redirect(http.StatusFound, asset.BrowserDownloadURL)
}

func (h *RedirectHandler) getRelease(c *gin.Context, owner, repo string) (*github.Release, error) {
	cached, err := h.cache.GetRelease(c.Request.Context(), owner, repo)
	if err != nil {
		log.Printf("cache read error: %v", err)
	}
	if cached != nil {
		return cached, nil
	}

	release, err := h.gh.GetLatestRelease(owner, repo)
	if err != nil {
		return nil, err
	}

	if cacheErr := h.cache.SetRelease(c.Request.Context(), owner, repo, release); cacheErr != nil {
		log.Printf("cache write error: %v", cacheErr)
	}

	return release, nil
}

func (h *RedirectHandler) getReleaseByTag(c *gin.Context, owner, repo, tag string) (*github.Release, error) {
	cached, err := h.cache.GetReleaseByTag(c.Request.Context(), owner, repo, tag)
	if err != nil {
		log.Printf("cache read error (tag): %v", err)
	}
	if cached != nil {
		return cached, nil
	}

	release, err := h.gh.GetReleaseByTag(owner, repo, tag)
	if err != nil {
		return nil, err
	}

	if cacheErr := h.cache.SetReleaseByTag(c.Request.Context(), owner, repo, tag, release); cacheErr != nil {
		log.Printf("cache write error (tag): %v", cacheErr)
	}

	return release, nil
}
