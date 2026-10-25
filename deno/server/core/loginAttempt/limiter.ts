import type { Config } from "@quack/config";
import type { Repository } from "../../infra/mod.ts";
import { TooManyLoginAttempts } from "../errors.ts";
import { loginRateLimit } from "./limits.ts";

export type LoginSlot = {
  finish(failed: boolean): Promise<void>;
};

export class LoginLimiter {
  #inFlight = new Map<string, number>();

  constructor(private repo: Repository, private config: Config) {}

  async acquire(ip: string): Promise<LoginSlot> {
    const { windowMinutes, maxFailuresPerIp } = loginRateLimit(this.config);
    const windowMs = windowMinutes * 60 * 1000;
    const now = Date.now();
    const failures = await this.repo.loginAttempt.recentFailureTimes(
      ip,
      new Date(now - windowMs),
      maxFailuresPerIp,
    );
    const inFlight = this.#inFlight.get(ip) ?? 0;
    if (failures.length + inFlight >= maxFailuresPerIp) {
      const oldest = failures.length >= maxFailuresPerIp
        ? failures[failures.length - 1].getTime()
        : now;
      throw new TooManyLoginAttempts(
        Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
      );
    }
    this.#inFlight.set(ip, inFlight + 1);

    let finished = false;
    return {
      finish: async (failed: boolean) => {
        if (finished) return;
        finished = true;
        try {
          if (failed) await this.repo.loginAttempt.recordFailure(ip);
        } finally {
          const remaining = (this.#inFlight.get(ip) ?? 1) - 1;
          if (remaining > 0) this.#inFlight.set(ip, remaining);
          else this.#inFlight.delete(ip);
        }
      },
    };
  }
}
