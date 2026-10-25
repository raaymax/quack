import * as v from "valibot";
import { createQuery } from "../query.ts";

export default createQuery(
  {
    type: "loginAttempt:getRecentFailures",
    body: v.object({
      ip: v.string(),
      since: v.date(),
      limit: v.pipe(v.number(), v.integer(), v.minValue(1)),
    }),
  },
  async ({ ip, since, limit }, { repo }) =>
    await repo.loginAttempt.recentFailureTimes(ip, since, limit),
);
