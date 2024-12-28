import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

export default (core: Core) =>
  new Route({
    public: true,
    method: "PUT",
    url: "/reset/:token",
    schema: {
      params: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string" },
        },
      },
      body: {
        type: "object",
        required: ["email", "password", "publicKey", "secrets"],
        properties: {
          email: { type: "string" },
          password: { type: "string" },
          oldPassword: { type: "string" },
          publicKey: { type: "object" },
          secrets: {
            type: "object",
            required: ["encrypted", "_iv"],
            properties: {
              encrypted: { type: "string" },
              _iv: { type: "string" },
            },
          },
        },
      },
    },
    handler: async (req) => {
      await core.dispatch({
        type: "user:reset",
        body: {
          email: req.body.email,
          password: req.body.password,
          oldPassword: req.body.oldPassword,
          publicKey: req.body.publicKey,
          secrets: req.body.secrets,
        },
      });
      return Res.json({ status: "ok" });
    },
  });
