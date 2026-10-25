import * as v from "valibot";
import { createQuery } from "../query.ts";
import { TooManyLoginAttempts } from "../errors.ts";
import { loginRateLimit } from "./limits.ts";

export default createQuery({
  type: "loginAttempt:check",
  body: v.object({
    ip: v.string(),
    pending: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
  }),
}, async ({ ip, pending }, { repo, config }) => {
  const { windowMinutes, maxFailuresPerIp } = loginRateLimit(config);
  const windowMs = windowMinutes * 60 * 1000;
  const now = Date.now();
  const failures = await repo.loginAttempt.recentFailureTimes(
    ip,
    new Date(now - windowMs),
    maxFailuresPerIp,
  );
  if (failures.length + pending < maxFailuresPerIp) return;
  const oldest = failures.length >= maxFailuresPerIp
    ? failures[failures.length - 1].getTime()
    : now;
  throw new TooManyLoginAttempts(
    Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
  );
});
