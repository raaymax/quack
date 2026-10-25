import type { LoginOutcome } from "../../types.ts";

export type AuthLogEntry = {
  kind: "login" | "password_reset";
  result: LoginOutcome;
  ip: string;
  ua?: string;
  email?: string;
};

export const logAuthAttempt = ({ kind, result, ip, ua, email }: AuthLogEntry) =>
  console.log(JSON.stringify({
    kind,
    result,
    ip,
    ua: ua?.slice(0, 512),
    email: email?.slice(0, 254),
  }));
