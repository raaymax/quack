import * as v from "valibot";
import { createCommand } from "../command.ts";

export default createCommand({
  type: "loginAttempt:recordFailure",
  body: v.object({
    ip: v.string(),
  }),
}, async ({ ip }, { repo }) => {
  await repo.loginAttempt.recordFailure(ip);
});
