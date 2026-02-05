# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quack is a self-hosted, open-source chat application (similar to Slack) with E2EE support. It's a monorepo with a Deno backend and React frontend (Node.js for frontend tooling due to Deno compatibility issues).

## Commit Convention

Use conventional commits format: `type(scope): message`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Example: `feat(messages): add emoji reactions`

## Common Commands

### Development

```bash
# Generate SSL certificates (required for dev)
deno task ssl

# Backend (from root)
deno task dev

# Frontend (from root or app/)
cd app && npm install && npm run dev

# Both together (vite dev server proxies /api to backend)
# Terminal 1: deno task dev
# Terminal 2: cd app && npm run dev
```

### Testing

```bash
# Run all tests (uses test database)
deno task test

# Run single test file
DATABASE_URL='mongodb://chat:chat@localhost:27017/tests?authSource=admin' deno test -A deno/server/path/to/test.ts

# Run tests matching pattern
DATABASE_URL='mongodb://chat:chat@localhost:27017/tests?authSource=admin' deno test -A --filter "pattern"
```

### Linting & Formatting

```bash
# Format and lint backend
deno fmt && deno lint

# Full check (format, lint, test)
deno task check
```

### Database

```bash
# Run migrations
deno task migrate

# Run migrations for test db
deno task migrate:tests
```

### Storybook

```bash
cd app && npm run storybook
```

## Architecture

### Backend (Deno Workspace)

The backend uses Deno workspaces defined in `deno.jsonc`. Key packages:

- **@quack/config** (`deno/config/`) - Configuration loading from `chat.config.ts` and `secrets.json`
- **@quack/api** (`deno/api/`) - Shared API client used by both frontend and backend, includes types and SSE client
- **@quack/storage** (`deno/storage/`) - File storage abstraction (fs, memory, GCS)
- **@quack/encryption** (`deno/encryption/`) - E2EE utilities
- **@quack/tools** (`deno/tools/`) - Shared utilities

### Server (`deno/server/`)

Uses the Planigale framework (jsr:@planigale/planigale). Architecture follows ports & adapters pattern:

- **core/** - Business logic and domain commands (CQRS pattern)
  - `core.ts` - Main `Core` class with command dispatch and query methods
  - `bus.ts` - Event bus for real-time notifications
  - Domain folders: `message/`, `channel/`, `user/`, `session/`, `emoji/`, `readReceipt/`
  - `command/commands/` - Slash commands (/invite, /join, /leave, /emoji, /avatar, /version)
- **infra/** - Infrastructure (MongoDB repository)
- **inter/** - Interface adapters
  - `http/` - REST API routes and middleware
  - `cli/` - CLI interface

### Frontend (`app/`)

React 19 + Vite + MobX + styled-components. Built as PWA with Tauri support for desktop.

- **src/js/core/** - State management with MobX models
  - `client.ts` - API client wrapper
  - `models/` - MobX stores (app, channels, messages, users, etc.)
- **src/js/components/** - React components following atomic design
  - `atoms/` - Basic UI elements
  - `molecules/` - Composite components
  - `organisms/` - Complex features
  - `pages/` - Route pages
  - `layout/` - Layout components

### Plugin System

Plugins are defined in `chat.config.ts` and loaded at server startup. See `plugins/giphy.ts` for an example. Plugins can:
- Register slash commands via `core.registerUserCommand()`
- Listen to events via `core.events.on()`
- Send messages via `core.bus.direct()`

### API Client (`deno/api/`)

Shared between frontend and backend. Uses SSE for real-time updates. Key patterns:
- `api.req()` for request/response operations
- Event listeners via `api.on(eventType, handler)`
- File uploads via `api.files`
- Auth via `api.auth`

## Configuration

Create `chat.config.ts` in root (use `chat.config.example.ts` as template). Key options:
- `port` - Server port (default 8080)
- `databaseUrl` - MongoDB connection string
- `storage.type` - 'fs', 'memory', or 'gcs'
- `plugins` - Array of plugin functions

Default credentials: `admin / 123`
