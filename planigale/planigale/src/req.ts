// deno-lint-ignore-file no-explicit-any
import * as qs from "@planigale/querystring";
import { ServeHandlerInfo } from "./types.ts";
import { Cookies } from "./cookies.ts";
import type { Route } from "./route.ts";

type ReqInit = {
  ip: Req["ip"];
  path: Req["path"];
  params: Req["params"];
  query: Req["query"];
  headers: Req["headers"];
  body: Req["body"];
  cookies: Req["cookies"];
};

/**
 * {@linkcode Request} object wrapper that provides a more convenient API for working with incoming requests.
 * It provides access to the URL, path, cookies, query parameters, headers, and body of the request.
 * It also provides a way to store additional information in the request object.
 * Route object to which the request is directed is also accessible through this object.
 */
export class Req {
  /** IP address of the client that sent the request. */
  ip: Deno.NetAddr;
  /** Route object to which the request is directed. */
  route?: Route;
  /** HTTP method of the request. */
  method: string;
  /** Full URL of the request. */
  url: string;
  /** Path of the request URL. */
  path: string;
  /** Cookies sent with the request. */
  cookies: Cookies;
  /** URL parameters extracted from the URL pattern. */
  params: Record<string, any>;
  /** Query parameters extracted from the request URL. */
  query: Record<string, any>;
  /** Headers sent with the request. */
  headers: Record<string, string>;
  /** Body of the request. */
  body: any;
  /** Additional information that can be stored in the request object. */
  state: any = {};

  /**
   * Create a new req object from a URL and options object.
   * @param url - string or {@linkcode URL} of the request.
   * @param opts - {@linkcode RequestInit} with state.
   * @returns A promise that resolves to a new Req object.
   */
  static async from(
    url: string | URL,
    { state, ...opts }: RequestInit & { state: any },
  ): Promise<Req> {
    const request = new Request(url, opts);
    const req = await Req.fromRequest(request);
    req.state = state;
    return req;
  }

  /**
   * Create a new req object from a Request object.
   * @param request - {@linkcode Request} object.
   * @param info - optional {@linkcode Deno.ServeHandlerInfo} object.
   * @returns A promise that resolves to a new Req object.
   */
  static async fromRequest(
    request: Request,
    info?: ServeHandlerInfo,
  ): Promise<Req> {
    const url = new URL(request.url);
    return new Req(request, {
      ip: info?.remoteAddr ?? {
        hostname: "localhost",
        port: 0,
        transport: "tcp",
      },
      path: url.pathname,
      params: {},
      cookies: new Cookies(request.headers),
      query: qs.parse(url.search.slice(1)),
      headers: Object.fromEntries(request.headers.entries()),
      body: request.body,
    });
  }

  /**
   * Create a new req object.
   * @internal
   * @param request - {@linkcode Request} object.
   * @param init - Initialization object.
   */
  private constructor(public request: Request, init: ReqInit) {
    this.ip = init.ip;
    this.method = request.method;
    this.url = request.url;
    this.path = init.path;
    this.params = init.params;
    this.query = init.query;
    this.headers = init.headers;
    this.body = init.body;
    this.cookies = init.cookies;
  }
}
