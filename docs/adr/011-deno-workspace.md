# ADR 011: Deno Workspace Monorepo

## Status

Accepted

## Context

The project has multiple packages that share code: the server, API types, configuration, encryption, storage, migrations, and tools. These modules need to be independently importable but developed together. Options included npm workspaces, Deno workspace, Turborepo, and Nx.

## Decision

Use **Deno workspace** (configured in root `deno.jsonc`) to manage the monorepo. Each shared module is a workspace member:

```jsonc
{
  "workspace": [
    "./deno/config",
    "./deno/server",
    "./deno/storage",
    "./deno/migrate",
    "./deno/encryption",
    "./deno/api",
    "./deno/tools"
  ]
}
```

Each workspace member has its own `deno.json`/`deno.jsonc` with module-specific configuration. Shared dependencies are declared in the root `deno.jsonc` imports map.

The frontend (`app/`) is **not** a Deno workspace member — it uses npm/Vite with its own `package.json`.

## Consequences

- **Positive:** Single `deno.lock` for all Deno dependencies — consistent versions across modules.
- **Positive:** Workspace-relative imports between modules work without publishing.
- **Positive:** `deno fmt`, `deno lint`, `deno test` operate across all workspace members from the root.
- **Positive:** Shared import map — common dependencies like `valibot`, `mongodb`, `@std/*` declared once.
- **Negative:** Frontend is a separate ecosystem (npm) — not integrated into the Deno workspace.
- **Negative:** Deno workspace is less mature than npm workspaces — fewer tools and documentation.
- **Negative:** All workspace members share the same `deno.lock`, which can lead to version conflicts.
