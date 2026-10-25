import type { Config } from "@quack/config";

export const DEFAULT_LOGIN_RATE_LIMIT = {
  windowMinutes: 15,
  maxFailuresPerIp: 10,
};

export type LoginRateLimit = typeof DEFAULT_LOGIN_RATE_LIMIT;

export const loginRateLimit = (config: Config): LoginRateLimit => ({
  ...DEFAULT_LOGIN_RATE_LIMIT,
  ...config.loginRateLimit,
});
