import { Planigale, Res, Router } from "@planigale/planigale";
import { SchemaValidator } from "@planigale/schema";
import { bodyParser } from "@planigale/body-parser";
import { join } from "@std/path";
import { authMiddleware } from "./middleware/auth.ts";
import { Core } from "../../core/mod.ts";
import { messageSchema } from "./schema/message.ts";
import { errorHandler } from "./errors.ts";

import { auth } from "./routes/auth/mod.ts";
import { ping, sse } from "./routes/system/mod.ts";
import { channels } from "./routes/channel/mod.ts";
import { files } from "./routes/files/mod.ts";
import { profile } from "./routes/profile/mod.ts";
import { users } from "./routes/users/mod.ts";
import { channelMessages, messages } from "./routes/messages/mod.ts";
import { emojis } from "./routes/emojis/mod.ts";
import { commands } from "./routes/commands/mod.ts";
import { channelReadReceipt, readReceipt } from "./routes/readReceipt/mod.ts";
import { interactions } from "./routes/interactions/mod.ts";

const PUBLIC_DIR = Deno.env.get("PUBLIC_DIR") ||
  join(Deno.cwd(), "..", "..", "packages", "app", "dist");

export class HttpInterface extends Planigale {
  constructor(private core: Core) {
    super();
    try {
      const schema = new SchemaValidator();
      schema.addFormat("entity-id", /^[a-fA-F0-9]{24}$/);
      schema.addFormat("emoji-shortname", /^:[a-zA-Z0-9\-_]+:$/);
      schema.addKeyword({
        keyword: "requireAny",
        type: "object",
        validate: (keys: string[], data: any) => {
          if (keys.some((key) => key in data)) {
            return true;
          }
          return false;
        },
      });
      schema.addSchema(messageSchema);
      this.use(async (req, next) => {
        const start = Date.now();
        const ret = await next();
        const time = Date.now() - start;
        //console.log(req.method, req.url, ret.status, time + "ms");
        return ret;
      });
      this.use(errorHandler);
      this.use(bodyParser);
      this.use(authMiddleware(core));
      this.use(schema.middleware);
      this.use("/api/ping", ping(core));
      this.use("/api/sse", sse(core));
      this.use("/api/auth", auth(core));
      this.use("/api/profile", profile(core));
      this.use("/api/users", users(core));
      this.use("/api/emojis", emojis(core));
      this.use("/api/commands", commands(core));
      this.use("/api/files", files(core));
      this.use("/api/messages", messages(core));
      this.use("/api/read-receipts", readReceipt(core));
      this.use("/api/interactions", interactions(core));

      this.use("/api/channels", channels(core));
      this.use("/api/channels/:channelId/messages", channelMessages(core));
      this.use(
        "/api/channels/:channelId/read-receipts",
        channelReadReceipt(core),
      );

      // todo: move this to routes
      this.route({
        method: "GET",
        url: "/:path*",
        public: true,
        handler: async (req) => {
          const path = req.params.path || "index.html";
          if (PUBLIC_DIR.startsWith("http")) {
            return await fetch(`${PUBLIC_DIR}/${path}`, { method: "GET" });
          }
          return Res.file(join(PUBLIC_DIR, path)).toResponse();
        },
      });
    } catch (e) {
      console.error(e);
    }
  }
}
