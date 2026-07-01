import { Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { EntityId } from "../../../../types.ts";
import { serializeUser } from "../users/_serializeUser.ts";

export default (core: Core) =>
  new Route({
    method: "PATCH",
    url: "/",
    public: false,
    schema: {
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120 },
        },
      },
    },
    handler: async (req) => {
      const userId = req.state.user.id;
      const name = String(req.body.name).trim();
      if (!name) {
        return Response.json(
          { errorCode: "INVALID_NAME", message: "name cannot be empty" },
          { status: 400 },
        );
      }
      await core.dispatch(
        {
          type: "user:setProfile",
          body: { id: userId, name },
        } as Parameters<Core["dispatch"]>[0],
      ).internal();
      const user = await core.repo.user.getR({ id: EntityId.from(userId) });
      return Response.json({ status: "ok", user: serializeUser(user) });
    },
  });
