import config from "@quack/config/load";
import { buildApp } from "./interfaces/http/mod.ts";
import { initStorage } from "./core/mod.ts";

export const startServer = () => {
  const app = buildApp(initStorage(config));
  app.serve({
    port: 8001,
    onListen: (addr) => {
      console.log(
        `[FILE SERVICE] Listening on http://${addr.hostname}:${addr.port}/`,
      );
    },
  });
};
