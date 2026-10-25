#!/usr/bin/env -S deno run -A
import config from "@quack/config/load";
import { Repository } from "../server/infra/mod.ts";

const option = (name: string, fallback: string) =>
  Deno.args.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1] ??
    fallback;
const hours = Number(option("hours", "24"));
const limit = Number(option("limit", "10"));
const json = Deno.args.includes("--json");
if (!(hours > 0) || !(limit > 0)) {
  console.error(
    "usage: deno task auth:logins [--hours=24] [--limit=10] [--json]",
  );
  Deno.exit(2);
}

const repo = new Repository(config);
const since = new Date(Date.now() - hours * 60 * 60 * 1000);
const stats = await repo.loginAttempt.stats(since, limit);
await repo.close();

if (json) {
  console.log(JSON.stringify(stats, null, 2));
  Deno.exit(0);
}

const time = (date: Date) =>
  new Date(date).toISOString().replace(/\.\d+Z$/, "Z");
const list = (values: string[]) => values.join(", ");
const section = (title: string, rows: string[]) => {
  console.log(`\n${title}`);
  console.log(
    rows.length ? rows.map((row) => `  ${row}`).join("\n") : "  none",
  );
};
const count = (outcome: string) => stats.outcomes[outcome] ?? 0;

console.log(`login attempts since ${time(since)} (last ${hours}h)`);
console.log(
  `  success: ${count("success")}  failed: ${count("failure")}  blocked: ${
    count("blocked")
  }  reset required: ${count("reset_required")}`,
);

section(
  "top failing IPs",
  stats.ips.map((row) =>
    `${row.ip}  failed=${row.failures} blocked=${row.blocked} last=${
      time(row.lastAttemptAt)
    }  emails: ${list(row.emails)}`
  ),
);
section(
  "attacked accounts",
  stats.targetedAccounts.map((row) =>
    `${row.email}  failed=${row.failures} last=${
      time(row.lastAttemptAt)
    }  ips: ${list(row.ips)}`
  ),
);
section(
  "unknown emails tried",
  stats.unknownEmails.map((row) =>
    `${row.email}  attempts=${row.attempts} last=${
      time(row.lastAttemptAt)
    }  ips: ${list(row.ips)}`
  ),
);
section(
  "successful logins",
  stats.successes.map((row) =>
    `${row.email}  logins=${row.logins} last=${time(row.lastAttemptAt)}  ips: ${
      list(row.ips)
    }`
  ),
);
section(
  "recent failures",
  stats.recent.map((row) =>
    `${time(row.lastAttemptAt ?? row.createdAt)}  ${row.outcome}${
      row.count > 1 ? ` x${row.count}` : ""
    }  ${row.ip}  ${row.email}  ${row.userAgent ?? ""}`.trimEnd()
  ),
);
