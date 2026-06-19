import { Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { EntityId } from "../../../../types.ts";
import { EMOJI_PARAMS_SCHEMA, parseEmojiUpload } from "./parse.ts";

export default (core: Core) =>
  new Route({
    method: "PUT",
    url: "/:shortname",
    public: false,
    schema: { params: EMOJI_PARAMS_SCHEMA },
    handler: async (req) => {
      const meta = parseEmojiUpload(req);
      if (meta instanceof Response) return meta;

      const storageId = await core.storage.upload(req.body, meta);

      const id = await core.dispatch({
        type: "emoji:replace",
        body: { shortname: req.params.shortname, storageId },
      }).internal() as EntityId;

      const emoji = await core.repo.emoji.get({ id });
      return Response.json({ status: "ok", emoji });
    },
  });
