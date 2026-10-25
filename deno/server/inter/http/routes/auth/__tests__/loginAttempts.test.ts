import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { config, createApp } from "../../__tests__/app.ts";
import { ensureUser } from "../../__tests__/users.ts";
import * as enc from "@quack/encryption";

Deno.env.set("ENV_TYPE", "test");

const { app, repo, core } = createApp({
  ...config,
  loginRateLimit: {
    windowMinutes: 15,
    maxFailuresPerIp: 3,
    maxFailuresPerEmail: 2,
  },
});

const unique = () => crypto.randomUUID().slice(0, 8);
const randomIp = () =>
  `2001:db8::${unique().slice(0, 4)}:${unique().slice(0, 4)}`;

const login = (
  body: Record<string, unknown>,
  ip: string,
  status: number,
) =>
  Agent.request(app)
    .post("/api/auth/session")
    .json(body)
    .header("X-Forwarded-For", ip)
    .header("User-Agent", "login-test")
    .expect(status);

const credentials = async (email: string) =>
  (await enc.prepareCredentials(email, "123")).login;

const attempts = async (query: Record<string, unknown>) => {
  const { db } = await repo.db.connect();
  return db.collection("loginAttempts").find(query).sort({ createdAt: 1 })
    .toArray();
};

Deno.test("Login attempts", async (t) => {
  await t.step("records outcome, client ip and account", async () => {
    const email = `attempts-${unique()}`;
    const ip = randomIp();
    await ensureUser(repo, email);

    await login({ email, password: "wrong" }, ip, 401);
    await login(await credentials(email), ip, 200);
    await login({ email: `nobody-${unique()}`, password: "x" }, ip, 401);

    const rows = await attempts({ ip });
    assertEquals(rows.map((r) => r.outcome), ["failure", "success", "failure"]);
    assertEquals(rows[0].email, email);
    assertEquals(rows[0].userAgent, "login-test");
    assert(rows[0].userId, "known account is linked");
    assertEquals(rows[2].userId, undefined);
  });

  await t.step("locks an account after repeated failures", async () => {
    const email = `locked-${unique()}`;
    await ensureUser(repo, email);

    await login({ email, password: "wrong" }, randomIp(), 401);
    await login({ email, password: "wrong" }, randomIp(), 401);
    const res = await login(await credentials(email), randomIp(), 429);

    const body = await res.json();
    assertEquals(body.errorCode, "TOO_MANY_LOGIN_ATTEMPTS");
    assert(body.retryAfter > 0 && body.retryAfter <= 15 * 60);
    assertEquals(res.headers.get("Retry-After"), String(body.retryAfter));
    const blocked = await attempts({ email, outcome: "blocked" });
    assertEquals(blocked.length, 1);
  });

  await t.step("blocks an ip that guesses many accounts", async () => {
    const ip = randomIp();
    const email = `valid-${unique()}`;
    await ensureUser(repo, email);

    for (let i = 0; i < 3; i++) {
      await login({ email: `guess-${unique()}`, password: "x" }, ip, 401);
    }
    await login(await credentials(email), ip, 429);
    await login(await credentials(email), ip, 429);
    await login(await credentials(email), randomIp(), 200);

    const [blocked] = await attempts({ ip, outcome: "blocked" });
    assertEquals(blocked.count, 2);
  });

  await t.step("successful login clears account failures", async () => {
    const email = `recovers-${unique()}`;
    const ip = randomIp();
    await ensureUser(repo, email);

    await login({ email, password: "wrong" }, ip, 401);
    await login(await credentials(email), ip, 200);
    await login({ email, password: "wrong" }, ip, 401);
    await login(await credentials(email), ip, 200);
  });

  await t.step("stats summarize suspicious activity", async () => {
    const ip = randomIp();
    const email = `stats-${unique()}`;
    const unknown = `ghost-${unique()}`;
    await ensureUser(repo, email);
    const since = new Date(Date.now() - 1000);

    await login({ email, password: "wrong" }, ip, 401);
    await login({ email: unknown, password: "x" }, ip, 401);
    await login({ email: unknown, password: "x" }, ip, 401);
    await login(await credentials(email), ip, 429);

    const stats = await repo.loginAttempt.stats(since, 1000);
    const ipRow = stats.ips.find((row) => row.ip === ip);
    assertEquals(ipRow?.failures, 3);
    assertEquals(ipRow?.blocked, 1);
    assertEquals(ipRow?.emails.sort(), [email, unknown].sort());
    assertEquals(
      stats.unknownEmails.find((row) => row.email === unknown)?.attempts,
      2,
    );
    assertEquals(
      stats.targetedAccounts.find((row) => row.email === email)?.failures,
      1,
    );
    assert((stats.outcomes.failure ?? 0) >= 3);
  });

  await core.close();
});
