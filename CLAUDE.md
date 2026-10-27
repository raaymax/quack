# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow Rules

These rules apply automatically when this is a git repository, unless the user explicitly says otherwise:

1. **Branch before changes**: Before executing any plan that modifies code, create a new feature branch from the current branch. Use conventional branch naming: `feat/description`, `fix/description`, `chore/description`, `refactor/description`, etc. Never make plan changes directly on `main` or `dev`.
2. **Commit after plan execution**: After completing a plan execution, run the `/commit` skill to create a properly formatted commit.
3. **Branch naming**: Use lowercase kebab-case after the prefix (e.g., `feat/add-user-search`, `fix/login-redirect`, `chore/update-deps`).

## Build & Dev Commands

```bash
# Backend
deno task dev              # Run backend in watch mode
deno task start            # Production start

# Frontend (pnpm — installs go through Socket Firewall + 1-week cooldown)
cd app && pnpm dev         # Vite dev server (port 4000, HTTPS via basic-ssl; proxies /api → backend :4001)
cd app && pnpm build       # Production build
cd app && pnpm lint        # ESLint
cd app && pnpm storybook   # Storybook (port 4006)

# Full stack
deno task check            # fmt + lint + test (all backend)
deno task migrate          # Run database migrations
deno task migrate:tests    # Migrations on test database

# Testing
deno task test                              # All backend tests (needs MongoDB)
deno test -A deno/server/inter/http/routes/__tests__/channels.test.ts  # Single test file
deno test -A --filter "channel:create"      # Filter by test name
cd app && pnpm types                        # TypeScript check (frontend)
cd app && pnpm chromatic                    # Visual regression testing
```

## Architecture

**Monorepo**: Deno workspace (backend) + pnpm (frontend), single Docker container.

```
app/                    # React 19 PWA (Vite, styled-components, MobX)
deno/
  server/               # Main backend (Clean Architecture)
    core/               # Domain logic: commands, queries, bus, events, errors
    infra/              # MongoDB repos, db client
    inter/              # HTTP routes (Planigale), CLI, middleware
  api/                  # @quack/api — shared types + client class
  config/               # @quack/config — config loader
  encryption/           # @quack/encryption — ECDH, AES-GCM, PBKDF2
  storage/              # @quack/storage — file storage abstraction (fs/gcs/memory)
  migrate/              # Database migrations
  tools/                # Dev utilities
planigale/              # HTTP framework (Planigale) packages, Deno workspace members
plugins/                # Plugin system (e.g., giphy)
mobile/                 # Capacitor Android shell
```

### Backend (Clean Architecture — 3 layers)

- **Core** (`deno/server/core/`): Domain logic. `createCommand()` (write ops, Valibot validation, MongoDB transactions) and `createQuery()` (read ops). Internal event bus for cross-domain communication. Domain errors (`AppError`, `ResourceNotFound`, `AccessDenied`).
- **Infra** (`deno/server/infra/`): Generic `Repo<Query, Model>` base class with CRUD. Domain-specific repos. MongoDB client.
- **Inter** (`deno/server/inter/`): HTTP routes organized by domain under `http/routes/`. Session-based auth middleware. Error-to-HTTP mapping.
- **Framework** (`planigale/`): Planigale lives in this repo (no longer pulled from JSR). Fix framework bugs there and add tests next to the code. Request bodies are parsed only for routes that declare `schema.body`; other routes get the raw `ReadableStream` in `req.body` (used by file, avatar and emoji uploads). The frontend imports `@planigale/sse` through a Vite alias and tsconfig path, like `@quack/api`, so `planigale/sse` must stay browser-compatible (no `jsr:`/`npm:` imports, no Deno APIs).

Domains: `channel/`, `message/`, `user/`, `session/`, `emoji/`, `readReceipt/`, `command/`.

### Frontend (Atomic Design + MobX)

- **Components**: `atoms/` → `molecules/` → `organisms/` → `pages/` (strict import hierarchy — atoms/molecules cannot import from organisms/pages, enforced by ESLint)
- **State**: MobX models in `app/src/js/core/models/`. Root `AppModel` with sub-models (channels, users, messages, etc.). Components wrapped with `observer()`.
- **Contexts** (8): AppContext, ThemeSelectorContext, InputContext, MessageContext, HoverContext, SidebarContext, SizeContext, TooltipContext — all follow `createContext(null)` + `useXxx()` hook + `XxxProvider` pattern.
- **Styling**: styled-components with transient `$props`, 4 themes in `contexts/themes.json`.
- **Real-time**: SSE at `/api/sse` (not WebSocket) — server pushes events, client dispatches to MobX models.

### Data Flow

```
REST:  Component → MobX action → API client → HTTP route → Command/Query → Repo → MongoDB
SSE:   Core event → SSE stream → API client EventSource → MobX model → observer() re-render
```

### E2E Encryption

PBKDF2 key derivation → ECDH key exchange (P-256) → AES-GCM message encryption. XOR-based 2-of-2 secret splitting for key backup.

### Production

nginx → Traefik → app container (so `trustProxy: 2`). Files are stored in GCS. Logs go to stdout and reach Loki/Grafana through the Docker log driver. `entrypoint.sh` runs `deno task migrate` before starting, so migrations run on every deploy.

## Project Rules

### Backend tests
- **Endpoint tests only, no unit tests.** Test behavior through the HTTP API. If an endpoint should create a log line or a DB record, assert that it did.
- Extend the existing test file for the domain instead of adding new ones.
- Use fixed test emails, clean up with `repo.user.removeMany`, and call `core.close()` at the end of tests that use the DB (see `session.test.ts`).

### Layering
- `inter/http` imports nothing from core except `core/mod.ts`.
- HTTP-only concerns (rate limiting, client IP, auth logs, HTTP errors) live in `inter/http`, not in core.
- Core has one command or query per file.
- Prefer the minimal valid solution over configurable ones (e.g. `trustProxy` is a hop count, not a list of networks).

### Logging & security
- Log one line per event, built with `JSON.stringify` of the whole object, never by string concatenation, so crafted paths, user agents or emails can't break or inject lines.
- Never log passwords, header dumps or request body samples.
- Don't store unauthenticated traffic in MongoDB; it goes to logs only.

### Domain invariants
- **Files belong to the channel.** Messages, and any future resources, reference files only through `fileIds`; never add back-references like `messageId` on files. New references go through `file:attach`, which validates channel, ownership and draft state. Deleting a message keeps its files. Avatars and custom emoji are not channel files.
- **The email is the crypto salt.** It seeds PBKDF2 for both the login hash and the encryption key, so changing a user's email is a crypto migration, not a profile edit. Keep the login credential cryptographically separate from the encryption key.

### Dependencies
- pnpm refuses versions younger than 7 days (`minimumReleaseAge` in `app/pnpm-workspace.yaml`). For `mobile/` (npm), keep the same cooldown with `npm update --before=<date a week ago>`.
- Run installs non-interactively (`CI=true`) so they can't hang on a prompt. After many incremental installs, do a clean `rm -rf node_modules && pnpm install --frozen-lockfile` before trusting a strange build error.
- Remove dependencies that nothing imports instead of keeping them around; they only add security alerts.
- Dev servers (Vite, Storybook) bind to `0.0.0.0`, so their security updates matter even though they never ship.

### Local development & verification
- The local seed user is `admin` / `123`.
- `cd app && pnpm types` already reports errors on `dev`. Compare the output against `dev` instead of expecting zero.
- Verify UI changes in Storybook (`cd app && pnpm storybook`) or in the running app, not only with type checks.

## Conventions

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `perf:`
- **Branches**: `main` (production), `dev` (integration), PRs target `dev`, squash merge
- **File naming**: Backend `camelCase.ts`, components `PascalCase.tsx`, hooks `useXxx.ts`, models `camelCase.ts`, tests `__tests__/name.test.ts`
- **Backend barrels**: `mod.ts`; **Frontend**: no barrels (direct imports)
- **Import order**: external libs → types → core/models → components (atoms→molecules→organisms) → utils
- **No code comments**: do not add explanatory comments; code should be self-documenting through clear naming
- Never mention AI usage in code or documentation
- Do not add AI co-author lines to commits

## GitHub Flow & Releases

- **Features land on `dev`.** Every change is a branch off `dev` with a PR back to `dev`, squash merged. `tests.yml` runs on PRs to `dev`.
- **`main` only receives release PRs** from `dev`. `dev.yml` builds a dev Docker image for PRs to `main`.
- **Release PR:** head `dev`, base `main`, title `Release vX.Y.Z` (semver: minor for features, patch for fixes only). It **must carry a label named exactly `vX.Y.Z`**. Create it if missing: `gh label create vX.Y.Z --description "Release vX.Y.Z" --color 0E8A16`. Merge it as a merge commit, not squash.
- **On merge, `release.yml`** reads the version label, creates the GitHub release and the `vX.Y.Z` tag on `main` (release notes = the PR body), then dispatches `docker.yml` to build and publish the image. Without the label the workflow is skipped and no release happens.
- **Don't create release tags or GitHub releases by hand.** A tag pushed with a personal token also triggers `docker.yml` on tag push, which duplicates the dispatched build.
- **No files hold the version**, so there's nothing to bump. `APP_VERSION` is injected at image build time.
- **Changes since the last release:** `git log --oneline origin/main..origin/dev --no-merges`.

### Release PR body

The body becomes the GitHub release notes. Reference every PR by number:

```markdown
## Release vX.Y.Z

<One sentence: release type and the main themes.>

## Highlights

- **<Feature>** (#123): <what users get, one or two lines>

## What's included

### Features
- **<Title>** (#123): <short description>

### Fixes
- **<Title>** (#124): <symptom and cause in one line>

### Removals / Dependencies / Build & CI
- <only the sections that apply>

## Deploy notes

- <Required config changes, e.g. new or changed `chat.config` keys and their production values>
- <Migrations that run on start (the entrypoint runs `deno task migrate`), with what each one does>
- <Manual checks needed before deploying, behavior changes, caveats>
```

## Key Dependencies

**Backend**: `@planigale/planigale` (HTTP framework), `@planigale/sse`, `@planigale/testing` (test agent), `mongodb`, `valibot`
**Frontend**: `react@19`, `mobx` + `mobx-react-lite`, `styled-components`, `vite`, `storybook`

## Reference Docs

- `docs/ARCHITECTURE.md` — system architecture diagram
- `docs/CONVENTIONS.md` — detailed coding patterns with examples
- `docs/adr/` — 13 Architecture Decision Records
