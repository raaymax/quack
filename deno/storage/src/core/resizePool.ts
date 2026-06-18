import type { ResizeRequest, ResizeResponse } from "./resizeWorker.ts";

type Pending = (bytes: Uint8Array<ArrayBuffer> | null) => void;

type Task = {
  request: ResizeRequest;
  resolve: Pending;
};

const DEFAULT_WORKERS = 2;

const workerCount = () => {
  try {
    const value = Number(Deno.env.get("STORAGE_RESIZE_WORKERS"));
    return Number.isInteger(value) && value > 0 ? value : DEFAULT_WORKERS;
  } catch {
    return DEFAULT_WORKERS;
  }
};

export class ResizePool {
  private idle: Worker[] = [];
  private queue: Task[] = [];
  private active = new Map<Worker, Pending>();
  private seq = 0;
  private started = false;

  constructor(private readonly size: number) {}

  private start() {
    if (this.started) return;
    this.started = true;
    for (let i = 0; i < this.size; i++) {
      this.idle.push(this.spawn());
    }
  }

  private spawn(): Worker {
    const worker = new Worker(
      new URL("./resizeWorker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (event: MessageEvent<ResizeResponse>) => {
      const resolve = this.active.get(worker);
      this.active.delete(worker);
      resolve?.(event.data.ok ? event.data.bytes : null);
      this.release(worker);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      const resolve = this.active.get(worker);
      this.active.delete(worker);
      resolve?.(null);
      worker.terminate();
      this.idle.push(this.spawn());
      this.drain();
    };
    return worker;
  }

  private release(worker: Worker) {
    this.idle.push(worker);
    this.drain();
  }

  private drain() {
    while (this.queue.length > 0 && this.idle.length > 0) {
      const worker = this.idle.shift()!;
      const task = this.queue.shift()!;
      this.active.set(worker, task.resolve);
      worker.postMessage(task.request, [task.request.bytes.buffer]);
    }
  }

  resize(
    bytes: Uint8Array<ArrayBuffer>,
    width: number,
    height: number,
    png: boolean,
  ): Promise<Uint8Array<ArrayBuffer> | null> {
    this.start();
    return new Promise<Uint8Array<ArrayBuffer> | null>((resolve) => {
      const request: ResizeRequest = {
        id: this.seq++,
        bytes,
        width,
        height,
        png,
      };
      this.queue.push({ request, resolve });
      this.drain();
    });
  }
}

let pool: ResizePool | undefined;

export const getResizePool = (): ResizePool => {
  if (!pool) {
    pool = new ResizePool(workerCount());
  }
  return pool;
};
