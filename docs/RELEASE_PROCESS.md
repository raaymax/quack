# Release Process

## Overview

Quack Chat uses a **label-driven release process**. When a `dev → main` PR with a `vX.Y.Z` label is merged, GitHub Actions automatically creates a GitHub Release and tag, which triggers the Docker build pipeline.

## Versioning

- **Format**: Semantic versioning — `vX.Y.Z` (e.g., `v3.4.3`)
- **Source of truth**: Git tags (no version field in `deno.jsonc` or `package.json`)
- **Docker tag**: Matches the git tag (e.g., `codecat/quack:v3.4.3`)

## Branch Strategy

```
feature branches → dev (squash merge via PR)
                   dev → main (merge via PR with vX.Y.Z label)
                          main → release → tag v* → Docker Hub
```

- `main` — production-ready code
- `dev` — integration branch, all feature PRs target this
- Feature branches use conventional naming: `feat/`, `fix/`, `chore/`, etc.

## Release Steps

### 1. Create release PR

Create a PR from `dev` → `main` and add a version label (e.g., `v3.5.0`).

```bash
gh pr create --base main --head dev --title "Release v3.5.0"
gh pr edit --add-label "v3.5.0"
```

Write the release description in the PR body — it will be used as the GitHub Release notes.

CI runs tests + frontend lint on the PR (`dev.yml` workflow).

### 2. Merge the PR

Once CI passes, merge the PR. The `release.yml` workflow automatically:

1. Reads the `vX.Y.Z` label from the merged PR
2. Creates a GitHub Release with the PR body as release notes
3. The release creates the `vX.Y.Z` tag

### 3. Docker build pipeline

The tag triggers `.github/workflows/docker.yml`:

1. **Tests job** — Spins up MongoDB, runs `deno task migrate:tests` + `deno task check` (fmt, lint, test)
2. **Build & push job** (runs after tests pass):
   - Multi-stage Docker build (Node for frontend, Deno for backend)
   - Multi-platform: `linux/amd64` + `linux/arm64`
   - Pushes to Docker Hub as `codecat/quack:vX.Y.Z`
   - Generates build provenance attestation

## CI Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `tests.yml` | PR → `dev` | Validates feature PRs (backend + frontend lint) |
| `dev.yml` | PR → `main` | Validates release PRs, builds preview image to `ghcr.io` |
| `release.yml` | PR merged → `main` (with `vX.Y.Z` label) | Creates GitHub Release + tag |
| `docker.yml` | Tag `v*` push | Production build → Docker Hub (`codecat/quack`) |
| `apps.yml` | Manual dispatch | Android APK build |

## Docker Image

**Registry**: Docker Hub — `codecat/quack`

The image is built in two stages:

1. **Frontend** (Node 22 Alpine) — `npm install` + `npm run build` → produces `app/dist/`
2. **Backend** (Deno 2.5.0 Alpine) — `deno install`, copies frontend dist to `public/`

On container startup, `entrypoint.sh` runs:
1. Sources `.envrc` if present
2. `deno task migrate` — runs database migrations
3. `deno task start` — starts the server on port 8080

The `APP_VERSION` build arg is set from the git tag and baked into the image.

## Quick Reference

```bash
# Create release PR with version label
gh pr create --base main --head dev --title "Release v3.5.0"
gh pr edit --add-label "v3.5.0"
# Merge the PR — release + Docker build happen automatically
```
