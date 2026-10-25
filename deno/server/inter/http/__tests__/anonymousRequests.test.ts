import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { config, createApp } from "../routes/__tests__/app.ts";
import { ensureUser } from "../routes/__tests__/users.ts";
import * as enc from "@quack/encryption";

Deno.env.set("ENV_TYPE", "test");

const { app, repo, core } = createApp({
  ...config,
  anonymousRequestLog: { enabled: true },
});

const randomIp = () => `2001:db8:1::${crypto.randomUUID().slice(0, 4)}`;

const send = (
  method: string,
  url: string,
  ip: string,
  init: { headers?: Record<string, string>; body?: string } = {},
) =>
  app.handle(
    new Request(`http://localhost${url}`, {
      method,
      headers: {
        "x-forwarded-for": ip,
        "user-agent": "probe/1.0",
        ...init.headers,
      },
      body: init.body,
    }),
  );

const recorded = async (ip: string) => {
  await core.anonymousRequests.flush();
  return await repo.anonymousRequest.getAll({ ip });
};

Deno.test("Anonymous requests", async (t) => {
  await t.step("records probes with client details", async () => {
    const ip = randomIp();
    const res = await send("GET", "/wp-login.php?redirect=1", ip, {
      headers: {
        referer: "https://evil.example/",
        "accept-language": "pl-PL",
        cookie: "token=stolen; theme=dark",
      },
    });
    assertEquals(res.status, 404);
    await res.body?.cancel();

    const [entry] = await recorded(ip);
    assertEquals(entry.method, "GET");
    assertEquals(entry.path, "/wp-login.php");
    assertEquals(entry.query, "?redirect=1");
    assertEquals(entry.status, 404);
    assertEquals(entry.session, "invalid");
    assertEquals(entry.userAgent, "probe/1.0");
    assertEquals(entry.referer, "https://evil.example/");
    assertEquals(entry.acceptLanguage, "pl-PL");
    assertEquals(entry.forwardedFor, ip);
    assertEquals(entry.headers.cookie, "token=:redacted; theme=:redacted");
  });

  await t.step("records unknown non-GET routes with body sample", async () => {
    const ip = randomIp();
    const res = await send("POST", "/admin/setup.php", ip, {
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cmd: "id" }),
    });
    assertEquals(res.status, 404);
    await res.body?.cancel();

    const [entry] = await recorded(ip);
    assertEquals(entry.method, "POST");
    assertEquals(entry.session, "none");
    assertEquals(entry.body, '{"cmd":"id"}');
    assertEquals(entry.contentType, "application/json");
  });

  await t.step("records rejected API calls without secrets", async () => {
    const ip = randomIp();
    const responses = await Promise.all([
      send("GET", "/api/channels", ip, {
        headers: { authorization: "Bearer guessed" },
      }),
      send("POST", "/api/auth/session", ip, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "x", password: "secret" }),
      }),
      send("GET", "/api/users/token/abcdef", ip),
      send("GET", "/api/auth/reset/abcdef?token=abc&x=1", ip),
    ]);
    for (const res of responses) await res.body?.cancel();

    const entries = await recorded(ip);
    const byPath = Object.fromEntries(entries.map((e) => [e.path, e]));
    assertEquals(byPath["/api/channels"].status, 401);
    assertEquals(byPath["/api/channels"].errorCode, "ACCESS_DENIED");
    assertEquals(
      byPath["/api/channels"].headers.authorization,
      ":redacted[14]",
    );
    assertEquals(byPath["/api/auth/session"].body, undefined);
    assert(byPath["/api/users/token/:token"]);
    assertEquals(
      byPath["/api/auth/reset/:token"].query,
      "?token=:redacted&x=1",
    );
    assert(!JSON.stringify(entries).includes("abcdef"));
    assert(!JSON.stringify(entries).includes("secret"));
  });

  await t.step("ignores requests with a valid session", async () => {
    const ip = randomIp();
    await ensureUser(repo, "admin");
    const credentials = await enc.prepareCredentials("admin", "123");
    const login = await Agent.request(app).post("/api/auth/session")
      .json(credentials.login).expect(200);
    const { token } = await login.json();

    const res = await send("GET", "/api/channels", ip, {
      headers: { authorization: `Bearer ${token}` },
    });
    assertEquals(res.status, 200);
    await res.body?.cancel();
    assertEquals(await recorded(ip), []);
  });

  await t.step("summarizes traffic", async () => {
    const ip = randomIp();
    const since = new Date(Date.now() - 1000);
    for (const path of ["/.env", "/.env", "/.git/config"]) {
      const res = await send("GET", path, ip);
      await res.body?.cancel();
    }
    await core.anonymousRequests.flush();

    const stats = await repo.anonymousRequest.stats(since, 1000);
    const row = stats.ips.find((r) => r.ip === ip);
    assertEquals(row?.requests, 3);
    assertEquals(row?.notFound, 3);
    assertEquals(row?.paths, 2);
    assert(stats.notFoundPaths.some((p) => p.path === "/.env"));
  });

  await core.close();
});
