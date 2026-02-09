import { registerPlugin } from "@capacitor/core";

export interface QuackPlugin {
  /**
   * Start the background notification service
   * Call this after user logs in
   */
  startNotificationService(options: {
    serverUrl: string;
    authToken: string;
    userId: string;
  }): Promise<void>;

  /**
   * Stop the background notification service
   * Call this when user logs out
   */
  stopNotificationService(): Promise<void>;

  /**
   * Check if the service is currently running
   */
  isServiceRunning(): Promise<{ running: boolean }>;

  /**
   * Clear stored credentials and stop service
   * Call this on logout
   */
  clearCredentials(): Promise<void>;

  /**
   * Get service status information
   */
  getServiceStatus(): Promise<{
    configured: boolean;
    platform: "android" | "ios" | "web";
  }>;
}

const Quack = registerPlugin<QuackPlugin>("Quack", {
  web: () => import("./quack-plugin-web").then((m) => new m.QuackPluginWeb()),
});

export default Quack;
