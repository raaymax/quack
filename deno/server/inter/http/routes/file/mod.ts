import { Router } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

import upload from "./upload.ts";
import getChannel from "./getChannel.ts";
import remove from "./remove.ts";

export const channelFiles = (core: Core) => {
  const router = new Router();
  router.use(upload(core));
  router.use(getChannel(core));
  router.use(remove(core));
  return router;
};
