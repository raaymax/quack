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

# Frontend
cd app && npm run dev      # Vite dev server (port 3000, HTTPS)
cd app && npm run build    # Production build
cd app && npm run lint     # ESLint
cd app && npm run storybook # Storybook (port 6006)

# Full stack
deno task check            # fmt + lint + test (all backend)
deno task migrate          # Run database migrations
deno task migrate:tests    # Migrations on test database

# Testing
deno task test                              # All backend tests (needs MongoDB)
deno test -A deno/server/inter/http/routes/__tests__/channels.test.ts  # Single test file
deno test -A --filter "channel:create"      # Filter by test name
cd app && npm run types                     # TypeScript check (frontend)
cd app && npm run chromatic                 # Visual regression testing
```

## Architecture

**Monorepo**: Deno workspace (backend) + npm (frontend), single Docker container.

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
plugins/                # Plugin system (e.g., giphy)
mobile/                 # Capacitor Android shell
```

### Backend (Clean Architecture — 3 layers)

- **Core** (`deno/server/core/`): Domain logic. `createCommand()` (write ops, Valibot validation, MongoDB transactions) and `createQuery()` (read ops). Internal event bus for cross-domain communication. Domain errors (`AppError`, `ResourceNotFound`, `AccessDenied`).
- **Infra** (`deno/server/infra/`): Generic `Repo<Query, Model>` base class with CRUD. Domain-specific repos. MongoDB client.
- **Inter** (`deno/server/inter/`): HTTP routes organized by domain under `http/routes/`. Session-based auth middleware. Error-to-HTTP mapping.

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

## Conventions

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `perf:`
- **Branches**: `main` (production), `dev` (integration), PRs target `dev`, squash merge
- **File naming**: Backend `camelCase.ts`, components `PascalCase.tsx`, hooks `useXxx.ts`, models `camelCase.ts`, tests `__tests__/name.test.ts`
- **Backend barrels**: `mod.ts`; **Frontend**: no barrels (direct imports)
- **Import order**: external libs → types → core/models → components (atoms→molecules→organisms) → utils
- **No code comments**: do not add explanatory comments; code should be self-documenting through clear naming
- Never mention AI usage in code or documentation
- Do not add AI co-author lines to commits

## Key Dependencies

**Backend**: `@planigale/planigale` (HTTP framework), `@planigale/sse`, `@planigale/testing` (test agent), `mongodb`, `valibot`
**Frontend**: `react@19`, `mobx` + `mobx-react-lite`, `styled-components`, `react-router-dom@7`, `vite`, `storybook`

## Reference Docs

- `docs/ARCHITECTURE.md` — system architecture diagram
- `docs/CONVENTIONS.md` — detailed coding patterns with examples
- `docs/adr/` — 13 Architecture Decision Records
