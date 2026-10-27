import { TextLineStream } from "./lines.ts";

export declare interface SSESourceInit extends RequestInit {
  fetch?: typeof fetch;
  keepAliveTimeout?: number;
}

type SSEEvent = {
  data: string;
  event?: string;
  id?: string;
  retry?: number;
};

type ErrorEvent = {
  type: "error";
  error: unknown;
};

type CloseEvent = {
  type: "close";
};

type InternalEvent = ErrorEvent | CloseEvent | (SSEEvent & { type: "event" });

function parseMessage(message: SSEEvent, data: Record<string, string>): void {
  if (data.data) {
    message.data = data.data;
  }
  if (data.event) {
    message.event = data.event;
  }
  if (data.id) {
    message.id = data.id;
  }
  if (data.retry) {
    message.retry = parseInt(data.retry);
  }
}

class SSEDecoderStream extends TransformStream<string, SSEEvent> {
  event = { data: "" };
  constructor() {
    super({
      transform: (chunk, controller) => {
        if (!chunk) {
          controller.enqueue(this.event);
          this.event = { data: "" };
          return;
        }
        const idx = chunk.indexOf(":");
        const type = idx === -1 ? chunk : chunk.slice(0, idx);
        const val = idx === -1 ? "" : chunk.slice(idx + 1).trim();
        parseMessage(this.event, { [type]: val });
      },
    });
  }
}
async function* abortable(
  p: ReadableStream<SSEEvent>,
  signal: AbortSignal,
): AsyncGenerator<SSEEvent> {
  signal.throwIfAborted();
  const { promise, reject } = Promise.withResolvers<never>();
  const abort = () => reject(signal.reason);
  signal.addEventListener("abort", abort, { once: true });

  const reader = p.getReader();
  try {
    while (true) {
      const { done, value } = await Promise.race([promise, reader.read()]);
      if (done) {
        return;
      }
      yield value;
    }
  } catch (e) {
    throw e;
  } finally {
    signal.removeEventListener("abort", abort);
    reader.releaseLock();
  }
}

export class SSESource {
  #input: Request | string | URL;
  #options: RequestInit | undefined;
  #fetch: typeof fetch;
  #abortController: AbortController;
  #queue: InternalEvent[] = [];
  #waiting: ((ev: InternalEvent) => void)[] = [];
  #stream: ReadableStream<SSEEvent> | undefined;
  #closed: Promise<void>;
  #connected: () => void;
  #connectionError: (e: Error) => void;
  #keepAliveTime: number = 10000;
  #keepAliveTimeout: ReturnType<typeof setTimeout> | undefined;
  connected: Promise<void>;

  constructor(input: Request | string | URL, opts?: SSESourceInit) {
    const {
      fetch: f = ((...a: Parameters<typeof fetch>) => fetch(...a)),
      ...options
    } = opts ?? {};
    this.#abortController = new AbortController();
    ({
      promise: this.connected,
      resolve: this.#connected,
      reject: this.#connectionError,
    } = Promise.withResolvers<
      void
    >());
    opts?.signal?.addEventListener(
      "abort",
      () => this.#abortController.abort(opts?.signal?.reason),
      { once: true },
    );
    this.#input = input;
    this.#options = options;
    if (opts?.keepAliveTimeout) {
      this.#keepAliveTime = opts.keepAliveTimeout;
    }
    this.#fetch = f;
    this.#closed = this.#loop().catch((e) => {
      this.#connectionError(e);
    });
  }

  async close(): Promise<void> {
    clearTimeout(this.#keepAliveTimeout);
    this.#abortController.abort("SSE source closed");
    await this.connected.catch(() => {});
    await this.#closed;
  }

  async #loop(): Promise<void> {
    await this.#connect();
    this.dispatch({ type: "close" });
  }

  async #connect(): Promise<void> {
    const headers = new Headers({
      "accept": "text/event-stream",

      ...(this.#options?.headers ?? {}),
      ...(this.#input instanceof Request
        ? Object.fromEntries(this.#input.headers.entries())
        : {}),
    });

    const req = new Request(this.#input, {
      ...this.#options,
      signal: this.#abortController.signal,
      headers,
    });

    const res = await this.#fetch(req);
    if (res.status !== 200) {
      res.body?.cancel();
      return this.#connectionError(
        new Error(`Unexpected status code: ${res.status}`),
      );
    }
    if (res.headers.get("content-type") !== "text/event-stream") {
      res.body?.cancel();
      return this.#connectionError(
        new Error(
          `Unexpected content type: ${res.headers.get("content-type")}`,
        ),
      );
    }

    await this.#connectBody(res);
  }

  async #connectBody(res: Response): Promise<void> {
    if (!res.body) {
      return this.#connectionError(new Error("No response body"));
    }

    this.#stream = res.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
      .pipeThrough(new SSEDecoderStream());

    this.#connected();

    try {
      this.#resetKeepAliveTimeout();
      for await (
        const event of abortable(this.#stream, this.#abortController.signal)
      ) {
        this.#resetKeepAliveTimeout();
        this.dispatch({ type: "event", ...event });
      }
    } catch (e) {
      this.dispatch({ type: "error", error: e });
    } finally {
      clearTimeout(this.#keepAliveTimeout);
      try {
        await this.#stream.cancel();
      } catch (e) {
        this.dispatch({ type: "error", error: e });
      }
    }
  }

  dispatch(event: InternalEvent): void {
    this.#queue.push(event);
    this.#handleEvent();
  }

  #handleEvent(): void {
    if (this.#waiting.length && this.#queue.length) {
      const resolve = this.#waiting.shift() as (
        ev: InternalEvent | null,
      ) => void;
      resolve(this.#queue.shift() ?? null);
    }
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<SSEEvent> {
    while (true) {
      const { done, event } = await this.next();
      if (done) {
        break;
      }
      yield event;
    }
  }

  async next(): Promise<
    { done: false; event: SSEEvent } | { done: true; event: null }
  > {
    await this.connected;
    if (this.#waiting.length) {
      throw new Error("Already waiting for next event");
    }

    return new Promise<InternalEvent>((resolve) => {
      this.#waiting.push(resolve);
      this.#handleEvent();
    }).then((event) => {
      if (event.type === "event") {
        return ({ done: false, event });
      } else if (event.type === "error") {
        throw event.error;
      } else {
        return ({ done: true, event: null });
      }
    });
  }

  #resetKeepAliveTimeout(): void {
    clearTimeout(this.#keepAliveTimeout);
    this.#keepAliveTimeout = setTimeout(() => {
      this.dispatch({ type: "error", error: new Error("Keep-alive timeout") });
      this.close();
      this.#resetKeepAliveTimeout();
    }, this.#keepAliveTime);
  }
}
