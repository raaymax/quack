import { Router } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { LoginLimiter } from "../../loginLimiter.ts";

import deleteSession from "./deleteSession.ts";
import createSession from "./postSession.ts";
import getSession from "./getSession.ts";
import reset from "./reset.ts";
import verifyReset from "./verifyReset.ts";

export const auth = (core: Core) => {
  const router = new Router();
  const limiter = new LoginLimiter(core);
  router.use(getSession(core));
  router.use(createSession(core, limiter));
  router.use(deleteSession(core));
  router.use(reset(core, limiter));
  router.use(verifyReset(core));

  return router;
};
