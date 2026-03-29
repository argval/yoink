package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/yoink/cache"
	"github.com/yourusername/yoink/github"
)

type PageHandler struct {
	redirect *RedirectHandler
	gh       *github.Client
	cache    *cache.Cache
}

func NewPageHandler(r *RedirectHandler, gh *github.Client, c *cache.Cache) *PageHandler {
	return &PageHandler{redirect: r, gh: gh, cache: c}
}

func (h *PageHandler) Handle(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")

	release, err := h.redirect.getRelease(c, owner, repo)
	if err != nil {
		log.Printf("page: error fetching release for %s/%s: %v", owner, repo, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "could not fetch release info"})
		return
	}

	readme := h.getREADME(c, owner, repo)

	c.JSON(http.StatusOK, gin.H{
		"owner":        owner,
		"repo":         repo,
		"tag_name":     release.TagName,
		"name":         release.Name,
		"body":         release.Body,
		"published_at": release.PublishedAt,
		"html_url":     release.HTMLURL,
		"assets":       release.Assets,
		"readme":       readme,
	})
}

// HandleVersioned serves /api/release/:owner/:repo/:version — metadata for a specific tag.
func (h *PageHandler) HandleVersioned(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")
	version := c.Param("version")

	release, err := h.redirect.getReleaseByTag(c, owner, repo, version)
	if err != nil {
		log.Printf("page: error fetching release %s for %s/%s: %v", version, owner, repo, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "release version not found"})
		return
	}

	readme := h.getREADME(c, owner, repo)

	c.JSON(http.StatusOK, gin.H{
		"owner":        owner,
		"repo":         repo,
		"tag_name":     release.TagName,
		"name":         release.Name,
		"body":         release.Body,
		"published_at": release.PublishedAt,
		"html_url":     release.HTMLURL,
		"assets":       release.Assets,
		"readme":       readme,
	})
}

func (h *PageHandler) getREADME(c *gin.Context, owner, repo string) string {
	ctx := c.Request.Context()

	// Try cache
	cached, hit, err := h.cache.GetREADME(ctx, owner, repo)
	if err != nil {
		log.Printf("cache read error (readme): %v", err)
	}
	if hit {
		return cached
	}

	// Fetch from GitHub
	content, err := h.gh.GetREADME(owner, repo)
	if err != nil {
		log.Printf("readme fetch error for %s/%s: %v", owner, repo, err)
		return ""
	}

	// Cache it
	if cacheErr := h.cache.SetREADME(ctx, owner, repo, content); cacheErr != nil {
		log.Printf("cache write error (readme): %v", cacheErr)
	}

	return content
}
