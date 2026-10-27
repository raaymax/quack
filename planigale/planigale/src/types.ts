export interface ServeHandlerInfo {
  remoteAddr: Deno.NetAddr;
  completed: Promise<void>;
}

export interface ServeOptions {
  port?: number;
  hostname?: string;
  signal?: AbortSignal;
  reusePort?: boolean;
  onListen?: (addr: Deno.NetAddr) => void;
  onError?: (err: unknown) => Response | Promise<Response>;
}

export interface HttpServer<A extends Deno.NetAddr> {
  finished: Promise<void>;
  addr: A;
  unref(): void;
  ref(): void;
  shutdown(): Promise<void>;
}

export type ServeHandler = (
  req: Request,
  info: ServeHandlerInfo,
) => Promise<Response>;
