import { assertEquals, assertRejects } from "@std/assert";
import type { Config } from "@quack/config";
import type { Repository, storage } from "../../../infra/mod.ts";
import { Core } from "../../core.ts";
import { TooManyLoginAttempts } from "../../errors.ts";
import { LoginLimiter } from "../limiter.ts";

const fakeRepo = () => {
  const failures: { ip: string; at: Date }[] = [];
  const reads: { snapshot: Date[]; resolve: () => void }[] = [];
  let holdReads = false;
  const loginAttempt = {
    recordFailure: (ip: string) => {
      failures.push({ ip, at: new Date() });
      return Promise.resolve();
    },
    recentFailureTimes: (ip: string, _since: Date, limit: number) => {
      const snapshot = failures.filter((f) => f.ip === ip).map((f) => f.at)
        .slice(-limit).reverse();
      if (!holdReads) return Promise.resolve(snapshot);
      return new Promise<Date[]>((resolve) =>
        reads.push({ snapshot, resolve: () => resolve(snapshot) })
      );
    },
  };
  return {
    repo: {
      loginAttempt,
      db: { withTransaction: <T>(fn: () => Promise<T>) => fn() },
    } as unknown as Repository,
    failures,
    holdReads: (value: boolean) => holdReads = value,
    releaseReads: () => reads.splice(0).forEach((read) => read.resolve()),
  };
};

const limiterFor = (repo: Repository, maxFailuresPerIp: number) =>
  new LoginLimiter(
    new Core({
      config: {
        loginRateLimit: { windowMinutes: 15, maxFailuresPerIp },
      } as Config,
      repo,
      fileStorage: {} as storage.Storage,
    }),
  );

Deno.test("LoginLimiter - a failure recorded during a slow read still counts", async () => {
  const fake = fakeRepo();
  const limiter = limiterFor(fake.repo, 1);

  const first = await limiter.acquire("ip");
  fake.holdReads(true);
  const second = limiter.acquire("ip");
  const finished = first.finish(true);
  await new Promise((resolve) => setTimeout(resolve, 0));
  fake.releaseReads();
  fake.holdReads(false);

  await assertRejects(() => second, TooManyLoginAttempts);
  await finished;
  assertEquals(fake.failures.length, 1);
  await assertRejects(() => limiter.acquire("ip"), TooManyLoginAttempts);
});

Deno.test("LoginLimiter - parallel attempts cannot exceed the limit", async () => {
  const fake = fakeRepo();
  const limiter = limiterFor(fake.repo, 3);

  const results = await Promise.allSettled(
    Array.from({ length: 8 }, async () => {
      const slot = await limiter.acquire("ip");
      await slot.finish(true);
    }),
  );

  assertEquals(results.filter((r) => r.status === "fulfilled").length, 3);
  assertEquals(fake.failures.length, 3);
});

Deno.test("LoginLimiter - successful attempts release their slot", async () => {
  const fake = fakeRepo();
  const limiter = limiterFor(fake.repo, 1);

  for (let i = 0; i < 5; i++) {
    const slot = await limiter.acquire("ip");
    await slot.finish(false);
  }
  const other = await limiter.acquire("other-ip");
  await other.finish(true);
  await assertRejects(() => limiter.acquire("other-ip"), TooManyLoginAttempts);
  await (await limiter.acquire("ip")).finish(false);
});
