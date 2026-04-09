# Yoink

**Clean download links for any public GitHub release.**

Skip the releases page. Give users a one-click download that automatically detects their platform and architecture.

```
https://yoink.dev/dl/cli/cli
```

---

## What it does

Most GitHub projects bury downloads in a releases page with 15+ assets. Yoink solves this with smart URLs that do the right thing automatically:

| URL | What it does |
|-----|-------------|
| `/dl/:owner/:repo` | Detects platform + arch, redirects to the right binary |
| `/dl/:owner/:repo/:version` | Same, but for a specific release tag |
| `/p/:owner/:repo` | Landing page with download button, release notes, all assets |
| `/p/:owner/:repo/:version` | Landing page for a specific version |
| `/badge/:owner/:repo` | Dynamic SVG version badge for READMEs |
| `/api/link/:owner/:repo` | JSON with resolved download URL — for CI/scripts |
| `/api/releases/:owner/:repo` | List of recent releases (tag, date, prerelease flag) |

## Features

- **Platform detection** — Windows / macOS / Linux from User-Agent
- **Architecture detection** — amd64 / arm64 / arm / 386 from User-Agent and `navigator.userAgentData`
- **Version selector** — browse and switch between recent releases in the UI
- **Pre-release toggle** — opt into alpha/beta builds when available
- **Asset checksums** — automatically fetches and displays SHA256 for the selected binary
- **Quick Install** — extracts package manager commands from the README (`pip`, `npm`, `cargo`, `brew`, `winget`, `choco`, `scoop`, `apt`, and more)
- **Platform filter** — "My platform only" toggle in the All Downloads list
- **Download counts** — shows per-asset download counts from GitHub
- **Share links** — copyable Yoink URLs for smart download, landing page, badge, and API
- **Version badges** — embed in any README
- **Dark mode** — system preference detection + manual toggle
- **Redis cache** — 5-minute cache via Upstash, graceful no-op fallback for local dev

## Stack

| Layer | Tech |
|-------|------|
| Backend | Go + Gin, deployed on Fly.io |
| Frontend | Next.js 16 (App Router, React 19), deployed on Vercel |
| Cache | Upstash Redis (serverless) |
| Styling | Tailwind CSS v4 |

## Project structure

```
yoink/
├── backend/
│   ├── github/       # GitHub API client (releases, README)
│   ├── cache/        # Redis cache layer
│   ├── picker/       # Platform + arch asset selection logic
│   ├── handlers/     # Gin route handlers
│   └── main.go
└── frontend/
    └── app/
        ├── page.tsx                    # Homepage with search
        └── p/[owner]/[repo]/
            ├── page.tsx                # Release landing page
            ├── [version]/page.tsx      # Versioned landing page
            ├── download-button.tsx     # Platform-aware download button
            ├── download-section.tsx    # Button + checksum wrapper
            ├── version-selector.tsx    # Version dropdown
            ├── prerelease-toggle.tsx   # Pre-release opt-in
            ├── all-downloads.tsx       # Filterable asset list
            ├── install-commands.tsx    # Copyable install commands
            ├── share-links.tsx         # Copyable Yoink URLs
            ├── asset-checksum.tsx      # SHA256 display
            ├── use-releases.ts         # Shared releases hook
            └── platform-utils.ts      # Platform/arch detection
```

## Running locally

### Backend

```bash
cd backend
go run .
```

Optional environment variables:

```env
GITHUB_TOKEN=ghp_...           # Raises rate limit from 60 to 5000 req/hr
UPSTASH_REDIS_URL=rediss://... # Redis cache (skipped if unset)
FRONTEND_ORIGIN=https://...    # Extra CORS origin
PORT=8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Environment variables:

```env
BACKEND_URL=http://localhost:8080            # Server-side fetch
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 # Client-side fetch (version selector)
```

## Deploying

### Backend (Fly.io)

```bash
cd backend
fly launch        # first time
fly deploy        # subsequent deploys
fly secrets set GITHUB_TOKEN=ghp_... UPSTASH_REDIS_URL=rediss://...
```

### Frontend (Vercel)

Push to `main` — Vercel auto-deploys. Set in the Vercel dashboard:

```
BACKEND_URL=https://your-backend.fly.dev
NEXT_PUBLIC_BACKEND_URL=https://your-backend.fly.dev
```

## API examples

```bash
# Resolved download URL as JSON
curl https://yoink.dev/api/link/cli/cli
# {"url":"...","filename":"gh_2.x.x_macOS_arm64.zip","platform":"macos","arch":"arm64","version":"v2.x.x"}

# Override platform and arch
curl "https://yoink.dev/api/link/cli/cli?platform=linux&arch=amd64"

# Specific version
curl https://yoink.dev/api/link/cli/cli/v2.40.0

# List recent releases
curl https://yoink.dev/api/releases/cli/cli

# Direct download (follows redirect)
curl -L https://yoink.dev/dl/cli/cli -o gh.zip
```

## Badge

```markdown
![version](https://yoink.dev/badge/owner/repo)
```
