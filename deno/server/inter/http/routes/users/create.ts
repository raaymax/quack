import { InternalServerError, Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { User } from "../../../../types.ts";

export default (core: Core) =>
  new Route({
    method: "POST",
    url: "/:token",
    public: true,
    schema: {
      params: {
        type: "object",
        properties: {
          token: { type: "string", minLength: 32 },
        },
      },
      body: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 1 },
          email: { type: "string", minLength: 3 },
          password: { type: "string", minLength: 3 },
          sanityCheck: { type: "string" },
          publicKey: {
            type: "object",
            properties: {
              crv: { type: "string" },
              ext: { type: "boolean" },
              key_ops: { type: "array", items: { type: "string" } },
              kty: { type: "string" },
              x: { type: "string" },
              y: { type: "string" },
            },
          },
          secrets: {
            type: "object",
            properties: {
              encrypted: { type: "string" },
              _iv: { type: "string" },
            },
          },
        },
      },
    },
    handler: async (req) => {
      const createdId = await core.dispatch({
        type: "user:create",
        body: {
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          token: req.params.token,
          publicKey: req.body.publicKey,
          secrets: req.body.secrets,
        },
      });
      const user: Partial<User> | null = await core.user.get({ id: createdId });
      if (!user) {
        throw new InternalServerError(
          new Error("User not created, but no error thrown"),
        );
      }
      delete user.password;
      return Res.json(user);
    },
  });
