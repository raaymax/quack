import { Router } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

import deleteSession from "./deleteSession.ts";
import createSession from "./postSession.ts";
import getSession from "./getSession.ts";
import putPassword from "./putPassword.ts";
import checkPasswordResetToken from "./checkPasswordResetToken.ts";

export const auth = (core: Core) => {
  const router = new Router();
  router.use(getSession(core));
  router.use(createSession(core));
  router.use(deleteSession(core));
  router.use(putPassword(core));
  router.use(checkPasswordResetToken(core));

  return router;
};
