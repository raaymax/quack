import type { Config } from "./types.ts";
export type { Config } from "./types.ts";
import { load } from "./base.ts";

let config: Config;
try {
  config = await load();
} catch (e) {
  console.error(e);
  Deno.exit(1);
}

export default config;

if (import.meta.main) {
  console.log(config);
}
