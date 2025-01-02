import config from "@quack/config/load";
import { HttpInterface } from "./inter/http/mod.ts";
import { Core } from "./core/mod.ts";

const core = new Core({
  config,
});
const http = new HttpInterface(core);
await Promise.all(
  config.plugins?.map((
    plugin: (app: HttpInterface, core: Core) => Promise<any> | any,
  ) => plugin(http, core)) ?? [],
);

http.onClose(async () => {
  await core.close();
});

export default http;
