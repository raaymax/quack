import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

export default (core: Core) =>
  new Route({
    method: "GET",
    url: "/",
    handler: (req) => {
      const res = new Res();
      const target = res.sendEvents();
      target.sendMessage({ data: JSON.stringify({ status: "connected" }) });

      const off = core.bus.on(req.state.user.id, (msg) => {
        target.sendMessage({ data: JSON.stringify(msg) });
      });
      target.addEventListener("close", () => off(), { once: true });

      return res;
    },
  });
