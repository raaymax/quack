import config from "@quack/config/load";
import app from "./app.ts";

await app.serve({
  port: config.port,
  onListen: (addr: Deno.NetAddr) => {
    console.log(
      `[QUACK API] Listening on http://${addr.hostname}:${addr.port}/`,
    );
  },
});
