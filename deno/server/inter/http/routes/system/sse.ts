import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

export default (core: Core) =>
  new Route({
    method: "GET",
    url: "/",
    handler: (req) => {
      const res = new Res();
      const target = res.sendEvents();
      try {
        target.sendMessage({ data: JSON.stringify({ status: "connected" }) });
      } catch (e) {
        target.close();
      }
      const off = core.bus.on(req.state.user.id, (msg) => {
        try {
          target.sendMessage({ data: JSON.stringify(msg) });
        } catch (e) {
          target.close();
        }
      });
      target.addEventListener("close", () => off(), { once: true });

      return res;
    },
  });
