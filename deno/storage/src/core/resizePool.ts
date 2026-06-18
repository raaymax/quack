import type { WorkerRequest, WorkerResponse } from "./resizeWorker.ts";
import { getEnvInt } from "./env.ts";

type Pending = (response: WorkerResponse | null) => void;

type Task = {
  request: WorkerRequest;
  resolve: Pending;
};

type Active = {
  resolve: Pending;
  timer: number;
};

const DEFAULT_WORKERS = 2;
const DEFAULT_TIMEOUT_MS = 30_000;

export class ResizePool {
  private workers = new Set<Worker>();
  private idle: Worker[] = [];
  private queue: Task[] = [];
  private active = new Map<Worker, Active>();
  private started = false;
  private closed = false;

  constructor(
    private readonly size: number,
    private readonly maxPending: number = size * 4,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

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
    this.workers.add(worker);
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const entry = this.active.get(worker);
      this.active.delete(worker);
      if (entry) {
        clearTimeout(entry.timer);
        entry.resolve(event.data);
      }
      this.release(worker);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      this.discard(worker);
    };
    return worker;
  }

  private discard(worker: Worker) {
    const entry = this.active.get(worker);
    this.active.delete(worker);
    if (entry) {
      clearTimeout(entry.timer);
      entry.resolve(null);
    }
    this.workers.delete(worker);
    worker.terminate();
    if (this.closed) return;
    this.idle.push(this.spawn());
    this.drain();
  }

  private release(worker: Worker) {
    if (this.closed) return;
    this.idle.push(worker);
    this.drain();
  }

  private drain() {
    while (this.queue.length > 0 && this.idle.length > 0) {
      const worker = this.idle.shift()!;
      const task = this.queue.shift()!;
      const timer = setTimeout(() => {
        console.warn("[storage] thumbnail resize timed out, serving original");
        this.discard(worker);
      }, this.timeoutMs);
      this.active.set(worker, { resolve: task.resolve, timer });
      worker.postMessage(task.request, [task.request.bytes.buffer]);
    }
  }

  hasCapacity(): boolean {
    return !this.closed &&
      this.active.size + this.queue.length < this.maxPending;
  }

  resize(
    bytes: Uint8Array<ArrayBuffer>,
    width: number,
    height: number,
    png: boolean,
  ): Promise<Uint8Array<ArrayBuffer> | null> {
    return this.enqueue({ op: "resize", bytes, width, height, png }).then(
      (res) => (res && res.ok && "bytes" in res ? res.bytes : null),
    );
  }

  readResolution(
    bytes: Uint8Array<ArrayBuffer>,
  ): Promise<{ width: number; height: number } | null> {
    return this.enqueue({ op: "resolution", bytes }).then(
      (res) =>
        res && res.ok && "width" in res
          ? { width: res.width, height: res.height }
          : null,
    );
  }

  private enqueue(request: WorkerRequest): Promise<WorkerResponse | null> {
    if (this.closed) return Promise.resolve(null);
    this.start();
    return new Promise<WorkerResponse | null>((resolve) => {
      this.queue.push({ request, resolve });
      this.drain();
    });
  }

  close() {
    this.closed = true;
    for (const task of this.queue) {
      task.resolve(null);
    }
    this.queue = [];
    for (const entry of this.active.values()) {
      clearTimeout(entry.timer);
      entry.resolve(null);
    }
    this.active.clear();
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers.clear();
    this.idle = [];
  }
}

let pool: ResizePool | undefined;

export const getResizePool = (): ResizePool => {
  if (!pool) {
    const workers = getEnvInt("STORAGE_RESIZE_WORKERS", DEFAULT_WORKERS);
    pool = new ResizePool(
      workers,
      getEnvInt("STORAGE_RESIZE_MAX_PENDING", workers * 4),
      getEnvInt("STORAGE_RESIZE_TIMEOUT_MS", DEFAULT_TIMEOUT_MS),
    );
  }
  return pool;
};

export const closeResizePool = () => {
  pool?.close();
  pool = undefined;
};

globalThis.addEventListener("unload", () => closeResizePool());
