import * as v from "valibot";
import { createQuery } from "../query.ts";
import { TooManyLoginAttempts } from "../errors.ts";
import { loginRateLimit, normalizeEmail } from "./limits.ts";

export default createQuery({
  type: "loginAttempt:check",
  body: v.object({
    email: v.string(),
    ip: v.string(),
  }),
}, async ({ email, ip }, { repo, config }) => {
  const limits = loginRateLimit(config);
  const windowMs = limits.windowMinutes * 60 * 1000;
  const now = Date.now();
  const windowStart = new Date(now - windowMs);
  const normalized = normalizeEmail(email);
  const lastSuccess = await repo.loginAttempt.lastSuccessAt(normalized);
  const emailSince = lastSuccess && lastSuccess > windowStart
    ? lastSuccess
    : windowStart;

  const [ipFailures, emailFailures] = await Promise.all([
    repo.loginAttempt.recentFailureTimes(
      { ip },
      windowStart,
      limits.maxFailuresPerIp,
    ),
    repo.loginAttempt.recentFailureTimes(
      { email: normalized },
      emailSince,
      limits.maxFailuresPerEmail,
    ),
  ]);

  const releases = [
    ipFailures.length >= limits.maxFailuresPerIp ? ipFailures.at(-1) : null,
    emailFailures.length >= limits.maxFailuresPerEmail
      ? emailFailures.at(-1)
      : null,
  ].filter((date): date is Date => !!date)
    .map((date) => date.getTime() + windowMs);

  if (releases.length === 0) return;
  const retryAfter = Math.max(
    1,
    Math.ceil((Math.max(...releases) - now) / 1000),
  );
  throw new TooManyLoginAttempts(retryAfter);
});
