import { type SSEEvent, SSEStream } from "./stream.ts";

export class SSESink extends EventTarget {
  #keepAliveTimer: ReturnType<typeof setInterval> | undefined;
  #keepAliveTime = 3000;
  #closed = false;
  stream: ReadableStream<SSEEvent>;
  ctl: ReadableStreamDefaultController<SSEEvent> | null = null;

  constructor(opts: { keepAliveInterval?: number } = {}) {
    super();
    if (opts.keepAliveInterval) {
      this.#keepAliveTime = opts.keepAliveInterval;
    }
    this.stream = new ReadableStream<SSEEvent>({
      start: (controller) => {
        this.ctl = controller;
      },
      cancel: () => {
        this.#closed = true;
        clearTimeout(this.#keepAliveTimer);
        this.dispatchEvent(new Event("close"));
        this.ctl?.close();
      },
    });

    this.#loop();
  }

  sendMessage(message: SSEEvent): void {
    if (this.#closed) {
      throw new Error("Sink is closed");
    }
    this.ctl?.enqueue(message);
  }

  close(): void {
    this.#closed = true;
    clearTimeout(this.#keepAliveTimer);
    this.ctl?.close();
  }

  // keep-alive by sending comments
  #loop(): void {
    this.#keepAliveTimer = setTimeout(() => {
      if (this.#closed) {
        return;
      }
      this.sendMessage({ comment: "keep-alive" });
      this.#loop();
    }, this.#keepAliveTime);
  }

  getHeaders(): Record<string, string> {
    return {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    };
  }

  getStream(): ReadableStream<Uint8Array> {
    return this.stream.pipeThrough(new SSEStream());
  }

  toResponse(): Response {
    if (!this.stream) {
      throw new Error("No stream");
    }
    return new Response(this.getStream(), {
      headers: this.getHeaders(),
    });
  }
}
