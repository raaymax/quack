import * as Config from "@quack/config";
export type { Config } from "@quack/config";

const __dirname = new URL(".", import.meta.url).pathname;
export const config = await Config.from(`${__dirname}chat.config.ts`);
export default config;
