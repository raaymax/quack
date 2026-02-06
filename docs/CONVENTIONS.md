# Quack Chat — Coding Conventions

## File Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Backend (Deno) | `camelCase.ts` | `userRepo.ts`, `createMessage.ts` |
| React components | `PascalCase.tsx` | `NavChannel.tsx`, `LoginPage.tsx` |
| Storybook stories | `PascalCase.stories.tsx` | `Badge.stories.tsx` |
| Context providers | `camelCase.tsx` | `appState.tsx`, `theme.tsx` |
| Hooks | `useXxx.ts` | `useSidebar.ts`, `useSize.ts` |
| MobX models | `camelCase.ts` | `channel.ts`, `messages.ts` |
| Test files | Inside `__tests__/` directory | `__tests__/create.test.ts` |

## Module Barrels

- **Backend (Deno):** Use `mod.ts` as barrel file (Deno convention).
- **Frontend (React):** No barrel files. Use direct imports to enable tree-shaking.

```typescript
// Backend — re-export from mod.ts
export { createCommand } from "./command.ts";
export { Core } from "./core.ts";

// Frontend — import directly, no index.ts barrels
import { Badge } from "../atoms/Badge";
import { NavChannel } from "../molecules/NavChannel";
```

## Component Pattern

Every React component follows this structure:

```tsx
// 1. Props interface
interface BadgeProps {
  count: number;
  variant?: "default" | "alert";
}

// 2. Styled components (if needed)
const Container = styled.div<{ $variant: string }>`
  background: ${({ theme, $variant }) =>
    $variant === "alert" ? theme.alertBg : theme.defaultBg};
`;

// 3. Component function wrapped with observer()
export const Badge = observer(({ count, variant = "default" }: BadgeProps) => {
  return <Container $variant={variant}>{count}</Container>;
});
```

Key rules:
- Props interface named `XxxProps`, declared above the component.
- Styled-components use transient props (`$prefix`) to avoid DOM forwarding.
- Export the component wrapped in `observer()` from `mobx-react-lite`.
- One component per file (co-located styled-components are fine).

## Backend Command Pattern

Commands represent write operations. They are validated with Valibot schemas and run inside MongoDB transactions.

```typescript
import * as v from "valibot";
import { createCommand } from "../command.ts";

export default createCommand({
  type: "channel:create",
  body: v.object({
    userId: Id,
    name: v.string(),
    channelType: v.picklist(["public", "private"]),
  }),
}, async (core, { userId, name, channelType }) => {
  // Business logic here — runs in a transaction
  const channel = await core.repo.channel.create({ name, channelType });
  await core.bus.dispatch("channel:created", { channel, userId });
  return channel;
});
```

## Backend Query Pattern

Queries represent read operations. No transactions, no side effects.

```typescript
import * as v from "valibot";
import { createQuery } from "../query.ts";

export default createQuery({
  type: "channel:list",
  body: v.object({
    userId: Id,
  }),
}, async (core, { userId }) => {
  return await core.repo.channel.getAll({ userId });
});
```

## Backend Route Pattern

Each route file exports a factory function that takes `Core` and returns a `Route`:

```typescript
import { Route } from "@planigale/planigale";
import type { Core } from "../../core/core.ts";

export default (core: Core) =>
  new Route({
    method: "POST",
    url: "/api/channels",
    schema: {
      body: { name: "string", channelType: "string" },
    },
    handler: async (req) => {
      const result = await core.channel.create({
        userId: req.state.userId,
        ...req.body,
      });
      return Response.json(result, { status: 201 });
    },
  });
```

## Repository Pattern

Repositories extend the generic `Repo<Query, Model>` base class:

```typescript
import { Repo } from "../repo.ts";

export class ChannelRepo extends Repo<ChannelQuery, Channel> {
  COLLECTION = "channels";

  makeQuery(query: ChannelQuery) {
    // Convert domain query to MongoDB filter
    return { ...query };
  }
}
```

The base class provides: `create()`, `get()`, `getR()` (required — throws if not found), `getAll()`, `update()`, `remove()`, `count()`.

## Error Pattern

Domain errors are defined in core and mapped to HTTP in the inter layer:

```typescript
// Core — define domain error
export class ResourceNotFound extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, "RESOURCE_NOT_FOUND");
  }
}

// Inter — map to HTTP (in errors.ts middleware)
if (error instanceof ResourceNotFound) {
  return Response.json({ error: error.message }, { status: 404 });
}
```

## Context Pattern

React Contexts follow a consistent create-provide-consume pattern:

```typescript
// 1. Create context with null default
const SidebarContext = createContext<SidebarState | null>(null);

// 2. Hook with null check
export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
};

// 3. Provider component
export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const state = useMemo(() => new SidebarState(), []);
  return (
    <SidebarContext.Provider value={state}>
      {children}
    </SidebarContext.Provider>
  );
};
```

## Import Order

Organize imports in this order, separated by blank lines:

```typescript
// 1. External libraries
import { observer } from "mobx-react-lite";
import styled from "styled-components";

// 2. Types
import type { Channel } from "@quack/api";

// 3. Core / models
import { useApp } from "../contexts/appState";

// 4. Components (atoms → molecules → organisms)
import { Icon } from "../atoms/Icon";
import { Button } from "../molecules/Button";

// 5. Utilities / helpers
import { formatDate } from "../utils/date";
```

## Testing

### Backend (Deno)

- Tests live in `__tests__/` directories adjacent to the code they test.
- Use `Deno.test()` as the test runner.
- Use `@planigale/testing` `Agent` for HTTP integration tests.
- Test files follow the pattern `featureName.test.ts`.

```typescript
import { assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";

Deno.test("channel:create - creates a public channel", async () => {
  const agent = await Agent.from(app);
  const res = await agent.post("/api/channels", {
    body: { name: "general", channelType: "public" },
  });
  assertEquals(res.status, 201);
});
```

### Frontend

- No component-level tests currently (planned).
- Storybook stories serve as visual tests.
- Chromatic for visual regression testing.

## Git Conventions

### Commit Messages

Follow **Conventional Commits**:

```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`.

Scopes: `storybook`, `emoji`, `auth`, `channels`, `messages`, `encryption`, etc.

Examples:
```
feat(channels): add direct message channel creation
fix(emoji): cache Fuse instance to prevent infinite render loop
chore(storybook): standardize molecule and organism stories
docs(architecture): add system architecture documentation
```

### Branch Strategy

- `main` — Production-ready releases (squash merge from `dev`).
- `dev` — Integration branch (PRs target here).
- Feature branches — `feature/description` or `fix/description`.

### Pull Requests

- PRs target the `dev` branch.
- Squash merge to keep linear history.
- CI must pass before merge.

## Styling

- Use **styled-components** for all CSS.
- Access theme values via `${({ theme }) => theme.property}`.
- Use transient props (`$propName`) for styled-component-only props.
- Theme definitions live in `app/src/js/components/contexts/themes.json`.
- Four themes available: `light`, `dark`, `test`, `dark-orange-test`.

## Related Documents

- [System Architecture](ARCHITECTURE.md)
- [Architecture Decision Records](adr/README.md)
