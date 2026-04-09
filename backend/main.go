package main

import (
	"log"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/yourusername/yoink/cache"
	"github.com/yourusername/yoink/github"
	"github.com/yourusername/yoink/handlers"
)

func main() {
	ghClient := github.NewClient()
	redisCache := cache.New()

	redirectHandler := handlers.NewRedirectHandler(ghClient, redisCache)
	badgeHandler := handlers.NewBadgeHandler(redirectHandler)
	pageHandler := handlers.NewPageHandler(redirectHandler, ghClient, redisCache)
	linkHandler := handlers.NewLinkHandler(redirectHandler)
	releasesHandler := handlers.NewReleasesHandler(ghClient, redisCache)

	r := gin.Default()

	frontendOrigin := os.Getenv("FRONTEND_ORIGIN") // e.g. https://yoink.vercel.app
	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			if origin == "http://localhost:3000" {
				return true
			}
			if frontendOrigin != "" && origin == frontendOrigin {
				return true
			}
			// Allow any *.vercel.app preview deployment
			return strings.HasSuffix(origin, ".vercel.app")
		},
		AllowMethods:     []string{"GET"},
		AllowHeaders:     []string{"Origin"},
		ExposeHeaders:    []string{"Location"},
		AllowCredentials: false,
	}))

	r.GET("/dl/:owner/:repo", redirectHandler.Handle)
	r.GET("/dl/:owner/:repo/:version", redirectHandler.HandleVersioned)
	r.GET("/badge/:owner/:repo", badgeHandler.Handle)
	r.GET("/api/release/:owner/:repo", pageHandler.Handle)
	r.GET("/api/link/:owner/:repo", linkHandler.Handle)
	r.GET("/api/link/:owner/:repo/:version", linkHandler.HandleVersioned)
	r.GET("/api/release/:owner/:repo/:version", pageHandler.HandleVersioned)
	r.GET("/api/releases/:owner/:repo", releasesHandler.Handle)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("yoink backend starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
