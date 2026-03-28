# Yoink

Clean download links for any GitHub release.

## Structure
- `/backend` — Go + Gin API (Fly.io)
- `/frontend` — Next.js landing pages (Vercel)

## Routes
- `/dl/{owner}/{repo}` — direct redirect
- `/p/{owner}/{repo}` — landing page
- `/badge/{owner}/{repo}` — SVG badge
