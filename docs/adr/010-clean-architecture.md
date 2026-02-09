# ADR 010: Clean Architecture (Core/Infra/Inter)

## Status

Accepted

## Context

The backend needs clear separation between business logic, data access, and HTTP transport. Without boundaries, business rules tend to leak into route handlers, and database queries scatter across the codebase. The project needs a structure where core logic can be tested independently of infrastructure.

## Decision

Organize the backend into three layers following **Clean Architecture** principles:

```
┌──────────────────────────────────────┐
│           Inter (Interface)           │  HTTP routes, middleware, CLI
│  deno/server/inter/                  │  Depends on: Core
├──────────────────────────────────────┤
│           Infra (Infrastructure)      │  MongoDB repos, database
│  deno/server/infra/                  │  Implements: Core interfaces
├──────────────────────────────────────┤
│           Core (Business Logic)       │  Commands, queries, events, errors
│  deno/server/core/                   │  Depends on: nothing external
└──────────────────────────────────────┘
```

### Dependency Rules

- **Core** depends on nothing from `infra` or `inter`. It defines interfaces and types.
- **Infra** implements Core interfaces (repositories). It imports Core types but never Inter.
- **Inter** depends on Core (invokes commands/queries, catches domain errors). It never imports directly from Infra.
- The `Core` class acts as the composition root, wiring together all layers.

### Layer Responsibilities

| Layer | Contains | Example |
|-------|----------|---------|
| Core | Commands, queries, events, errors, domain types, bus | `createCommand()`, `AppError`, `Events` |
| Infra | Repository implementations, database connection | `Repo<Q,M>`, `ChannelRepo`, `db.ts` |
| Inter | HTTP routes, middleware, error mapping, CLI | `Route`, `auth.ts` middleware, `errors.ts` |

## Consequences

- **Positive:** Business logic is isolated and testable without database or HTTP concerns.
- **Positive:** Swapping infrastructure (e.g., different database) requires changes only in `infra/`.
- **Positive:** HTTP layer is thin — routes delegate immediately to core commands/queries.
- **Positive:** Error mapping is centralized in the inter layer.
- **Negative:** More files and indirection compared to a flat structure.
- **Negative:** The `Core` class as composition root can become large as the application grows.
- **Negative:** Strict layer rules require discipline — it's tempting to shortcut boundaries.
