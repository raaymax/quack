import { AppModel } from "./models/app";
import { client } from "./client";
export * from "./client";

export const app = new AppModel();
client.on2("auth:logout", async () => {
  await app.dispose();
  window.location.reload();
});
