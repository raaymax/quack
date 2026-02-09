# ADR 008: MongoDB for Persistence

## Status

Accepted

## Context

The application needs a database for users, channels, messages, sessions, emojis, and read receipts. Messages are semi-structured (varying body types, nested threads, attachments). The project values flexible schemas and a straightforward query model. Transaction support is needed for command atomicity.

## Decision

Use **MongoDB** as the primary database, accessed via the official `mongodb` npm package (imported via Deno's `npm:` specifier).

- Each domain entity has a dedicated collection (users, channels, messages, sessions, invitations, emojis, badges).
- The generic `Repo<Query, Model>` base class provides standard CRUD operations.
- Commands execute within MongoDB transactions for atomicity.
- `EntityId` wraps MongoDB `ObjectId` for type safety at the domain level.
- Database connection managed in `deno/server/infra/db.ts`.

## Consequences

- **Positive:** Flexible schema — message bodies with varying structures (text, files, threads) store naturally as documents.
- **Positive:** Transaction support (replica set required) — enables atomic command execution.
- **Positive:** Rich query capabilities — text search, aggregation pipeline for message search.
- **Positive:** Mature driver — the official MongoDB Node.js driver works well via Deno's npm compatibility.
- **Negative:** Requires a replica set for transaction support (even single-node deployments).
- **Negative:** No referential integrity — relationships between collections are not enforced at the database level.
- **Negative:** Schema migrations require custom tooling (`deno/migrate/`).
