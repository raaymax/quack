import { Router } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

import getAllEmojis from "./getAllEmojis.ts";
import createEmoji from "./create.ts";

export const emojis = (core: Core) => {
  const router = new Router();
  router.use(getAllEmojis(core));
  router.use(createEmoji(core));
  return router;
};
