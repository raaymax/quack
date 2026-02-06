# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for Quack Chat.

## Index

| # | Decision | Status |
|---|----------|--------|
| [001](001-deno-runtime.md) | Deno 2 as runtime for backend and build tooling | Accepted |
| [002](002-mobx-state-management.md) | MobX with `makeAutoObservable` for reactive UI state | Accepted |
| [003](003-atomic-design.md) | Atomic Design hierarchy for component organization | Accepted |
| [004](004-planigale-framework.md) | Planigale as HTTP framework | Accepted |
| [005](005-command-query-pattern.md) | Command/Query separation with Valibot validation | Accepted |
| [006](006-server-sent-events.md) | Server-Sent Events for real-time communication | Accepted |
| [007](007-styled-components.md) | styled-components for CSS-in-JS theming | Accepted |
| [008](008-mongodb-persistence.md) | MongoDB with transaction support | Accepted |
| [009](009-e2e-encryption.md) | Client-side E2E encryption (AES-GCM + ECDH + PBKDF2) | Accepted |
| [010](010-clean-architecture.md) | Core/Infra/Inter layer separation in backend | Accepted |
| [011](011-deno-workspace.md) | Monorepo with Deno workspace for shared modules | Accepted |
| [012](012-pwa-first.md) | PWA-first with Capacitor native shell for Android | Accepted |
| [013](013-custom-push-notifications.md) | Custom push notifications via SSE (no FCM/Google dependency) | Accepted |

## Format

Each ADR follows this structure:

- **Title** — Short descriptive name
- **Status** — Accepted, Superseded, or Deprecated
- **Context** — What motivated the decision
- **Decision** — What was decided
- **Consequences** — Trade-offs and implications
