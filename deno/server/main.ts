import config from "@quack/config/load";
import app, { core } from "./app.ts";

const HOUR_MS = 60 * 60 * 1000;

const sweepStaleDrafts = async () => {
  try {
    await core.dispatch({
      type: "file:removeStaleDrafts",
      body: {},
    }).internal();
  } catch (err) {
    console.error("[QUACK API] Stale draft sweep failed:", err);
  }
};

sweepStaleDrafts();
setInterval(sweepStaleDrafts, HOUR_MS);

await app.serve({
  port: config.port,
  onListen: (addr: Deno.NetAddr) => {
    console.log(
      `[QUACK API] Listening on http://${addr.hostname}:${addr.port}/`,
    );
  },
});
