import type { Planigale } from "@planigale/planigale";
import { SSESource, SSESourceInit } from "@planigale/sse";
import {
  assert,
  assertEquals,
  CookieJar,
  mime,
  path,
  wrapFetch,
} from "./deps.ts";
import { formDataToBlob } from "./formData.ts";

const Serialize = Symbol("Serialize");
const Startserver = Symbol("Startserver");
const Fetch = Symbol("Fetch");

type FetchFn = (
  req: Request | URL | string,
  opts?: RequestInit,
) => Promise<Response>;
export class Agent {
  fetch: FetchFn;
  #cookieJar: CookieJar = new CookieJar();
  #app: Planigale;
  #addr: {
    transport: "tcp" | "udp";
    hostname: string;
    port: number;
  } = { transport: "tcp", hostname: "127.0.0.1", port: 80 };
  #connections: SSESource[] = [];

  constructor(app: Planigale) {
    this.#app = app;
    // this.fetch = async (req: string | URL | Request, init?: RequestInit) => {
    //   return await app.handle(new Request(req, init));
    // }
    this.fetch = wrapFetch({
      cookieJar: this.#cookieJar,
      fetch: async (url: string | URL | Request, init?: RequestInit) => {
        const req = new Request(url, init);
        const res = await app.handle(req);
        return new Proxy<Response>(res, {
          get(target, prop) {
            if (prop === "url") {
              return req.url;
            }
            if (prop in target) {
              return target[prop as keyof typeof target];
            }
            return undefined;
          },
        });
      },
    });
  }

  static async from(
    app: Planigale,
    strategy?: "http" | "handler",
  ): Promise<Agent> {
    const agent = new Agent(app);
    if (strategy === "http") {
      await agent[Startserver]();
    }
    return agent;
  }

  get [Fetch](): FetchFn {
    return this.fetch;
  }

  async [Startserver](): Promise<void> {
    //this.fetch = fetch;
    this.fetch = wrapFetch({
      cookieJar: this.#cookieJar,
      fetch,
    });
    const srv = await this.#app.serve({ port: 0, onListen: () => {} });
    this.#addr = srv.addr;
  }

  /**
   * Create a new request method using the provided Planigale instance.
   *
   * @param app The Planigale instance to use for the request.
   * @returns A new RequestBuilder instance for making requests.
   */
  static request(app: Planigale): RequestBuilder {
    const agent = new Agent(app);
    return new RequestBuilder(agent);
  }
  /**
   * Starts the server with the given app and executes the provided function with the agent.
   * @param app - The Planigale app instance.
   * @param fn - The function to be executed with the agent.
   * @returns A promise that resolves when the function execution is complete.
   */
  static async server(
    app: Planigale,
    fn: (agent: Agent) => Promise<void>,
  ): Promise<void> {
    const agent = new Agent(app);
    await agent[Startserver]();
    try {
      await fn(agent);
    } catch (e) {
      throw e;
    } finally {
      await agent.close();
    }
  }

  static async test(app: Planigale, opts: {
    type: "http" | "handler";
  }, fn: (agent: Agent) => Promise<void>): Promise<void> {
    const agent = await Agent.from(app, opts.type);
    try {
      await fn(agent);
    } catch (e) {
      throw e;
    } finally {
      await agent.close();
    }
  }

  async useServer() {
    await this[Startserver]();
  }

  request: () => RequestBuilder = () => new RequestBuilder(this);

  // @deprecated: Use `connectSSE` instead it will close the connection when the agent is closed.
  events: (url: string, opts: SSESourceInit) => SSESource = (
    url: string,
    opts: SSESourceInit = {},
  ) => {
    return new SSESource(new URL(url, this.addr), {
      ...opts,
      fetch: this.fetch,
    });
  };

  connectSSE: (url: string, opts?: SSESourceInit) => SSESource = (
    url: string,
    opts: SSESourceInit = {},
  ) => {
    const con = new SSESource(new URL(url, this.addr), {
      ...opts,
      fetch: this.fetch,
    });
    this.#connections.push(con);
    return con;
  };

  async close(): Promise<void> {
    for (const con of this.#connections) {
      await con.close();
    }
    await this.#app.close();
  }

  get addr(): string {
    let a = `http://${this.#addr.hostname}`;
    if (this.#addr.port !== 80) {
      a += `:${this.#addr.port}`;
    }
    return a;
  }
}

class RequestBuilder {
  #url: string = "";
  #method: string = "GET";

  constructor(private parent: Agent) {}

  get [Fetch](): FetchFn {
    return this.parent[Fetch];
  }

  get(url: string): HeadersBuilder {
    this.#url = url;
    this.#method = "GET";
    return new HeadersBuilder(this);
  }

  post(url: string): BodyBuilder {
    this.#url = url;
    this.#method = "POST";
    return new BodyBuilder(this);
  }

  put(url: string): BodyBuilder {
    this.#url = url;
    this.#method = "PUT";
    return new BodyBuilder(this);
  }

  delete(url: string): BodyBuilder {
    this.#url = url;
    this.#method = "DELETE";
    return new BodyBuilder(this);
  }

  patch(url: string): BodyBuilder {
    this.#url = url;
    this.#method = "PATCH";
    return new BodyBuilder(this);
  }

  head(url: string): HeadersBuilder {
    this.#url = url;
    this.#method = "HEAD";
    return new HeadersBuilder(this);
  }

  options(url: string): HeadersBuilder {
    this.#url = url;
    this.#method = "OPTIONS";
    return new HeadersBuilder(this);
  }

  trace(url: string): HeadersBuilder {
    this.#url = url;
    this.#method = "TRACE";
    return new HeadersBuilder(this);
  }

  connect(url: string): HeadersBuilder {
    this.#url = url;
    this.#method = "CONNECT";
    return new HeadersBuilder(this);
  }

  [Serialize](): Request {
    return new Request(this.parent.addr + this.#url, {
      method: this.#method,
    });
  }
}
class BodyBuilder {
  #headers: Record<string, string> = {};
  #body: BodyInit | null | Promise<BodyInit> = null;
  #filePath: string | null = null;

  constructor(private parent: RequestBuilder) {}

  get [Fetch](): FetchFn {
    return this.parent[Fetch];
  }

  json(body: object): HeadersBuilder {
    this.#headers["Content-Type"] = "application/json";
    this.#body = JSON.stringify(body);
    return new HeadersBuilder(this);
  }

  emptyBody(): HeadersBuilder {
    this.#body = null;
    return new HeadersBuilder(this);
  }

  // deno-lint-ignore no-explicit-any
  formData(body: Record<any, any>): HeadersBuilder {
    const formData = new FormData();
    for (const key in body) {
      const val = body[key as keyof typeof body];
      if (val instanceof Blob) {
        formData.append(key, val, key);
      } else if (val instanceof File) {
        formData.append(key, val, val.name);
      } else {
        formData.append(key, val);
      }
    }
    this.#body = formDataToBlob(formData);
    return new HeadersBuilder(this);
  }

  urlencoded(body: object): HeadersBuilder {
    this.#headers["Content-Type"] = "application/x-www-form-urlencoded";
    const urlencoded = new URLSearchParams();
    for (const key in body) {
      urlencoded.append(key, body[key as keyof typeof body]);
    }
    this.#body = urlencoded;
    return new HeadersBuilder(this);
  }

  text(body: string): HeadersBuilder {
    this.#headers["Content-Type"] = "text/plain;charset=UTF-8";
    this.#body = body;
    return new HeadersBuilder(this);
  }

  file(path: string): HeadersBuilder {
    this.#filePath = path;
    return new HeadersBuilder(this);
  }

  async [Serialize](): Promise<Request> {
    if (this.#filePath) {
      const file = await Deno.open(this.#filePath);
      const fileInfo = await file.stat();
      this.#headers["Content-Type"] =
        mime.contentType(path.extname(this.#filePath)) ||
        "application/octet-stream";
      this.#headers["Content-Length"] = fileInfo.size.toString();
      this.#headers["Content-Disposition"] = `attachment; filename="${
        path.basename(this.#filePath)
      }"`;
      this.#body = file.readable;
    }
    return new Request(this.parent[Serialize](), {
      headers: new Headers(this.#headers),
      body: await this.#body,
    });
  }
}

class HeadersBuilder {
  #headers: Record<string, string> = {};

  constructor(private parent: BodyBuilder | RequestBuilder) {}

  get [Fetch](): FetchFn {
    return this.parent[Fetch];
  }

  header(key: string, value: string): HeadersBuilder {
    this.#headers[key] = value;
    return this;
  }
  headers(headers: Record<string, string>): HeadersBuilder {
    this.#headers = { ...this.#headers, ...headers };
    return this;
  }

  // deno-lint-ignore no-explicit-any
  expect(status: number | number[], body?: any): Tester {
    const tester = new Tester(this);
    return tester.expect(status, body);
  }

  async [Serialize](): Promise<Request> {
    const req = await this.parent[Serialize]();

    return new Request(req, {
      headers: new Headers({
        ...Object.fromEntries(req.headers.entries()),
        ...this.#headers,
      }),
    });
  }

  discardBody(): Tester {
    const tester = new Tester(this);
    return tester.discardBody();
  }

  async then(
    resolve?: (res: Response) => Promise<void>,
    reject?: (err: Error) => Promise<void>,
  ): Promise<void> {
    const tester = new Tester(this);
    return await tester.then(resolve, reject);
  }
}

type TestFn = (res: Response) => Promise<void> | void;
class Tester {
  #expectations: TestFn[] = [];

  constructor(private parent: HeadersBuilder) {}

  get [Fetch](): FetchFn {
    return this.parent[Fetch];
  }

  expect(fn: TestFn): Tester;
  // deno-lint-ignore no-explicit-any
  expect(status: number | number[], body?: any): Tester;
  // deno-lint-ignore no-explicit-any
  expect(arg: TestFn | number | number[], arg2?: any): Tester {
    const err = new Error();
    if (typeof arg === "function") {
      this.#expectations.push(arg);
    } else {
      const status = [arg].flat();
      const body = arg2;

      this.#expectations.push(async (res: Response) => {
        try {
          assert(
            status.includes(res.status),
            `Endpoint responded with invalid status code: ${res.status} allowed codes: ${
              JSON.stringify(status)
            }`,
          );
        } catch (e) {
          res.json().then(console.log).catch(console.error);
          if (e instanceof Error) {
            err.message = e.message;
          } else {
            err.message = "Unknown error: " + e;
          }
          throw err;
        }
      });

      if (body) {
        this.#expectations.push(async (res: Response) => {
          try {
            assertEquals(await res.json(), body);
          } catch (e) {
            if (e instanceof Error) {
              err.message = e.stack ?? e.message;
            } else {
              err.message = "Unknown error: " + e;
            }
            throw err;
          }
        });
      }
    }
    return this;
  }

  discardBody(): Tester {
    this.#expectations.push(async (res: Response) => {
      await res.body?.cancel();
    });
    return this;
  }

  async then(
    resolve?: (res: Response) => Promise<void>,
    reject?: (err: Error) => Promise<void>,
  ): Promise<void> {
    const req = await this.parent[Serialize]();
    const res = await this[Fetch](req);
    try {
      for (const expectation of this.#expectations) {
        await expectation(res);
      }
    } catch (e) {
      if (e instanceof Error) {
        return await reject?.(e);
      }
      return await reject?.(new Error("" + e));
    }
    return await resolve?.(res);
  }
}
