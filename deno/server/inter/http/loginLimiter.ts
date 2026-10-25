import type { Core } from "../../core/mod.ts";
import { TooManyLoginAttempts } from "./errors.ts";

export const DEFAULT_LOGIN_RATE_LIMIT = {
  windowMinutes: 15,
  maxFailuresPerIp: 10,
};

export type LoginSlot = {
  finish(failed: boolean): Promise<void>;
};

const tooManyAttempts = (retryAfter: number) => {
  const minutes = Math.ceil(retryAfter / 60);
  return new TooManyLoginAttempts({
    message: `Too many failed login attempts. Try again in ${minutes} ${
      minutes === 1 ? "minute" : "minutes"
    }`,
    retryAfter,
  });
};

export class LoginLimiter {
  #inFlight = new Map<string, number>();
  #queues = new Map<string, Promise<unknown>>();

  constructor(private core: Core) {}

  get #limits() {
    return { ...DEFAULT_LOGIN_RATE_LIMIT, ...this.core.config.loginRateLimit };
  }

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
      const { windowMinutes, maxFailuresPerIp } = this.#limits;
      const windowMs = windowMinutes * 60 * 1000;
      const now = Date.now();
      const failures = await this.core.loginAttempt.getRecentFailures({
        ip,
        since: new Date(now - windowMs),
        limit: maxFailuresPerIp,
      });
      const inFlight = this.#inFlight.get(ip) ?? 0;
      if (failures.length + inFlight >= maxFailuresPerIp) {
        const oldest = failures.length >= maxFailuresPerIp
          ? failures[failures.length - 1].getTime()
          : now;
        throw tooManyAttempts(
          Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
        );
      }
      this.#inFlight.set(ip, inFlight + 1);
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
