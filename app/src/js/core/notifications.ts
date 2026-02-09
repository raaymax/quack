import { client } from "../core/index.ts";
import { OutgoingUserPushSubscribe } from "../core/types.ts";
import type { AppModel } from "../core/models/app.ts";

declare global {
  interface Window {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
  }
}

const isTauri = () => typeof window.__TAURI_INTERNALS__ !== "undefined";

export const initNotifications = async (app: AppModel) => {
  if (isTauri()) {
    await initTauriNotifications(app);
    return;
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", ({ data }) => {
      if (data.type) {
        client.emit(data.type, data);
      }
    });

    await register(app);
    if ("Notification" in window) {
      document.querySelector("body")?.addEventListener("click", () => {
        Notification.requestPermission((status) => {
          console.log("Notification permission status:", status);
        });
      }, { once: true });
    }
  }
};

const initTauriNotifications = async (_app: AppModel) => {
  const invoke = window.__TAURI_INTERNALS__!.invoke;

  const serverUrl = window.location.origin;
  const authToken = client.api.token;
  const userId = client.api.userId;

  if (!authToken || !userId) {
    console.warn("Tauri notifications: missing auth token or user ID");
    return;
  }

  try {
    await invoke("start_notification_service", {
      serverUrl,
      authToken,
      userId,
    });
    console.log("Tauri notification service started");
  } catch (e) {
    console.error("Failed to start Tauri notification service:", e);
  }
};

export const stopTauriNotifications = async () => {
  if (!isTauri()) return;

  try {
    const invoke = window.__TAURI_INTERNALS__!.invoke;
    await invoke("stop_notification_service");
    console.log("Tauri notification service stopped");
  } catch (e) {
    console.error("Failed to stop Tauri notification service:", e);
  }
};

const register = async (app: AppModel, retry = false) =>
  navigator.serviceWorker.getRegistration("/")
    .then((registration) => {
      if (!registration) throw new Error("No service worker registered");
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: "", //config.vapidPublicKey,
      });
    })
    .then(async (subscription) =>
      client.req({
        type: "user:push:subscribe",
        ...subscription.toJSON(),
      } as OutgoingUserPushSubscribe)
    )
    .then(() =>
      console.log("Notifications service worker registered successfully")
    )
    .catch(() => {
      if (retry) return;
      navigator.serviceWorker.getRegistration("/")
        .then((registration) => registration?.pushManager?.getSubscription())
        .then((sub) => sub && sub.unsubscribe())
        .then(() => register(app, true));
    });
