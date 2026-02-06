# ADR 001: Deno 2 as Runtime

## Status

Accepted

## Context

The backend needed a JavaScript/TypeScript runtime. The main candidates were Node.js and Deno. The project values TypeScript-first development, built-in security, and modern standards-based APIs.

## Decision

Use **Deno 2** as the runtime for the backend server and all shared modules. The frontend build toolchain (Vite, Storybook) currently runs on Node.js/npm due to stability issues in Deno's Node compatibility layer that caused crashes. The plan is to migrate the frontend to Deno once these issues are resolved.

Key factors:
- **Native TypeScript** — No compilation step needed for backend code.
- **Standards-based APIs** — Web-standard `fetch`, `Request`, `Response`, `crypto`, `EventTarget` used throughout.
- **Built-in tooling** — `deno fmt`, `deno lint`, `deno test` eliminate the need for separate tool configurations.
- **Permission model** — Explicit `--allow-net`, `--allow-read`, etc. for defense in depth.
- **JSR package registry** — Used for the custom Planigale framework and other dependencies.
- **Deno 2 compatibility** — `npm:` specifiers allow importing Node packages (e.g., MongoDB driver) without shims.

## Consequences

- **Positive:** Single-language stack (TypeScript everywhere), no transpilation for backend, built-in formatter/linter/test runner, modern standard APIs.
- **Positive:** Deno and browser environments share the same Web APIs, so packages written for one work in both — shared modules (`@quack/encryption`, `@quack/api`) run unmodified in Deno and the browser.
- **Negative:** Smaller ecosystem than Node.js — some libraries require `npm:` compatibility shims.
- **Negative:** Developers need familiarity with Deno conventions (`mod.ts` barrels, `deno.jsonc` config, JSR imports).
- **Negative:** Two package management systems in one repo (Deno + npm) — temporary, pending Deno stability fixes for the frontend toolchain.
