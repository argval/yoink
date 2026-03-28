package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type PageHandler struct {
	redirect *RedirectHandler
}

func NewPageHandler(r *RedirectHandler) *PageHandler {
	return &PageHandler{redirect: r}
}

// Handle returns release JSON for the frontend to render.
// The Next.js frontend calls this API endpoint to get release data.
func (h *PageHandler) Handle(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")

	release, err := h.redirect.getRelease(c, owner, repo)
	if err != nil {
		log.Printf("page: error fetching release for %s/%s: %v", owner, repo, err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "could not fetch release info"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"owner":        owner,
		"repo":         repo,
		"tag_name":     release.TagName,
		"name":         release.Name,
		"body":         release.Body,
		"published_at": release.PublishedAt,
		"html_url":     release.HTMLURL,
		"assets":       release.Assets,
	})
}
