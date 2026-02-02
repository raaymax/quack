import { Router } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import notifications from "./notifications.ts";

export const mobile = (core: Core) => {
  const router = new Router();
  router.use("/notifications", notifications(core));
  return router;
};
