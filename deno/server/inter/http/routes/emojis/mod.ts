import { Router } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

import getAllEmojis from "./getAllEmojis.ts";
import createEmoji from "./create.ts";
import replaceEmoji from "./replace.ts";

export const emojis = (core: Core) => {
  const router = new Router();
  router.use(getAllEmojis(core));
  router.use(createEmoji(core));
  router.use(replaceEmoji(core));
  return router;
};
