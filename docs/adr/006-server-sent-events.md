# ADR 006: Server-Sent Events for Real-Time Communication

## Status

Accepted

## Context

A chat application requires real-time message delivery. The main options are WebSockets, Server-Sent Events (SSE), and long polling. The application's real-time needs are unidirectional from server to client — the client sends messages via REST POST and receives updates via a persistent connection.

## Decision

Use **Server-Sent Events (SSE)** for all real-time server-to-client communication.

- Each authenticated client maintains a persistent SSE connection at `/api/sse`.
- The server pushes events for: new messages, message updates, typing indicators, channel changes, user status updates, and read receipts.
- Client-to-server communication (sending messages, reactions, etc.) uses standard REST endpoints.
- The `@planigale/sse` package provides the server-side SSE implementation.
- The frontend uses the `EventSource`-compatible client from `@jsr/planigale__sse`.

## Consequences

- **Positive:** Simpler than WebSockets — SSE is a standard HTTP mechanism, works through proxies and load balancers without special configuration.
- **Positive:** Automatic reconnection — the browser's `EventSource` API handles reconnection with `Last-Event-ID`.
- **Positive:** Unidirectional model matches the data flow — server pushes events, client sends REST requests.
- **Positive:** No WebSocket upgrade negotiation, no ping/pong frames to manage.
- **Negative:** Unidirectional only — client-to-server messages still require separate REST calls.
- **Negative:** Connection limit — browsers limit concurrent SSE connections per domain (typically 6 for HTTP/1.1, unlimited for HTTP/2).
- **Negative:** No binary data support — all events are text (JSON).
