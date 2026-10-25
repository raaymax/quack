import type { Repository } from "../../infra/mod.ts";
import type { AnonymousRequest } from "../../types.ts";

const FLUSH_DELAY_MS = 1000;
const MAX_BATCH = 500;
const MAX_PENDING = 10_000;

export type AnonymousRequestEntry = Omit<AnonymousRequest, "id">;

export class AnonymousRequestLog {
  #pending: AnonymousRequestEntry[] = [];
  #timer: number | null = null;
  #flushing: Promise<void> = Promise.resolve();
  dropped = 0;

  constructor(private repo: Repository, public enabled = true) {}

  record(entry: AnonymousRequestEntry) {
    if (!this.enabled) return;
    if (this.#pending.length >= MAX_PENDING) {
      this.dropped++;
      return;
    }
    this.#pending.push(entry);
    if (this.#pending.length >= MAX_BATCH) {
      this.flush();
    } else if (this.#timer === null) {
      this.#timer = setTimeout(() => this.flush(), FLUSH_DELAY_MS);
      Deno.unrefTimer(this.#timer);
    }
  }

  flush(): Promise<void> {
    if (this.#timer !== null) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
    const batch = this.#pending.splice(0, this.#pending.length);
    this.#flushing = this.#flushing.then(async () => {
      if (batch.length === 0) return;
      try {
        await this.repo.anonymousRequest.insertMany(batch);
      } catch (error) {
        console.error("[traffic] failed to store anonymous requests", error);
      }
    });
    return this.#flushing;
  }
}
