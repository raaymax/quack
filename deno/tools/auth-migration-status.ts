#!/usr/bin/env -S deno run -A
import config from "@quack/config/load";
import { Repository } from "../server/infra/mod.ts";

const repo = new Repository(config);
const users = await repo.user.getAll({});
const accounts = users.filter((u) => !u.system);
const unmigrated = accounts.filter((u) => u.secrets?.password?.kdf !== "v2");
const systemCount = users.length - accounts.length;

console.log(
  `auth kdf migration: ${
    accounts.length - unmigrated.length
  }/${accounts.length} migrated` +
    (systemCount > 0 ? ` (${systemCount} system accounts excluded)` : ""),
);
if (unmigrated.length > 0) {
  console.log("unmigrated accounts:");
  for (const u of unmigrated) {
    console.log(`  - ${u.email}`);
  }
}

await repo.close();
Deno.exit(unmigrated.length > 0 ? 1 : 0);
