package cache

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
	gh "github.com/yourusername/yoink/github"
)

const DefaultTTL = 5 * time.Minute

type Cache struct {
	client *redis.Client
	ttl    time.Duration
}

func New() *Cache {
	redisURL := os.Getenv("UPSTASH_REDIS_URL")
	if redisURL == "" {
		// Return a no-op cache for local dev without Redis
		return &Cache{ttl: DefaultTTL}
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "warning: invalid UPSTASH_REDIS_URL, caching disabled: %v\n", err)
		return &Cache{ttl: DefaultTTL}
	}
	opt.TLSConfig = &tls.Config{MinVersion: tls.VersionTLS12}

	return &Cache{
		client: redis.NewClient(opt),
		ttl:    DefaultTTL,
	}
}

func releaseKey(owner, repo string) string {
	return fmt.Sprintf("release:%s/%s", owner, repo)
}

func (c *Cache) GetRelease(ctx context.Context, owner, repo string) (*gh.Release, error) {
	if c.client == nil {
		return nil, nil // cache miss, no-op
	}

	data, err := c.client.Get(ctx, releaseKey(owner, repo)).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var release gh.Release
	if err := json.Unmarshal(data, &release); err != nil {
		return nil, err
	}
	return &release, nil
}

func (c *Cache) SetRelease(ctx context.Context, owner, repo string, release *gh.Release) error {
	if c.client == nil {
		return nil
	}

	data, err := json.Marshal(release)
	if err != nil {
		return err
	}

	return c.client.Set(ctx, releaseKey(owner, repo), data, c.ttl).Err()
}
