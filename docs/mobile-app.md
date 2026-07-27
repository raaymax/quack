# Building the Mobile App

Quack provides a native Android app that wraps the web application with background push notification support. The app uses [Capacitor](https://capacitorjs.com/) to create a native shell that loads content from your Quack server.

## Features

- Background notifications even when the app is closed
- Custom notification sound
- Deep links to specific channels/threads
- Auto-reconnect on network changes
- Persists after device reboot
- Battery optimization exemption for reliable operation

## Prerequisites

- Android Studio (with Android SDK)
- Node.js and npm
- A deployed Quack server (the mobile app loads content from your server)

## Quick Start

### 1. Configure Server URL

The mobile app needs to know your Quack server URL. You can configure it in one of two ways:

**Option A: Using environment variable**
```bash
cd mobile
export QUACK_SERVER_URL="https://your-quack-server.com"
```

**Option B: Using direnv**
```bash
cd mobile
cp .envrc.example .envrc
# Edit .envrc with your server URL
direnv allow
```

### 2. Install Dependencies

```bash
cd mobile
npm install
```

### 3. Sync and Build

```bash
# Sync Capacitor configuration
npm run cap:sync

# Open in Android Studio
npm run cap:open
```

From Android Studio, you can build the APK or run on a connected device/emulator.

### 4. Run Directly (Alternative)

If you have the Android SDK configured:

```bash
npm run cap:run
```

## Local Development

For local development with HTTPS (required for service workers):

1. Generate SSL certificates:
   ```bash
   deno task ssl
   ```

2. Start the backend and frontend:
   ```bash
   # Terminal 1: Backend
   deno task dev

   # Terminal 2: Frontend
   cd app && npm run dev
   ```

3. Configure mobile to use local dev server:
   ```bash
   cd mobile
   export QUACK_SERVER_URL="https://localhost:4000"
   npm run cap:sync
   ```

4. Install the SSL certificate on your Android emulator:
   - Copy `ssl/cert.pem` to emulator
   - Go to Settings > Security > Install from storage
   - Select the certificate

5. Run the app:
   ```bash
   npm run cap:run
   ```

Note: The app automatically converts `localhost` to `10.0.2.2` for Android emulator compatibility.

## How Notifications Work

1. User logs in via the web interface
2. Web app calls the native plugin to start the notification service
3. A foreground service starts and connects to `/api/mobile/notifications` via SSE
4. Server pushes notification events when new messages arrive
5. The service displays Android notifications with custom sound
6. Tapping a notification opens the app to the relevant channel/thread

## Customization

### App Icon

Replace the launcher icons in:
```
mobile/android/app/src/main/res/mipmap-*/ic_launcher*.png
```

### Notification Sound

Place your notification sound at:
```
mobile/android/app/src/main/res/raw/quack_notification.mp3
```

Recommended: Short (< 1 second), distinctive sound in MP3 or OGG format.

### App Name and Package

Edit `mobile/android/app/build.gradle`:
- `applicationId` - Package name (e.g., `io.codecat.quack`)
- `versionCode` and `versionName` - App version

Edit `mobile/capacitor.config.ts`:
- `appId` - Must match `applicationId`
- `appName` - Display name

## Troubleshooting

### Notifications not showing
1. Check notification permission in Android Settings > Apps > Quack
2. Disable battery optimization for the app
3. Verify the foreground service notification is visible

### Service stops unexpectedly
1. Request battery optimization exemption in app settings
2. On some OEMs (Xiaomi, Huawei, Samsung), manually whitelist the app in their battery/power management settings

### Connection issues
1. Verify server URL is correct and accessible
2. Check network connectivity
3. View logs: `adb logcat | grep Quack`

### Local development issues
1. Ensure SSL certificate is installed on emulator
2. Verify frontend dev server is running on port 4000
3. Check that `QUACK_SERVER_URL` is set correctly

## Architecture

For detailed architecture and API documentation, see [mobile/README.md](../mobile/README.md).
