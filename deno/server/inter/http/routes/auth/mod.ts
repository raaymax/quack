import { Router } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

import deleteSession from "./deleteSession.ts";
import createSession from "./postSession.ts";
import getSession from "./getSession.ts";
import reset from "./reset.ts";
import verifyReset from "./verifyReset.ts";

export const auth = (core: Core) => {
  const router = new Router();
  router.use(getSession(core));
  router.use(createSession(core));
  router.use(deleteSession(core));
  router.use(reset(core));
  router.use(verifyReset(core));

  return router;
};
