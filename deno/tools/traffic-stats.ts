#!/usr/bin/env -S deno run -A
import config from "@quack/config/load";
import { Repository } from "../server/infra/mod.ts";

const option = (name: string, fallback: string) =>
  Deno.args.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1] ??
    fallback;
const hours = Number(option("hours", "24"));
const limit = Number(option("limit", "10"));
const ip = option("ip", "");
const json = Deno.args.includes("--json");
if (!(hours > 0) || !(limit > 0)) {
  console.error(
    "usage: deno task security:traffic [--hours=24] [--limit=10] [--ip=<ip>] [--json]",
  );
  Deno.exit(2);
}

const repo = new Repository(config);
const since = new Date(Date.now() - hours * 60 * 60 * 1000);
const time = (date: Date) =>
  new Date(date).toISOString().replace(/\.\d+Z$/, "Z");

if (ip) {
  const requests = (await repo.anonymousRequest.getAll({ ip }))
    .filter((request) => new Date(request.createdAt) >= since);
  await repo.close();
  if (json) {
    console.log(JSON.stringify(requests, null, 2));
  } else {
    console.log(`${requests.length} requests from ${ip} since ${time(since)}`);
    for (const r of requests) {
      console.log(
        `${time(r.createdAt)}  ${r.status} ${r.method} ${r.path}${
          r.query ?? ""
        }  session=${r.session}  ua=${JSON.stringify(r.userAgent ?? "")}${
          r.referer ? `  referer=${r.referer}` : ""
        }${r.body ? `\n    body: ${JSON.stringify(r.body)}` : ""}`,
      );
    }
  }
  Deno.exit(0);
}

const stats = await repo.anonymousRequest.stats(since, limit);
await repo.close();

if (json) {
  console.log(JSON.stringify(stats, null, 2));
  Deno.exit(0);
}

const record = (values: Record<string, number>) =>
  Object.entries(values).sort((a, b) => b[1] - a[1])
    .map(([key, count]) => `${key}=${count}`).join("  ") || "none";
const section = (title: string, rows: string[]) => {
  console.log(`\n${title}`);
  console.log(
    rows.length ? rows.map((row) => `  ${row}`).join("\n") : "  none",
  );
};

console.log(
  `requests without a valid session since ${time(since)} (last ${hours}h)`,
);
console.log(`  total: ${stats.total}  unique IPs: ${stats.uniqueIps}`);
console.log(`  status:  ${record(stats.statuses)}`);
console.log(`  method:  ${record(stats.methods)}`);
console.log(`  session: ${record(stats.sessions)}`);

section(
  "top IPs",
  stats.ips.map((row) =>
    `${row.ip}  requests=${row.requests} 404=${row.notFound} 401=${row.unauthorized} paths=${row.paths}  ${
      time(row.firstSeenAt)
    } → ${time(row.lastSeenAt)}  ua: ${
      row.userAgents.map((ua) => JSON.stringify(ua)).join(", ")
    }`
  ),
);
section(
  "top 404 paths",
  stats.notFoundPaths.map((row) =>
    `${row.path}  requests=${row.requests} ips=${row.ips} last=${
      time(row.lastSeenAt)
    }`
  ),
);
section(
  "top user agents",
  stats.userAgents.map((row) =>
    `${JSON.stringify(row.userAgent)}  requests=${row.requests} ips=${row.ips}`
  ),
);
section(
  "top referers",
  stats.referers.map((row) => `${row.referer}  requests=${row.requests}`),
);
section(
  "recent requests with a body",
  stats.withBody.map((row) =>
    `${
      time(row.createdAt)
    }  ${row.ip}  ${row.status} ${row.method} ${row.path}\n    ${
      JSON.stringify(row.body)
    }`
  ),
);
console.log(
  `\ndetails for one IP: deno task security:traffic --ip=<ip> --hours=${hours}`,
);
