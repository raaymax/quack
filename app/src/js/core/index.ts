import { AppModel } from "./models/app.ts";
import { client } from "./client.ts";
export * from "./client.ts";

export const app = new AppModel();
client.on2("auth:logout", async () => {
  await app.dispose();
  window.location.reload();
});
