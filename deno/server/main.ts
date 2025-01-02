import * as path from "@std/path";
import config from "@quack/config/load";
import app from "./app.ts";

const ssl: {
  key?: string;
  cert?: string;
} = {};

const __dirname = new URL(".", import.meta.url).pathname;
const sslPath = path.join(__dirname, "../../ssl/");

if (Deno.env.get("SSL")) {
  ssl.key = await Deno.readTextFile(`${sslPath}key.pem`);
  ssl.cert = await Deno.readTextFile(`${sslPath}cert.pem`);
}

await app.serve({
  port: config.port,
  ...ssl,
  onListen: (addr: Deno.NetAddr) => {
    console.log(
      `[QUACK API] Listening on http://${addr.hostname}:${addr.port}/`,
    );
  },
});
