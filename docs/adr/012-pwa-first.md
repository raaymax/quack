# ADR 012: PWA-First with Capacitor Native Shell

## Status

Accepted

## Context

Quack needs to work on desktops, phones, and tablets. Native mobile apps are expensive to maintain separately. The application's functionality (text chat, file sharing, notifications) doesn't require hardware APIs beyond push notifications. Users should be able to start using Quack immediately from a browser without installation.

## Decision

Build Quack as a **Progressive Web Application (PWA) first**, with an optional **Capacitor** native shell for Android.

### PWA

- Built with Vite + `vite-plugin-pwa` for service worker generation.
- Workbox handles precaching and navigation preloading.
- Installable from the browser on desktop and mobile.
- Works offline for viewing cached messages.

### Capacitor (Android)

- Wraps the same PWA in a native Android WebView.
- Enables background push notifications (not available in PWA).
- Configured in `mobile/` directory with its own `package.json`.
- Build: `npm run cap:sync && npm run cap:open` (opens Android Studio).

## Consequences

- **Positive:** Single codebase for all platforms — web, desktop, and mobile.
- **Positive:** Instant access from any browser — no app store required.
- **Positive:** PWA features (service worker, offline support, installability) work without Capacitor.
- **Positive:** Capacitor adds native capabilities (push notifications) without rewriting the app.
- **Negative:** PWA push notifications are limited on iOS (no background delivery).
- **Negative:** Capacitor requires Android Studio and the Android SDK for building.
- **Negative:** Some native UX patterns (swipe gestures, system back button) need extra work in a WebView.
- **Negative:** App store distribution requires maintaining the Capacitor build pipeline.
