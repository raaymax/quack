import { assertEquals, assertRejects } from "@std/assert";
import type { Core } from "../../../core/mod.ts";
import { TooManyLoginAttempts } from "../errors.ts";
import { LoginLimiter } from "../loginLimiter.ts";

const fakeCore = (maxFailuresPerIp: number) => {
  const failures: { ip: string; at: Date }[] = [];
  const reads: { resolve: () => void }[] = [];
  let holdReads = false;
  const core = {
    config: { loginRateLimit: { windowMinutes: 15, maxFailuresPerIp } },
    dispatch: ({ body }: { body: { ip: string } }) => {
      failures.push({ ip: body.ip, at: new Date() });
      return Promise.resolve();
    },
    loginAttempt: {
      getRecentFailures: ({ ip, limit }: { ip: string; limit: number }) => {
        const snapshot = failures.filter((f) => f.ip === ip).map((f) => f.at)
          .slice(-limit).reverse();
        if (!holdReads) return Promise.resolve(snapshot);
        return new Promise<Date[]>((resolve) =>
          reads.push({ resolve: () => resolve(snapshot) })
        );
      },
    },
  };
  return {
    limiter: new LoginLimiter(core as unknown as Core),
    failures,
    holdReads: (value: boolean) => holdReads = value,
    releaseReads: () => reads.splice(0).forEach((read) => read.resolve()),
  };
};

Deno.test("LoginLimiter - a failure recorded during a slow read still counts", async () => {
  const fake = fakeCore(1);
  const limiter = fake.limiter;

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
  const fake = fakeCore(3);
  const limiter = fake.limiter;

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
  const fake = fakeCore(1);
  const limiter = fake.limiter;

  for (let i = 0; i < 5; i++) {
    const slot = await limiter.acquire("ip");
    await slot.finish(false);
  }
  const other = await limiter.acquire("other-ip");
  await other.finish(true);
  await assertRejects(() => limiter.acquire("other-ip"), TooManyLoginAttempts);
  await (await limiter.acquire("ip")).finish(false);
});
