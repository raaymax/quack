import { Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { EMOJI_PARAMS_SCHEMA, saveEmojiUpload } from "./upload.ts";

export default (core: Core) =>
  new Route({
    method: "PUT",
    url: "/:shortname",
    public: false,
    schema: { params: EMOJI_PARAMS_SCHEMA },
    handler: (req) => saveEmojiUpload(core, req, "emoji:replace"),
  });
