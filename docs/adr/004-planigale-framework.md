# ADR 004: Planigale as HTTP Framework

## Status

Accepted

## Context

The Deno backend needs an HTTP framework for routing, middleware, request validation, and response handling. Options included Oak (most popular Deno framework), Hono, Fresh, and Planigale. The project prioritizes standard Web APIs and a lightweight approach.

## Decision

Use **Planigale** (`jsr:@planigale/planigale`) as the HTTP framework. Planigale is a custom framework published on JSR, built around standard `Request`/`Response` objects.

Related packages from the Planigale ecosystem:
- `@planigale/body-parser` — Request body parsing.
- `@planigale/schema` — Schema-based request validation.
- `@planigale/sse` — Server-Sent Events support.
- `@planigale/testing` — Test agent for HTTP integration tests.

## Consequences

- **Positive:** Built on Web Standards — uses native `Request` and `Response` objects, no framework-specific abstractions.
- **Positive:** Tight integration — the SSE, schema validation, and testing packages are designed to work together.
- **Positive:** Lightweight — minimal overhead, no large dependency tree.
- **Positive:** Full control — as a custom package, it can be tailored to project needs.
- **Negative:** No external community — documentation, examples, and bug fixes are limited to the project maintainer.
- **Negative:** Learning curve for new contributors unfamiliar with the framework.
- **Negative:** Maintenance burden — framework bugs must be fixed in-house.
