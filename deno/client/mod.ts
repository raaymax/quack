// @quack/app-core main exports
export * from "./src/client.ts";
export * from "./src/models/app.ts";
export * from "./src/messages.ts";
export * from "./src/notifications.ts";

import { Client } from "./src/client.ts";
import { AppModel } from "./src/models/app.ts";

/**
 * Creates a new instance of the app core
 */
export function createAppCore(config = {}) {
  const client = new Client();
  const app = new AppModel();

  return {
    Client,
    client,
    AppModel,
    app,
  };
}
