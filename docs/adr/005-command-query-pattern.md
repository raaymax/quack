# ADR 005: Command/Query Separation with Valibot Validation

## Status

Accepted

## Context

The backend business logic needs a consistent pattern for handling write and read operations. Without structure, handlers tend to mix validation, business rules, and persistence concerns. The project also needs input validation at the boundary between the HTTP layer and business logic.

## Decision

Implement **Command/Query Separation** using factory functions with **Valibot** schema validation:

- **Commands** (`createCommand()`) — Write operations that modify state. Each command declares a `type` string and a `body` Valibot schema. Commands run inside MongoDB transactions.
- **Queries** (`createQuery()`) — Read operations that return data. Same declaration pattern but no transactions and no side effects.

```typescript
// Command — validated, transactional
createCommand({
  type: "message:create",
  body: v.object({ channelId: Id, content: v.string() }),
}, async (core, body) => { /* ... */ });

// Query — validated, read-only
createQuery({
  type: "message:list",
  body: v.object({ channelId: Id, limit: v.number() }),
}, async (core, body) => { /* ... */ });
```

Commands and queries are collected into namespaced collections on the `Core` class (`core.channel.create`, `core.message.list`, etc.).

## Consequences

- **Positive:** Clear separation of reads and writes at the architecture level.
- **Positive:** Input validation is guaranteed before business logic runs (Valibot schemas).
- **Positive:** Commands run in transactions, providing atomicity for write operations.
- **Positive:** Consistent API — every operation has a type, validated input, and a handler.
- **Positive:** Type safety — Valibot infers TypeScript types from schemas.
- **Negative:** Overhead for simple operations that don't need transactions.
- **Negative:** Two factory functions to understand (`createCommand` vs `createQuery`).
- **Negative:** Not full CQRS — reads and writes share the same database and models.
