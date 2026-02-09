# ADR 015: Tauri v2 for Desktop Application

## Status

Accepted

## Context

Quack is a self-hosted chat application that prioritizes privacy, instant delivery, and independence from third-party services. The mobile app (Capacitor + native Android foreground service) already implements a custom SSE-based push notification system (ADR 013) that delivers notifications instantly without relying on FCM or Google Play Services.

Desktop users currently rely on the PWA installed from the browser. While functional for the main UI, PWA push notifications are unreliable — browsers batch and throttle Web Push delivery, often resulting in delays of seconds to minutes. This defeats the purpose of a real-time chat application.

Desktop needs the same notification reliability as mobile: a persistent SSE connection that delivers notifications instantly, independent of browser state.

Options considered:

1. **Capacitor + Electron** — Capacitor supports Electron via community plugins, but Electron bundles Chromium (~150MB), the Capacitor-Electron ecosystem is small and community-maintained, and it goes against the lightweight ethos of the project.

2. **Tauri v2** — Rust-based, uses the OS native webview (~8-15MB binary), has built-in system tray support, native notifications, and autostart plugins. The Rust backend can maintain a persistent SSE connection independently of the webview.

3. **Improve PWA Push** — Wire up VAPID keys and complete Web Push. Zero maintenance but fundamentally limited by browser throttling, requires browser to be running, and depends on browser vendors' push infrastructure.

## Decision

Use **Tauri v2** to build a desktop application that mirrors the mobile app's architecture: a native shell loading the web UI from the server, with a background service maintaining a persistent SSE connection for instant notifications.

Key architectural choices:

- **Server-loaded webview** — the Tauri window loads content from the Quack server URL (same as Capacitor mobile), no frontend bundling needed.
- **Rust SSE service** — a tokio async task maintains a persistent connection to `/api/notifications` (renamed from `/api/mobile/notifications` to reflect multi-platform use).
- **System tray** — the app minimizes to the system tray instead of closing, keeping the SSE connection alive.
- **Separate package** — lives in `desktop/` alongside `mobile/`, following the same pattern of a native shell wrapping the web app.
- **Shared notification endpoint** — reuses the existing server-side SSE notification infrastructure with no backend changes needed.

## Consequences

- **Positive:** Instant notifications — same SSE delivery as mobile, no browser throttling.
- **Positive:** Lightweight — ~8-15MB binary vs ~150MB for Electron.
- **Positive:** Privacy-preserving — no notification metadata leaves the user's server, consistent with ADR 013.
- **Positive:** Self-contained — no dependency on browser push infrastructure or external services.
- **Positive:** Cross-platform — single codebase targets Windows, macOS, and Linux.
- **Positive:** System tray — app stays connected in background without occupying taskbar space.
- **Positive:** Reuses existing infrastructure — same `/api/notifications` endpoint, same event format, same auth mechanism.
- **Negative:** Rust requirement — contributors need Rust toolchain for desktop app development.
- **Negative:** Platform-specific quirks — system tray behavior, autostart, and notification APIs vary across Windows/macOS/Linux.
- **Negative:** Additional build targets — CI needs to build for 3 desktop platforms (vs 1 for mobile).
- **Negative:** Webview differences — OS webviews (WebKit on macOS/Linux, WebView2 on Windows) may have rendering differences compared to Chromium.
