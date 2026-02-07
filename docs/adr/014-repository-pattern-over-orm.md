# ADR 014: Repository Pattern over ORM for Database Access

## Status

Accepted

## Context

The application uses Clean Architecture with a clear separation between core business logic and infrastructure. Database access needs a pattern that:

- Keeps the core layer independent of any specific database engine (MongoDB, SQLite, PostgreSQL, SurrealDB).
- Avoids leaking database-specific types (e.g. MongoDB `ObjectId`, SurrealDB `RecordId`) into domain or API layers.
- Minimizes the number of places where entity shapes are defined — duplicated type definitions across layers have been a recurring source of bugs.
- Allows swapping the underlying database without changing business logic.

ORMs (Drizzle, Prisma, TypeORM, Mongoose) were considered. While they reduce boilerplate and offer type inference from schema definitions, they tightly couple the data layer to a specific database engine and query DSL. They also impose their own patterns for transactions, relations, and migrations that conflict with the existing command/query architecture.

## Decision

Use the **Repository pattern** with explicit DTOs for all database access. No ORM.

- **Repository interface** — defined in the core layer, expressed in domain types (plain TypeScript types with branded string IDs). The core layer never imports database-specific code.
- **Repository implementation** — in the infra layer, one implementation per database engine. Each adapter handles the minimal conversion between domain types and the database's native format (e.g. `id` to `_id` renaming for MongoDB).
- **Valibot as source of truth** — entity schemas are defined once as Valibot schemas. TypeScript types are derived via `v.InferOutput`. Repos use `v.parse()` on read to validate and coerce data from the database into the correct domain types, replacing hand-written serializers.
- **Branded string IDs** — entity IDs are plain strings at runtime (ULID/UUID), with a branded type for compile-time safety. No database-specific ID classes in domain code.

```typescript
// Schema — single source of truth
const MessageSchema = v.object({
  id:        vEntityId,
  channelId: vEntityId,
  userId:    vEntityId,
  flat:      v.string(),
  pinned:    v.boolean(),
  createdAt: vDateTime,
});
type Message = v.InferOutput<typeof MessageSchema>;

// Repo interface — in core, uses domain types
interface MessageRepo {
  create(data: Omit<Message, 'id'>): Promise<EntityId>;
  get(id: EntityId): Promise<Message | null>;
}

// Repo implementation — in infra, handles DB specifics
class MongoMessageRepo implements MessageRepo {
  async get(id: EntityId): Promise<Message | null> {
    const raw = await collection.findOne({ _id: id });
    if (!raw) return null;
    const { _id, ...rest } = raw;
    return v.parse(MessageSchema, { id: String(_id), ...rest });
  }
}
```

## Consequences

- **Positive:** Database engine is a pluggable implementation detail — can support MongoDB, SQLite, PostgreSQL, or others by adding a new repo implementation.
- **Positive:** No database-specific types leak into core or API layers — branded strings work everywhere.
- **Positive:** Valibot schemas as single source of truth — entity shapes defined once, types derived, validation on DB read catches data inconsistencies.
- **Positive:** No ORM lock-in — free to choose the best database for the deployment target (e.g. SQLite on Raspberry Pi, MongoDB in Docker, PostgreSQL in cloud).
- **Positive:** Aligns with existing command/query pattern — repos are called from command/query handlers, transactions are managed at that level.
- **Negative:** More boilerplate per database adapter than an ORM would require.
- **Negative:** No auto-generated migrations — schema changes require manual migration scripts.
- **Negative:** Query building is manual — no ORM query builder or relation loading.
