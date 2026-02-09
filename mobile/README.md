# Quack Mobile App

Native Android shell for Quack PWA with background push notifications.

## Features

- **Background Notifications**: Receives notifications even when app is closed
- **Custom Notification Sound**: Distinctive Quack notification sound
- **Deep Links**: Tap notification to open specific channel/thread
- **Auto-reconnect**: Reconnects on network changes
- **Boot Persistence**: Service restarts after device reboot
- **Battery Optimization**: Requests exemption for reliable background operation

## Architecture

```
mobile/
├── src/                          # TypeScript plugin definitions
│   ├── quack-plugin.ts           # Plugin interface
│   └── quack-plugin-web.ts       # Web stub implementation
├── android/                      # Native Android code
│   └── app/src/main/
│       ├── java/io/codecat/quack/
│       │   ├── MainActivity.kt           # Capacitor WebView
│       │   ├── QuackPlugin.kt            # Capacitor plugin bridge
│       │   ├── QuackNotificationService.kt # Background service
│       │   ├── QuackConnection.kt        # SSE client
│       │   ├── NotificationHelper.kt     # Notification handling
│       │   └── BootReceiver.kt           # Boot broadcast receiver
│       └── res/
│           ├── drawable/                 # Notification icons
│           └── raw/                      # Notification sounds
├── www/                          # Minimal placeholder (Capacitor requirement)
├── capacitor.config.ts           # Server URL configuration
└── package.json
```

## Setup

### 1. Configure Server URL

Copy `.envrc.example` to `.envrc` and set your Quack server URL:

```bash
cp .envrc.example .envrc
# Edit .envrc with your server URL
direnv allow
```

Or set the environment variable directly:
```bash
export QUACK_SERVER_URL="https://your-quack-server.com"
```

### 2. Add Notification Sound

Place your notification sound file at:
```
android/app/src/main/res/raw/quack_notification.mp3
```

Recommended: Short (< 1 second), distinctive sound. MP3 or OGG format.

### 3. Install Dependencies

```bash
npm install
```

### 4. Sync Capacitor

```bash
npm run cap:sync
```

### 5. Build & Run

```bash
# Open in Android Studio
npm run cap:open

# Or run directly (requires Android SDK)
npm run cap:run
```

## Using the Plugin (from web app)

```typescript
import Quack from "@quack/mobile/plugin";

// Start notification service after login
await Quack.startNotificationService({
  serverUrl: "https://your-quack-server.com",
  authToken: "user-jwt-token",
  userId: "user-id"
});

// Stop on logout
await Quack.stopNotificationService();

// Clear credentials on logout
await Quack.clearCredentials();

// Check status
const status = await Quack.getServiceStatus();
console.log(status.platform, status.configured);
```

## How It Works

1. **User logs in** → Web app calls `startNotificationService()`
2. **Service starts** as Android Foreground Service
3. **SSE connection** to `/api/mobile/notifications`
4. **Server sends events** when new messages arrive
5. **Service shows notification** with custom sound
6. **User taps notification** → App opens to correct channel/thread

## Backend Endpoint

The mobile app connects to `/api/mobile/notifications` SSE endpoint:

- Requires authentication (Bearer token)
- Returns `{ status: "connected" }` on connection
- Sends notification events: `{ type: "notification", channelId, parentId, title, body, senderId, senderName }`

## Permissions

The app requests:
- `INTERNET` - Network access
- `POST_NOTIFICATIONS` - Show notifications (Android 13+)
- `FOREGROUND_SERVICE` - Background service
- `RECEIVE_BOOT_COMPLETED` - Restart on boot
- `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` - Prevent aggressive killing

## Troubleshooting

### Notifications not showing
1. Check notification permission in Android settings
2. Disable battery optimization for Quack
3. Check if service is running (connection status notification)

### Service stops unexpectedly
1. Request battery optimization exemption
2. On some OEMs (Xiaomi, Huawei), manually whitelist app

### Not reconnecting
1. Check network connectivity
2. Verify server URL and auth token
3. Check logs: `adb logcat | grep Quack`
