package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/yoink/cache"
	"github.com/yourusername/yoink/github"
)

// ReleasesHandler serves /api/releases/:owner/:repo — a lightweight list of
// recent releases (tag, name, date, prerelease flag) for use in version selectors.
type ReleasesHandler struct {
	gh    *github.Client
	cache *cache.Cache
}

func NewReleasesHandler(gh *github.Client, c *cache.Cache) *ReleasesHandler {
	return &ReleasesHandler{gh: gh, cache: c}
}

func (h *ReleasesHandler) Handle(c *gin.Context) {
	owner := c.Param("owner")
	repo := c.Param("repo")
	ctx := c.Request.Context()

	cached, err := h.cache.GetReleases(ctx, owner, repo)
	if err != nil {
		log.Printf("cache read error (releases): %v", err)
	}
	if cached != nil {
		c.JSON(http.StatusOK, cached)
		return
	}

	releases, err := h.gh.GetReleases(ctx, owner, repo)
	if err != nil {
		log.Printf("releases: error fetching for %s/%s: %v", owner, repo, err)
		c.JSON(httpStatusFromError(err), gin.H{"error": err.Error()})
		return
	}

	if cacheErr := h.cache.SetReleases(ctx, owner, repo, releases); cacheErr != nil {
		log.Printf("cache write error (releases): %v", cacheErr)
	}

	c.JSON(http.StatusOK, releases)
}
