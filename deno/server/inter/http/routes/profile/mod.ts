import { Router } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

import config from "./config.ts";
import update from "./update.ts";
import avatar from "./avatar.ts";

export const profile = (core: Core) => {
  const router = new Router();
  router.use(config(core));
  router.use(update(core));
  router.use(avatar(core));
  return router;
};
