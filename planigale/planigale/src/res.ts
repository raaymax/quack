import * as mime from "@std/media-types";
import * as path from "@std/path";
import { SSESink } from "@planigale/sse";
import { Cookies } from "./cookies.ts";
import type { ResponseLike } from "./route.ts";

/** A class representing a response, with methods for setting the body, status, headers, and cookies. */
export class Res {
  /** The body of the response. */
  body: unknown;
  /** The status code of the response. */
  status: number = 200;
  /** The headers of the response. */
  headers: Headers = new Headers({ "Content-Type": "application/json" });
  /** The cookies of the response. */
  cookies: Cookies = new Cookies(this.headers);

  /** Create a new response in JSON format with status code opts.status or 200.
   * @param data - The data to send in the response body.
   * @param opts - Options for the response {@linkcode ReponseInit}.
   * @returns The Res instance.
   */
  static json(data: unknown, opts?: ResponseInit): Res {
    const res = new Res();
    res.body = data;
    res.headers.set("Content-Type", "application/json");
    res.status = opts?.status || 200;
    return res;
  }

  /** Create a new response from file in the file system
   * @param filePath - The path to the file.
   * @param opts - Options for the response {@linkcode ReponseInit}.
   * @returns The Res instance.
   */
  static file(filePath: string, opts?: ResponseInit): Res {
    try {
      const res = new Res();
      const file = Deno.openSync(filePath);
      const fileInfo = file.statSync();
      const headers: Record<string, string> = {};
      headers["Content-Type"] = mime.contentType(path.extname(filePath)) ||
        "application/octet-stream";
      headers["Content-Length"] = fileInfo.size.toString();
      res.body = file.readable;
      res.headers = new Headers({ ...headers, ...opts?.headers });
      res.status = opts?.status || 200;
      return res;
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return Res.json({ message: "Not Found" }, { status: 404 });
      }
      throw err;
    }
  }

  /**
   * Create a new response with status code 204.
   * @returns The Res instance.
   */
  static empty(): Res {
    const res = new Res();
    res.status = 204;
    return res;
  }

  /** Sets the body of the response.
   * @param data - The data to send in the response body.
   * @returns this
   */
  send(data: unknown): Res {
    this.body = data;
    return this;
  }

  /**
   * Creates SSESink instance and sets the body of the response to the readable stream.
   * This converts the response to a server-sent events stream.
   * @returns The SSESink instance.
   *
   * @example
   * ```ts
   * app.route({
   *   method: 'GET',
   *   url: '/sse',
   *   handler: () => {
   *     const res = new Res();
   *     const sink = res.sendEvents();
   *     const interval = setInterval(() => sink.sendMessage({ data: 'Test' }), 1000);
   *     sink.addEventListener('close', () => clearInterval(interval));
   *     return res;
   *   }
   * });
   * ```
   */
  sendEvents(): SSESink {
    const target = new SSESink();
    for (const [key, value] of Object.entries(target.getHeaders())) {
      this.headers.set(key, value);
    }
    this.body = target.getStream();
    return target;
  }

  /**
   * Converts the res instance to a Fetch API {@linkcode Reponse}.
   * @returns The Fetch API {@linkcode Reponse}.
   */
  toResponse(): Response {
    if (this.body instanceof ReadableStream) {
      return new Response(this.body, {
        status: this.status,
        headers: this.headers,
      });
    }
    return new Response(JSON.stringify(this.body), {
      status: this.status,
      headers: this.headers,
    });
  }

  /**
   * @ignore
   * @internal
   */
  static async makeResponse(resPromise: ResponseLike): Promise<Response> {
    const res = await resPromise;
    if (res instanceof Response) {
      return res;
    } else if (typeof res === "function") {
      return await res();
    }
    return await res.toResponse();
  }
}
