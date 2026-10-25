import * as v from "valibot";
import { createCommand } from "../command.ts";
import { normalizeEmail } from "./limits.ts";

const BLOCKED_BUCKET_MS = 60 * 60 * 1000;

export default createCommand({
  type: "loginAttempt:record",
  body: v.object({
    email: v.string(),
    ip: v.string(),
    userAgent: v.optional(v.string()),
    outcome: v.picklist(["success", "failure", "blocked", "reset_required"]),
  }),
}, async ({ email, ip, userAgent, outcome }, { repo }) => {
  const attempt = {
    email: normalizeEmail(email),
    ip,
    userAgent: userAgent?.slice(0, 512),
  };
  const line = `[auth] login ${outcome} ip=${ip} email=${
    JSON.stringify(attempt.email)
  }`;
  if (outcome === "success") console.log(line);
  else console.warn(line);

  if (outcome === "blocked") {
    const now = Date.now();
    const bucket = new Date(now - (now % BLOCKED_BUCKET_MS));
    await repo.loginAttempt.recordBlocked(attempt, bucket);
    return;
  }

  const user = await repo.user.get({ email });
  const now = new Date();
  await repo.loginAttempt.create({
    ...attempt,
    ...(user ? { userId: user.id } : {}),
    outcome,
    count: 1,
    createdAt: now,
    lastAttemptAt: now,
  });
});
