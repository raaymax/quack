import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import * as bcrypt from "@ts-rex/bcrypt";
import { config, createApp } from "../../__tests__/app.ts";
import { ensureUser } from "../../__tests__/users.ts";
import * as enc from "@quack/encryption";

Deno.env.set("ENV_TYPE", "test");

const { app, repo, core } = createApp({
  ...config,
  loginRateLimit: { windowMinutes: 15, maxFailuresPerIp: 3 },
});

const unique = () => crypto.randomUUID().slice(0, 8);
const randomIp = () =>
  `2001:db8::${unique().slice(0, 4)}:${unique().slice(0, 4)}`;

const login = (body: Record<string, unknown>, ip: string, status: number) =>
  Agent.request(app)
    .post("/api/auth/session")
    .json(body)
    .header("X-Forwarded-For", ip)
    .header("User-Agent", "login-test")
    .expect(status);

const credentials = async (email: string) =>
  (await enc.prepareCredentials(email, "123")).login;

const captureLogs = async (fn: () => Promise<unknown>) => {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => lines.push(args.join(" "));
  try {
    await fn();
  } finally {
    console.log = original;
  }
  return lines.filter((line) => line.startsWith("{"))
    .map((line) => JSON.parse(line))
    .filter((entry) =>
      entry.kind === "login" || entry.kind === "password_reset"
    );
};

Deno.test("Login attempts", async (t) => {
  await t.step("logs one JSON line per attempt", async () => {
    const email = `log-${unique()}`;
    const ip = randomIp();
    await ensureUser(repo, email);

    const logs = await captureLogs(async () => {
      await login({ email, password: "wrong" }, ip, 401);
      await login(await credentials(email), ip, 200);
      await login({ email: 'evil"\n{"kind":"login"}', password: "x" }, ip, 401);
    });

    assertEquals(logs.map((l) => l.result), ["failure", "success", "failure"]);
    assertEquals(logs[0], {
      kind: "login",
      result: "failure",
      ip,
      ua: "login-test",
      email,
    });
    assertEquals(logs[2].email, 'evil"\n{"kind":"login"}');
    assert(!JSON.stringify(logs).includes("wrong"));
  });

  await t.step("blocks an ip after repeated failures", async () => {
    const ip = randomIp();
    const email = `valid-${unique()}`;
    await ensureUser(repo, email);

    for (let i = 0; i < 3; i++) {
      await login({ email: `guess-${unique()}`, password: "x" }, ip, 401);
    }
    const logs = await captureLogs(async () => {
      const res = await login(await credentials(email), ip, 429);
      const body = await res.json();
      assertEquals(body.errorCode, "TOO_MANY_LOGIN_ATTEMPTS");
      assert(body.retryAfter > 0 && body.retryAfter <= 15 * 60);
      assertEquals(res.headers.get("Retry-After"), String(body.retryAfter));
    });
    assertEquals(logs.map((l) => l.result), ["blocked"]);
    await login(await credentials(email), randomIp(), 200);
  });

  await t.step("failures for a known email do not lock it out", async () => {
    const email = `target-${unique()}`;
    await ensureUser(repo, email);
    for (let i = 0; i < 4; i++) {
      await login({ email, password: "wrong" }, randomIp(), 401);
    }
    await login(await credentials(email), randomIp(), 200);
  });

  await t.step("parallel attempts cannot exceed the limit", async () => {
    const ip = randomIp();
    const responses = await Promise.all(
      Array.from(
        { length: 8 },
        () =>
          Agent.request(app).post("/api/auth/session")
            .json({ email: `burst-${unique()}`, password: "x" })
            .header("X-Forwarded-For", ip),
      ),
    );
    const statuses = await Promise.all(
      responses.map(async (res) => {
        const r = await res;
        await r.body?.cancel();
        return r.status;
      }),
    );
    assertEquals(statuses.filter((s) => s === 401).length, 3);
    assertEquals(statuses.filter((s) => s === 429).length, 5);
  });

  await t.step("stores only failures as limiter state", async () => {
    const ip = randomIp();
    const email = `state-${unique()}`;
    await ensureUser(repo, email);
    await login({ email, password: "wrong" }, ip, 401);
    await login(await credentials(email), ip, 200);

    const { db } = await repo.db.connect();
    const rows = await db.collection("loginAttempts").find({ ip }).toArray();
    assertEquals(rows.length, 1);
    assertEquals(Object.keys(rows[0]).sort(), ["_id", "createdAt", "ip"]);
  });

  await t.step("logs password reset attempts", async () => {
    const email = `legacy-${unique()}`;
    await repo.user.create({ email, password: bcrypt.hash("old") });
    const ip = randomIp();
    const res = await login({ email, password: "anything" }, ip, 403);
    const { token } = await res.json();

    const data = await enc.prepareRegistration({ email, password: "new" });
    const reset = (oldPassword: string, status: number) =>
      Agent.request(app).put(`/api/auth/reset/${token}`)
        .json({ ...data, oldPassword })
        .header("X-Forwarded-For", ip)
        .expect(status);

    const logs = await captureLogs(async () => {
      await reset("wrong", 403);
      await reset("old", 200);
    });
    assertEquals(logs.map((l) => [l.kind, l.result]), [
      ["password_reset", "failure"],
      ["password_reset", "success"],
    ]);
  });

  await core.close();
});
