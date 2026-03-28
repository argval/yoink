package main

import (
	"log"
	"os"

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
	pageHandler := handlers.NewPageHandler(redirectHandler)

	r := gin.Default()

	r.GET("/dl/:owner/:repo", redirectHandler.Handle)
	r.GET("/badge/:owner/:repo", badgeHandler.Handle)
	r.GET("/api/release/:owner/:repo", pageHandler.Handle)

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
