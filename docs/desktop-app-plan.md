# Desktop App — Execution Plan

Step-by-step plan for implementing the Tauri v2 desktop app with SSE-based instant notifications.

## Phase 1: Project Scaffold

**Goal**: Tauri app opens a window loading the Quack server URL.

- [ ] Initialize `desktop/` directory with `npm create tauri-app`
- [ ] Configure `tauri.conf.json`:
  - App identifier: `io.codecat.quack`
  - Window: title "Quack", default size 1200x800, min size 400x600
  - Server URL loading (no bundled frontend)
- [ ] Add npm scripts: `tauri dev`, `tauri build`
- [ ] Verify: app opens, loads web UI from server, login works

**Deliverable**: Minimal Tauri shell that displays the Quack web app.

## Phase 2: System Tray

**Goal**: App minimizes to tray instead of quitting, with status menu.

- [ ] Add `tauri-plugin-tray` (built into Tauri v2 with `tray-icon` feature)
- [ ] Create tray icon (reuse existing Quack icon assets)
- [ ] Implement tray menu: Show/Hide, separator, Quit
- [ ] Window close → hide to tray (not quit)
- [ ] Tray icon click → show/focus window
- [ ] Verify: closing window keeps app in tray, tray menu works

**Deliverable**: App persists in system tray when window is closed.

## Phase 3: SSE Notification Service

**Goal**: Rust backend maintains persistent SSE connection, fires OS notifications.

- [ ] Add `reqwest` with streaming support
- [ ] Implement SSE client in `notifications.rs`:
  - Connect to `/api/notifications` with bearer token
  - Parse SSE events (data-only, no event types)
  - Handle heartbeat pings (keep-alive)
  - Exponential backoff reconnection (1s → 60s)
- [ ] Add `tauri-plugin-notification` for native OS notifications
- [ ] Implement IPC commands:
  - `start_notification_service(server_url, auth_token, user_id)`
  - `stop_notification_service()`
  - `get_service_status()` → connected/reconnecting/disconnected
- [ ] Fire OS notification on message event (skip self-messages)
- [ ] Update tray icon/tooltip with connection status
- [ ] Verify: receive instant notification when message sent from another user

**Deliverable**: Background SSE connection with native notifications.

## Phase 4: Credential Storage & Auto-connect

**Goal**: Persist credentials securely, reconnect on app launch.

- [ ] Add `tauri-plugin-store` for encrypted credential storage
- [ ] Store `server_url`, `auth_token`, `user_id` on successful service start
- [ ] On app launch, check for stored credentials → auto-start SSE service
- [ ] Clear credentials on explicit logout / `stop_notification_service()`
- [ ] Verify: restart app → notifications resume without re-login

**Deliverable**: Seamless reconnection across app restarts.

## Phase 5: Web App Integration

**Goal**: Web app detects Tauri and bridges notification service.

- [ ] Create `desktop/src/bridge.ts` with Tauri IPC wrappers
- [ ] Add platform detection in `app/src/js/core/notifications.ts`:
  - If Tauri → use IPC commands (like Capacitor plugin on mobile)
  - If browser → use existing PWA/SW path
- [ ] Wire up login → `start_notification_service`
- [ ] Wire up logout → `stop_notification_service`
- [ ] Notification click → IPC message to navigate to channel/thread
- [ ] Verify: full flow — login, receive notification, click to navigate

**Deliverable**: Web app seamlessly controls the native notification service.

## Phase 6: Autostart & Polish

**Goal**: Optional launch on OS boot, notification sound, polish.

- [ ] Add `tauri-plugin-autostart` with user toggle
- [ ] Add custom notification sound (`quack_notification.wav`)
- [ ] Add notification grouping (collapse multiple messages from same channel)
- [ ] Handle window focus → suppress notifications for active channel
- [ ] Test on all 3 platforms (Linux, macOS, Windows)
- [ ] Verify: autostart works, sound plays, no duplicate notifications

**Deliverable**: Production-ready desktop app.

## Phase 7: Backend Cleanup

**Goal**: Rename endpoint, ensure multi-platform readiness.

- [ ] Rename route mount: `/api/mobile/notifications` → `/api/notifications`
- [ ] Keep `/api/mobile/notifications` as alias for backwards compatibility with existing mobile builds
- [ ] Update mobile app to use new endpoint path (next mobile release)
- [ ] Update docs and tests

**Deliverable**: Clean, platform-agnostic notification endpoint.

## Phase 8: CI & Distribution

**Goal**: Automated builds and releases.

- [ ] Add GitHub Actions workflow for desktop builds:
  - Matrix: ubuntu-latest, macos-latest, windows-latest
  - Trigger: release tag or manual dispatch
  - Output: `.deb`, `.AppImage`, `.dmg`, `.msi`
- [ ] Attach desktop binaries to GitHub Releases
- [ ] Optional: Tauri updater plugin for in-app auto-updates
- [ ] Add build instructions to `docs/desktop-app.md`

**Deliverable**: Users can download desktop app from GitHub Releases.

---

## Dependencies Between Phases

```
Phase 1 (Scaffold)
  └── Phase 2 (System Tray)
        └── Phase 3 (SSE Notifications)  ◄── core feature
              ├── Phase 4 (Credentials)
              ├── Phase 5 (Web Integration)
              │     └── Phase 6 (Polish)
              │           └── Phase 8 (CI)
              └── Phase 7 (Backend Cleanup)  ◄── independent
```

Phases 1–3 are the MVP. Phases 4–6 bring it to production quality. Phases 7–8 are housekeeping.

## Estimated Scope

| Phase | New files | Complexity |
|---|---|---|
| 1. Scaffold | ~5 (config, cargo, main) | Low |
| 2. System Tray | ~1 (tray.rs) | Low |
| 3. SSE Notifications | ~2 (notifications.rs, credentials.rs) | Medium |
| 4. Credential Storage | Edit existing | Low |
| 5. Web Integration | ~1 (bridge.ts) + edit notifications.ts | Medium |
| 6. Polish | Edits across files | Low |
| 7. Backend Cleanup | Route rename + alias | Low |
| 8. CI | ~1 workflow file | Medium |

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Shell | Tauri v2 |
| Async runtime | tokio |
| HTTP/SSE client | reqwest (streaming) |
| Notifications | tauri-plugin-notification |
| Storage | tauri-plugin-store |
| Autostart | tauri-plugin-autostart |
| System tray | Tauri built-in (tray-icon feature) |
| Build/package | tauri-cli (deb, AppImage, dmg, msi) |
