# Desktop App

Quack provides a native desktop app built with [Tauri v2](https://v2.tauri.app/) that wraps the web application with a persistent background notification service. The app connects directly to your Quack server via SSE for instant, private notifications — no browser required.

## Architecture

```
desktop/
├── package.json              # npm scripts for dev/build
├── src-tauri/
│   ├── Cargo.toml            # Rust dependencies
│   ├── tauri.conf.json       # Tauri config (window, tray, permissions)
│   ├── capabilities/         # Tauri v2 permission capabilities
│   └── src/
│       ├── main.rs           # App entry, window management, IPC commands
│       ├── tray.rs           # System tray setup and menu
│       ├── notifications.rs  # SSE client, native notification dispatch
│       └── credentials.rs    # Secure credential storage
└── src/                      # Thin bridge layer (optional)
    └── bridge.ts             # Tauri IPC bindings for the web app
```

### How It Works

The desktop app follows the same architecture as the mobile app (see [ADR 013](adr/013-custom-push-notifications.md)):

```
┌─────────────────────────────────────────────────────┐
│  Desktop App (Tauri)                                │
│                                                     │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │   Webview     │    │  Rust Backend             │   │
│  │              │    │                          │   │
│  │  Quack Web   │◄──►│  IPC Commands            │   │
│  │  UI (from    │    │    start/stop service    │   │
│  │  server)     │    │    get status            │   │
│  │              │    │                          │   │
│  └──────────────┘    │  SSE Notification Task   │   │
│                      │    tokio async task      │   │
│                      │    reqwest SSE client    │   │
│                      │    ─► OS Notification    │   │
│                      │                          │   │
│                      │  System Tray             │   │
│                      │    connection status     │   │
│                      │    show/quit menu        │   │
│                      └──────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
         │                        │
         │  HTTPS (web UI)        │  SSE (/api/notifications)
         ▼                        ▼
┌─────────────────────────────────────────────────────┐
│  Quack Server                                       │
└─────────────────────────────────────────────────────┘
```

1. User launches the app → Tauri window loads the Quack server URL
2. User logs in through the web UI
3. Web app calls Tauri IPC → Rust starts an async SSE connection to `/api/notifications`
4. Server pushes message events → Rust fires native OS notification immediately
5. User closes window → app minimizes to system tray, SSE stays connected
6. Clicking a notification → app window opens/focuses at the relevant channel

### Comparison with Mobile

| Component | Mobile (Android) | Desktop (Tauri) |
|---|---|---|
| Shell | Capacitor | Tauri v2 |
| SSE client | OkHttp (Kotlin) | reqwest (Rust) |
| Notifications | Android NotificationManager | tauri-plugin-notification |
| Background | Foreground Service | System tray |
| Credential storage | EncryptedSharedPreferences | tauri-plugin-store |
| Auto-start | BootReceiver | tauri-plugin-autostart |
| Deep links | `quack://` intent | IPC → window navigation |

## Rust Dependencies

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-notification = "2"
tauri-plugin-autostart = "2"
tauri-plugin-store = "2"
reqwest = { version = "0.12", features = ["stream"] }
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

## IPC Commands

The web app communicates with the Rust backend via Tauri's IPC:

| Command | Parameters | Description |
|---|---|---|
| `start_notification_service` | `server_url`, `auth_token`, `user_id` | Start SSE connection |
| `stop_notification_service` | — | Stop SSE connection |
| `get_service_status` | — | Returns connection state |

These mirror the Capacitor plugin interface (`QuackPlugin`) used by the mobile app, so the web app's notification initialization code can target both platforms with minimal branching.

## SSE Notification Service

The Rust notification service connects to the same endpoint as mobile:

- **Endpoint**: `GET /api/notifications` (SSE stream, bearer auth)
- **Heartbeat**: Server sends `{"type":"ping"}` every 30s
- **Events**: `{"type":"notification", "channelId":"...", "title":"...", "body":"...", "senderId":"...", "senderName":"..."}`
- **Reconnect**: Exponential backoff (1s → 60s max) on connection failure
- **Self-message filtering**: Server already filters, client double-checks

## System Tray

The app runs in the system tray when the window is closed:

- **Tray icon**: Quack icon with connection status indicator
- **Menu items**:
  - Show/Hide window
  - Connection status (connected/reconnecting/disconnected)
  - Quit
- **Click behavior**: Single-click shows window, right-click opens menu

## Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain)
- Node.js and npm
- Platform-specific requirements:
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `libssl-dev`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: WebView2 (pre-installed on Windows 10/11), Visual Studio Build Tools
- A deployed Quack server

## Quick Start

### 1. Configure Server URL

```bash
cd desktop
cp .env.example .env
# Edit .env with your QUACK_SERVER_URL
```

### 2. Install Dependencies

```bash
cd desktop
npm install
```

### 3. Development

```bash
npm run tauri dev
```

This opens the app pointing at your configured server URL with hot-reload for Rust changes.

### 4. Build

```bash
# Build for current platform
npm run tauri build
```

Produces platform-specific installers in `desktop/src-tauri/target/release/bundle/`:
- **Linux**: `.deb`, `.AppImage`
- **macOS**: `.dmg`, `.app`
- **Windows**: `.msi`, `.exe`

## Notification Sound

Place a custom notification sound at:
```
desktop/src-tauri/resources/quack_notification.wav
```

## Configuration

The app stores its configuration (server URL, credentials) securely using `tauri-plugin-store` with OS-level encryption:
- **Linux**: `$XDG_DATA_HOME/io.codecat.quack/` (libsecret)
- **macOS**: `~/Library/Application Support/io.codecat.quack/` (Keychain)
- **Windows**: `%APPDATA%/io.codecat.quack/` (DPAPI)

## Troubleshooting

### Notifications not showing
1. Check OS notification settings for Quack
2. Verify the system tray icon shows "Connected"
3. Check the dev console (right-click → Inspect) for errors

### Connection issues
1. Verify server URL is correct and accessible
2. Check if the SSE endpoint responds: `curl -H "Authorization: Bearer TOKEN" https://your-server/api/notifications`
3. Check system tray tooltip for connection status

### Linux-specific
1. Ensure `libappindicator3` is installed for system tray support
2. On Wayland, some tray implementations may behave differently
3. If notifications don't appear, check if a notification daemon is running (`dunst`, `mako`, etc.)

### Build issues
1. Run `rustup update` to ensure latest Rust toolchain
2. On Linux, install all webkit/gtk dependencies (see Prerequisites)
3. Clear build cache: `cd desktop/src-tauri && cargo clean`
