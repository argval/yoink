package github

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// APIError is returned when the GitHub API responds with a non-200 status.
// Handlers inspect it to forward the appropriate HTTP status to the client.
type APIError struct {
	StatusCode int
	Message    string
}

func (e *APIError) Error() string { return e.Message }

type Asset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Size               int64  `json:"size"`
	ContentType        string `json:"content_type"`
	DownloadCount      int64  `json:"download_count"`
}

type Release struct {
	TagName     string  `json:"tag_name"`
	Name        string  `json:"name"`
	Body        string  `json:"body"`
	PublishedAt string  `json:"published_at"`
	HTMLURL     string  `json:"html_url"`
	Prerelease  bool    `json:"prerelease"`
	Assets      []Asset `json:"assets"`
}

// ReleaseSummary is a lightweight release for list endpoints (no assets, no body).
type ReleaseSummary struct {
	TagName     string `json:"tag_name"`
	Name        string `json:"name"`
	PublishedAt string `json:"published_at"`
	Prerelease  bool   `json:"prerelease"`
}

type Client struct {
	httpClient *http.Client
	token      string
}

// maxREADMESize caps README fetches at 1 MB.
const maxREADMESize = 1 << 20

func NewClient() *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 10 * time.Second},
		token:      os.Getenv("GITHUB_TOKEN"),
	}
}

func (c *Client) newRequest(ctx context.Context, url, accept string) (*http.Request, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", accept)
	req.Header.Set("User-Agent", "Yoink/1.0")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	return req, nil
}

func (c *Client) checkStatus(resp *http.Response) error {
	if resp.StatusCode == http.StatusOK {
		return nil
	}
	body, _ := io.ReadAll(resp.Body)
	return &APIError{StatusCode: resp.StatusCode, Message: string(body)}
}

func (c *Client) GetLatestRelease(ctx context.Context, owner, repo string) (*Release, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", owner, repo)
	req, err := c.newRequest(ctx, url, "application/vnd.github.v3+json")
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching release: %w", err)
	}
	defer resp.Body.Close()
	if err := c.checkStatus(resp); err != nil {
		return nil, err
	}
	var release Release
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("decoding release: %w", err)
	}
	return &release, nil
}

func (c *Client) GetReleaseByTag(ctx context.Context, owner, repo, tag string) (*Release, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/tags/%s", owner, repo, tag)
	req, err := c.newRequest(ctx, url, "application/vnd.github.v3+json")
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching release: %w", err)
	}
	defer resp.Body.Close()
	if err := c.checkStatus(resp); err != nil {
		return nil, err
	}
	var release Release
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("decoding release: %w", err)
	}
	return &release, nil
}

// GetReleases fetches the first 30 releases (summary only, no assets/body).
func (c *Client) GetReleases(ctx context.Context, owner, repo string) ([]ReleaseSummary, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases?per_page=30", owner, repo)
	req, err := c.newRequest(ctx, url, "application/vnd.github.v3+json")
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching releases: %w", err)
	}
	defer resp.Body.Close()
	if err := c.checkStatus(resp); err != nil {
		return nil, err
	}
	var releases []ReleaseSummary
	if err := json.NewDecoder(resp.Body).Decode(&releases); err != nil {
		return nil, fmt.Errorf("decoding releases: %w", err)
	}
	return releases, nil
}

// GetREADME fetches the raw README content for a repo, capped at maxREADMESize.
func (c *Client) GetREADME(ctx context.Context, owner, repo string) (string, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/readme", owner, repo)
	req, err := c.newRequest(ctx, url, "application/vnd.github.v3.raw")
	if err != nil {
		return "", fmt.Errorf("creating request: %w", err)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetching readme: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return "", nil // no README is fine
	}
	if resp.StatusCode != http.StatusOK {
		return "", nil // non-critical, skip
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, maxREADMESize))
	if err != nil {
		return "", fmt.Errorf("reading readme: %w", err)
	}
	return string(body), nil
}
