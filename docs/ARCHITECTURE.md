# Quack Chat — System Architecture

## Overview

Quack is a self-hosted, privacy-focused chat application. The system is a **React 19 Progressive Web App** communicating with a **Deno 2 backend**, both packaged in a single Docker container. Data is persisted in **MongoDB** with optional file storage on the local filesystem or Google Cloud Storage.

```
┌─────────────────────────────────────────────────────┐
│                   Docker Container                   │
│                                                      │
│  ┌──────────────┐         ┌───────────────────────┐ │
│  │  Vite-built   │  serve  │     Deno 2 Server     │ │
│  │  React 19 PWA │◄───────►│  (Planigale HTTP)     │ │
│  │  (static)     │         │                       │ │
│  └──────────────┘         │  REST API + SSE        │ │
│                            │  E2E Encryption        │ │
│                            └──────────┬────────────┘ │
│                                       │              │
│                            ┌──────────▼────────────┐ │
│                            │      MongoDB          │ │
│                            └───────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

An optional **Capacitor** shell wraps the PWA for native Android distribution with background push notifications.

---

## Repository Structure

```
quack/
├── app/                          # Frontend (React 19 + TypeScript)
│   ├── src/
│   │   ├── js/
│   │   │   ├── components/       # Atomic Design component tree
│   │   │   │   ├── atoms/        #   Basic UI primitives
│   │   │   │   ├── molecules/    #   Composed building blocks
│   │   │   │   ├── organisms/    #   Complex features
│   │   │   │   ├── pages/        #   Full-page views
│   │   │   │   ├── contexts/     #   React context providers
│   │   │   │   ├── hooks/        #   Custom React hooks
│   │   │   │   └── layout/       #   Layout wrappers
│   │   │   ├── core/             # Application state & services
│   │   │   │   ├── models/       #   MobX state tree (16 models)
│   │   │   │   └── index.ts      #   AppModel singleton
│   │   │   └── services/         # Service modules
│   │   ├── assets/               # Fonts, styles, icons
│   │   └── stories/              # Storybook assets
│   ├── .eslintrc.cjs             # ESLint configuration
│   ├── package.json
│   └── vite.config.ts
│
├── deno/                         # Backend (Deno 2)
│   ├── server/                   # Main server application
│   │   ├── core/                 #   Business logic (commands, queries, events)
│   │   ├── infra/                #   Data access (MongoDB repositories)
│   │   └── inter/                #   Interface (HTTP routes, CLI)
│   ├── api/                      # Shared API types & client
│   ├── config/                   # Configuration module
│   ├── encryption/               # Cryptographic primitives
│   ├── storage/                  # File storage abstraction
│   ├── migrate/                  # Database migrations
│   └── tools/                    # Dev/build utilities
│
├── mobile/                       # Capacitor Android shell
├── migrations/                   # MongoDB migration scripts
├── plugins/                      # Plugin system
├── docs/                         # Architecture & decision docs
├── deno.jsonc                    # Workspace config & tasks
├── Dockerfile
└── docker-compose.yml
```

---

## Backend Architecture

The backend follows **Clean Architecture** with three layers. Dependencies point inward — `inter` depends on `core`, `infra` implements `core` interfaces, but `core` depends on nothing external.

### Core Layer (`deno/server/core/`)

Business logic organized by domain aggregate:

| Domain | Commands | Queries |
|--------|----------|---------|
| `channel/` | create, remove, join, leave, getDirect, putDirect | list, get |
| `message/` | create, update, remove, react, pin | list, search, get |
| `user/` | create, resetPassword, verifyReset, checkToken, setProfile, setAvatar | list, get |
| `session/` | create, remove | get |
| `emoji/` | create, remove | list |
| `readReceipt/` | update | list |
| `command/` | execute | — |

**Key modules:**

- **`command.ts`** — `createCommand({ type, body: valibotSchema }, handler)` factory. Commands run inside MongoDB transactions.
- **`query.ts`** — `createQuery({ type, body: valibotSchema }, handler)` factory. Read-only, no transactions.
- **`bus.ts`** — Internal message bus for cross-domain communication.
- **`events.ts`** — Event emitter (`on`, `once`, `dispatch`) for side effects.
- **`errors.ts`** — Domain errors (`AppError` base class): `ResourceNotFound`, `AccessDenied`, `NotOwner`, `InvalidMessage`, `UserAlreadyExists`, etc.
- **`types.ts`** — Valibot schemas for core data structures.
- **`core.ts`** — `Core` class aggregating all commands, queries, repos, bus, storage, and config. Exposes namespaced methods (`core.channel.*`, `core.message.*`, etc.).

### Infra Layer (`deno/server/infra/`)

Data access implemented with MongoDB:

- **`repo.ts`** — Generic `Repo<Query, Model>` base class with `create()`, `get()`, `getR()`, `getAll()`, `update()`, `remove()`, `count()`.
- **`db.ts`** — MongoDB client wrapper.
- **Domain repositories** — `userRepo.ts`, `sessionRepo.ts`, `channelRepo.ts`, `messageRepo.ts`, `invitationRepo.ts`, `emojiRepo.ts`, `badgeRepo.ts`. Each defines a `COLLECTION` name and `makeQuery()` method.
- **`repo/mod.ts`** — `Repository` class aggregating all repos (`repo.user`, `repo.channel`, etc.).

### Inter Layer (`deno/server/inter/`)

Interface layer exposing the core via HTTP:

- **`http/mod.ts`** — `HttpInterface` class extending the Planigale framework. Builds all routes, applies middleware, serves static frontend files.
- **`http/middleware/auth.ts`** — Session-based authentication middleware.
- **`http/errors.ts`** — Maps domain `AppError` subclasses to HTTP status codes.
- **`http/routes/`** — Route modules organized by domain: `auth/`, `channels/`, `messages/`, `users/`, `profile/`, `emojis/`, `files/`, `system/`, `mobile/`.
- **`cli/mod.ts`** — Minimal CLI interface.

**Route pattern:** Each route file exports `(core: Core) => new Route({ method, url, schema, handler })`.

---

## Frontend Architecture

### Atomic Design Hierarchy

Components follow **Atomic Design** under `app/src/js/components/`:

| Level | Count | Purpose | Example |
|-------|-------|---------|---------|
| **Atoms** | ~25 | Basic UI primitives | `Icon`, `Badge`, `BaseButton`, `Tooltip` |
| **Molecules** | ~30 | Composed building blocks | `Button`, `NavChannel`, `MessageBody`, `Emoji` |
| **Organisms** | ~10 | Complex feature sections | `Input`, `Message`, `Sidebar`, `Conversation` |
| **Pages** | ~5 | Full-page views | `LoginPage`, `ErrorPage`, `RegistrationPage` |

### State Management (MobX)

State is managed via a **MobX observable tree** rooted at `AppModel`:

```
AppModel (app/src/js/core/models/app.ts)
├── channels    — ChannelsModel (channel list + loading)
├── users       — UsersModel (all workspace users)
├── emojis      — EmojisModel (standard + custom emoji)
├── readReceipt — ReadReceiptModel (per-channel read state)
├── info        — InfoModel (app version, config)
├── search      — SearchModel (query + results)
├── thread      — ThreadModel (active thread state)
├── input       — InputModel (draft messages)
├── files       — FilesModel (uploaded file tracking)
└── messages    — MessagesModel (per-channel message lists)
```

Each model uses `makeAutoObservable(this)`. Components are wrapped with `observer()` from `mobx-react-lite` for reactive re-rendering.

### Context Providers

React Contexts provide dependency injection for non-MobX concerns:

| Context | Provider | Hook | Purpose |
|---------|----------|------|---------|
| `AppContext` | `AppProvider` | `useApp()` | Access to AppModel root |
| `ThemeSelectorContext` | `ThemeSelectorProvider` | `useThemeControl()` | Theme switching (4 themes) |
| `InputContext` | `InputProvider` | `useInput()` | Input component state |
| `MessageContext` | `MessageProvider` | `useMessage()` | Active message data |
| `HoverContext` | `HoverProvider` | `useHovered()` | Hover state tracking |
| `SidebarContext` | `SidebarProvider` | `useSidebar()` | Sidebar open/collapsed |
| `SizeContext` | `SizeProvider` | `useSize()` | Viewport dimensions |
| `TooltipContext` | `TooltipProvider` | `useTooltip()` | Tooltip positioning |

Pattern: `createContext(null)` + `useXxx()` hook with null check + `XxxProvider` component.

### Client / API Layer

`app/src/js/core/client.ts` wraps `deno/api/mod.ts` — a shared API client class that:

- Makes REST calls with token-based auth
- Maintains an SSE connection for real-time events
- Handles encryption key management
- Implements automatic retry with exponential backoff

---

## Data Flow

### REST Request/Response

```
React Component
  → MobX action (model method)
    → API client (fetch call)
      → HTTP route (inter layer)
        → Command/Query (core layer)
          → Repository (infra layer)
            → MongoDB
```

### Real-Time (SSE) Pipeline

```
Core event dispatched
  → SSE route streams event to connected clients
    → API client EventSource receives event
      → Client dispatches to MobX model
        → observer() components re-render
```

Events flow through Server-Sent Events (SSE) rather than WebSockets. Each authenticated client holds a persistent SSE connection at `/api/sse`. The server pushes events for new messages, typing indicators, channel updates, etc.

---

## Shared Modules

All shared modules live under `deno/` and are configured as Deno workspace members:

| Module | Package | Purpose |
|--------|---------|---------|
| `deno/api` | `@quack/api` | API types (`Channel`, `User`, `Message`, `EntityId`) and client class |
| `deno/config` | `@quack/config` | Configuration types, loader, and definition builder |
| `deno/encryption` | `@quack/encryption` | Cryptographic primitives (see below) |
| `deno/storage` | `@quack/storage` | File storage abstraction (FS, GCS, Memory) |
| `deno/tools` | `@quack/tools` | Utilities (cache, merger, range requests, SSL generation) |

The frontend imports `@quack/api` and `@quack/encryption` directly. Backend services import all modules.

---

## Encryption Architecture

Quack implements **client-side end-to-end encryption**. The server never sees plaintext message content.

### Algorithms

| Algorithm | Use | Parameters |
|-----------|-----|------------|
| **PBKDF2** | Key derivation from password | SHA-256, 100k iterations, 256-bit key |
| **AES-GCM** | Symmetric message encryption | 256-bit key, 12-byte IV |
| **ECDH** | Key exchange between users | P-256 curve |
| **Secret splitting** | Backup key distribution | XOR-based 2-of-2 split |

### Key Flow

1. **Registration** — Password → PBKDF2 derives encryption key → generates EC key pair + AES user key → encrypts secrets with password key → stores encrypted secrets on server.
2. **Login** — Password → PBKDF2 derives key → decrypts session secrets (private EC key + user encryption key).
3. **Messaging** — Sender's EC private key + recipient's EC public key → ECDH → shared AES key → AES-GCM encrypts message.
4. **Key backup** — User encryption key is XOR-split into two shares for recovery.

---

## Module Boundary Rules

### Backend

- **Core** imports nothing from `infra` or `inter`. It defines interfaces that infra implements.
- **Infra** imports from `core` (types, interfaces). Never imports from `inter`.
- **Inter** imports from `core` (commands, queries, errors). Never imports directly from `infra`.
- **Shared modules** (`@quack/*`) may be imported by any layer.

### Frontend

- **Atoms** import only from other atoms, external libraries, and utilities.
- **Molecules** import from atoms and other molecules. Never from organisms or pages.
- **Organisms** import from atoms and molecules. Never from pages.
- **Pages** can import from any component level.
- **Models** (`core/models/`) never import from `components/`.
- **Contexts** may import from models but not from specific components.

---

## Related Documents

- [Coding Conventions](CONVENTIONS.md)
- [Architecture Decision Records](adr/README.md)
- [Mobile App Documentation](mobile-app.md)
