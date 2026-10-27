import type { Planigale } from "@planigale/planigale";
import { SSESource, type SSESourceInit } from "@planigale/sse";

export type SSESourceFactory = (
  url: string | Request,
  opts?: SSESourceInit,
) => SSESource;

export interface Testing {
  getUrl: () => string;
  listen: () => Promise<void>;
  fetch: typeof fetch;
  createEventSource: SSESourceFactory;
  close: () => Promise<void>;
}

export class TestingSrv implements Testing {
  static name = "HTTP";
  baseUrl: string = "http://127.0.0.1";

  constructor(private app: Planigale) {}

  getUrl: () => string = () => {
    return this.baseUrl;
  };

  listen: () => Promise<void> = async () => {
    const srv = await this.app.serve({ port: 0, onListen: () => {} });
    const baseUrl = `http://${srv.addr.hostname}:${srv.addr.port}`;
    this.baseUrl = baseUrl;
  };

  fetch: typeof fetch = async (req, opts) => {
    return await fetch(req, opts);
  };

  createEventSource: SSESourceFactory = (url, opts) => {
    return new SSESource(url, opts);
  };

  close: Testing["close"] = async () => this.app.close();
}

export class TestingQuick implements Testing {
  static name = "Handler";

  constructor(private app: Planigale) {}

  getUrl: () => string = () => {
    return "http://localhost";
  };

  listen: () => Promise<void> = async () => {};

  fetch: typeof fetch = async (req, opts) => {
    return await this.app.handle(new Request(req, opts));
  };

  createEventSource: SSESourceFactory = (url, opts) => {
    return new SSESource(url, { ...opts, fetch: this.fetch });
  };

  close: Testing["close"] = async () => this.app.close();
}
