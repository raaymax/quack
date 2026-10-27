import { ApiError, InternalServerError, ResourceNotFound } from "./errors.ts";
import { Router } from "./route.ts";
import type { Next } from "./route.ts";
import { RootContext } from "./context.ts";
import { Req } from "./req.ts";
import { Res } from "./res.ts";
import { HttpServer, ServeHandlerInfo, ServeOptions } from "./types.ts";
import { FindSymbol } from "./symbols.ts";

/**
 * Planigale main class to create a new instance of the server.
 *
 * @example
 * ```ts
 * import { Planigale } from '@codecat/planigale';
 * const app = new Planigale();
 *
 * app.use(async (req, res, next) => {
 *   const ts = new Date().toISOString();
 *   const key = `${ts}: ${req.method} ${req.url}`;
 *   console.time(key);
 *   await next();
 *   console.timeEnd(key);
 * });
 *
 * app.route({
 *  url: '/',
 *  method: 'GET',
 *  handler: (req, res) => res.send('Hello World!')
 * });
 *
 * app.route({
 *   method: 'POST',
 *   url: '/form',
 *   schema: {
 * 		  body: {
 * 		    type: 'object',
 * 		    properties: {
 * 		      name: {type: 'string'},
 * 		    },
 * 		    required: ['name'],
 * 		  },
 * 		},
 * 		handler: (req, res) => res.send(`Hello ${req.body.name}!`)
 * 	});
 *
 * 	app.serve({ port: 8000 });
 * 	```
 */
export class Planigale extends Router {
  #srv: HttpServer<Deno.NetAddr> | null = null;
  #strictMode = false;

  constructor({ strict = false } = {}) {
    super();
    this.#strictMode = strict;
  }

  /** This method is used to handle incoming requests. It will return a response object.
   * You can use this method to handle requests manually. Request and Response objects are the same as in fetch API.
   * This function is very useful for testing purposes as it provides all functionality of the server without the need to run it.
   * @example
   * ```ts
   * const app = new Planigale();
   * const request = new Request('http://localhost:8000/', {method: 'GET'});
   * const response = await app.handle(request);
   * console.log(response);
   * ```
   */
  handle = async (
    request: Request,
    info?: ServeHandlerInfo,
  ): Promise<Response> => {
    try {
      const req = await Req.fromRequest(request, info);
      const ctx = this[FindSymbol](req, new RootContext(this.#strictMode));
      if (!ctx) {
        throw new ResourceNotFound("Resource not found");
      }
      ctx.preProcess(req);

      const res = await ctx.getRoutes()
        .map((r) => r.getMiddlewares())
        .flat()
        .reduce<Next>((acc, middleware) => {
          return async () => await middleware(req, acc);
        }, async () => await ctx.route.handler(req))();

      return await Res.makeResponse(res);
    } catch (e) {
      return this.#handleErrors(e);
    }
  };

  /** Serves the application using Deno.serve, it will return a Deno.HttpServer instance.
   * You can use the server to close the connection or to listen for incoming requests.
   * The opts parameter is the same as Deno.serve options.
   * @example
   * 	```ts
   * const app = new Planigale();
   * app.serve({ port: 8000 })
   * ```
   */

  async serve(opts?: ServeOptions): Promise<HttpServer<Deno.NetAddr>> {
    if (!opts) opts = {};
    const srv = Deno.serve(opts, this.handle);
    srv.finished.then(() => this.#emit("close"));
    this.#srv = srv;
    return srv;
  }

  /** Closes the server. */
  async close() {
    if (this.#srv) {
      await this.#srv.shutdown();
    } else {
      await this.#emit("close");
    }
  }

  /** This method is used to listen for `close` event.
   * Can be used to close also other connections like databases or similar
   */
  onClose(cb: () => void) {
    this.#on("close", cb);
  }

  #events = new Map<string, Array<() => Promise<void> | void>>();
  #on(event: string, cb: () => Promise<void> | void) {
    if (!this.#events.has(event)) {
      this.#events.set(event, []);
    }
    this.#events.get(event)?.push(cb);
  }

  async #emit(event: string) {
    if (!this.#events.has(event)) {
      return;
    }
    return await Promise.all(
      this.#events.get(event)
        ?.map((cb) => Promise.resolve(cb())) ?? [],
    );
  }

  #handleErrors(e: unknown) {
    if (e instanceof ApiError) {
      if (e.log) console.error(e);
      return new Response(JSON.stringify(e.serialize()), {
        status: e.status,
        headers: {
          ...e.headers,
          "Content-Type": "application/json",
        },
      });
    }
    console.error("Internal server error:", e);
    if (e instanceof Error) {
      const ise = new InternalServerError(e);
      return new Response(JSON.stringify(ise.serialize()), {
        status: ise.status,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
