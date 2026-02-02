import type { QuackPlugin } from "./quack-plugin";

/**
 * Web implementation of QuackPlugin
 * This is a stub that does nothing since push notifications
 * on web are handled by the PWA's service worker
 */
export class QuackPluginWeb implements QuackPlugin {
  async startNotificationService(_options: {
    serverUrl: string;
    authToken: string;
    userId: string;
  }): Promise<void> {
    console.log("[QuackPlugin] Web: startNotificationService is a no-op");
    // On web, the PWA service worker handles notifications
  }

  async stopNotificationService(): Promise<void> {
    console.log("[QuackPlugin] Web: stopNotificationService is a no-op");
  }

  async isServiceRunning(): Promise<{ running: boolean }> {
    // On web, we're always "running" (via service worker)
    return { running: false };
  }

  async clearCredentials(): Promise<void> {
    console.log("[QuackPlugin] Web: clearCredentials is a no-op");
  }

  async getServiceStatus(): Promise<{
    configured: boolean;
    platform: "android" | "ios" | "web";
  }> {
    return {
      configured: false,
      platform: "web",
    };
  }
}
