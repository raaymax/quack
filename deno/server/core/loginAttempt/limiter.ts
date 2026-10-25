import type { Core } from "../core.ts";

export type LoginSlot = {
  finish(failed: boolean): Promise<void>;
};

export class LoginLimiter {
  #inFlight = new Map<string, number>();
  #queues = new Map<string, Promise<unknown>>();

  constructor(private core: Core) {}

  #exclusive<T>(ip: string, fn: () => Promise<T>): Promise<T> {
    const run = (this.#queues.get(ip) ?? Promise.resolve()).then(fn, fn);
    const tail = run.catch(() => {});
    this.#queues.set(ip, tail);
    tail.then(() => {
      if (this.#queues.get(ip) === tail) this.#queues.delete(ip);
    });
    return run;
  }

  acquire(ip: string): Promise<LoginSlot> {
    return this.#exclusive(ip, async () => {
      const pending = this.#inFlight.get(ip) ?? 0;
      await this.core.loginAttempt.check({ ip, pending });
      this.#inFlight.set(ip, pending + 1);
      return this.#slot(ip);
    });
  }

  #slot(ip: string): LoginSlot {
    let finished = false;
    return {
      finish: (failed: boolean) => {
        if (finished) return Promise.resolve();
        finished = true;
        return this.#exclusive(ip, async () => {
          try {
            if (failed) {
              await this.core.dispatch({
                type: "loginAttempt:recordFailure",
                body: { ip },
              });
            }
          } finally {
            const remaining = (this.#inFlight.get(ip) ?? 1) - 1;
            if (remaining > 0) this.#inFlight.set(ip, remaining);
            else this.#inFlight.delete(ip);
          }
        });
      },
    };
  }
}
