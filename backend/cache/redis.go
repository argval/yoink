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

func releaseTagKey(owner, repo, tag string) string {
	return fmt.Sprintf("release:%s/%s@%s", owner, repo, tag)
}

func (c *Cache) GetReleaseByTag(ctx context.Context, owner, repo, tag string) (*gh.Release, error) {
	if c.client == nil {
		return nil, nil
	}

	data, err := c.client.Get(ctx, releaseTagKey(owner, repo, tag)).Bytes()
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

func (c *Cache) SetReleaseByTag(ctx context.Context, owner, repo, tag string, release *gh.Release) error {
	if c.client == nil {
		return nil
	}

	data, err := json.Marshal(release)
	if err != nil {
		return err
	}

	return c.client.Set(ctx, releaseTagKey(owner, repo, tag), data, c.ttl).Err()
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

func releasesKey(owner, repo string) string {
	return fmt.Sprintf("releases:%s/%s", owner, repo)
}

func (c *Cache) GetReleases(ctx context.Context, owner, repo string) ([]gh.ReleaseSummary, error) {
	if c.client == nil {
		return nil, nil
	}
	data, err := c.client.Get(ctx, releasesKey(owner, repo)).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var releases []gh.ReleaseSummary
	if err := json.Unmarshal(data, &releases); err != nil {
		return nil, err
	}
	return releases, nil
}

func (c *Cache) SetReleases(ctx context.Context, owner, repo string, releases []gh.ReleaseSummary) error {
	if c.client == nil {
		return nil
	}
	data, err := json.Marshal(releases)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, releasesKey(owner, repo), data, c.ttl).Err()
}

func readmeKey(owner, repo string) string {
	return fmt.Sprintf("readme:%s/%s", owner, repo)
}

func (c *Cache) GetREADME(ctx context.Context, owner, repo string) (string, bool, error) {
	if c.client == nil {
		return "", false, nil
	}

	data, err := c.client.Get(ctx, readmeKey(owner, repo)).Result()
	if err == redis.Nil {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}
	return data, true, nil
}

func (c *Cache) SetREADME(ctx context.Context, owner, repo, content string) error {
	if c.client == nil {
		return nil
	}
	return c.client.Set(ctx, readmeKey(owner, repo), content, c.ttl).Err()
}
