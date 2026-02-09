# ADR 013: Custom Push Notification System

## Status

Accepted

## Context

Mobile chat applications typically rely on Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNs) for background push notifications. These services batch and throttle delivery, resulting in delays of seconds to minutes depending on device state and battery optimization. For a chat application, near-instant delivery is essential.

Additionally, relying on Google services introduces several concerns:

- **Privacy** — FCM requires a Google Services dependency that communicates with Google servers, exposing message metadata.
- **De-googled devices** — Users running de-googled Android ROMs (GrapheneOS, LineageOS, CalyxOS) cannot use FCM at all.
- **Third-party trust** — Routing notification delivery through external services means trusting those services with message availability and timing.
- **Self-hosting alignment** — A self-hosted chat application should not depend on external cloud services for core functionality.

## Decision

Implement a **custom push notification system** using a native Android foreground service that maintains a persistent SSE connection to the Quack server.

- The Capacitor plugin starts a foreground service on login.
- The service connects to `/api/mobile/notifications` via SSE.
- The server pushes notification events directly to the device with no intermediary.
- The service displays Android notifications immediately upon receiving events.
- The foreground service survives app backgrounding and device reboots.

No dependency on Google Play Services, FCM, or any third-party notification relay.

## Consequences

- **Positive:** Near-instant delivery — notifications arrive as fast as the SSE event, no batching or throttling by a third party.
- **Positive:** Works on de-googled phones — no Google Play Services dependency.
- **Positive:** Full privacy — no message metadata leaves the user's server.
- **Positive:** Self-contained — the entire notification pipeline is under the server operator's control.
- **Positive:** Consistent with self-hosting philosophy — no external service dependencies for core features.
- **Negative:** Battery impact — a persistent foreground service and SSE connection consume more battery than FCM's batched approach.
- **Negative:** Foreground notification required — Android requires a persistent notification for foreground services.
- **Negative:** OEM battery restrictions — some manufacturers (Xiaomi, Huawei, Samsung) aggressively kill background services, requiring manual whitelisting.
- **Negative:** No iOS support — iOS does not allow persistent background connections; a future iOS build would need APNs or a polling fallback.
