import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { createApp } from "../routes/__tests__/app.ts";
import { ensureUser } from "../routes/__tests__/users.ts";
import * as enc from "@quack/encryption";

Deno.env.set("ENV_TYPE", "test");

const { app, repo, core } = createApp();

const send = async (
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body?: string,
) => {
  const res = await app.handle(
    new Request(`http://localhost${url}`, {
      method,
      headers: { "x-forwarded-for": "203.0.113.9", ...headers },
      body,
    }),
  );
  await res.body?.cancel();
  return res;
};

const accessLog = async (fn: () => Promise<unknown>) => {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => lines.push(args.join(" "));
  try {
    await fn();
  } finally {
    console.log = original;
  }
  return lines.filter((line) => line.startsWith('{"kind":"req"'))
    .map((line) => JSON.parse(line));
};

Deno.test("Anonymous access log", async (t) => {
  await t.step("logs probes like an nginx access log", async () => {
    const [entry, ...rest] = await accessLog(() =>
      send("GET", "/wp-login.php?redirect=1", {
        referer: "https://evil.example/",
        "user-agent": "probe/1.0",
        "sec-fetch-dest": "document",
        cookie: "token=stolen",
      })
    );
    assertEquals(rest, []);
    assert(!Number.isNaN(Date.parse(entry.time)));
    assert(typeof entry.rt === "number" && entry.rt >= 0);
    assertEquals(
      { ...entry, time: undefined, rt: undefined },
      {
        kind: "req",
        time: undefined,
        rt: undefined,
        ip: "203.0.113.9",
        method: "GET",
        path: "/wp-login.php",
        query: "?redirect=1",
        status: 404,
        ref: "https://evil.example/",
        ua: "probe/1.0",
        dest: "document",
        session: "invalid",
      },
    );
  });

  await t.step("logs non-GET probes and rejected API calls", async () => {
    const entries = await accessLog(async () => {
      await send("POST", "/admin/setup.php", {
        "content-type": "application/json",
      }, '{"cmd":"id"}');
      await send("GET", "/api/channels", { authorization: "Bearer guessed" });
    });
    assertEquals(entries.map((e) => [e.method, e.path, e.status, e.session]), [
      ["POST", "/admin/setup.php", 404, "none"],
      ["GET", "/api/channels", 401, "invalid"],
    ]);
    assert(!JSON.stringify(entries).includes("cmd"));
    assert(!JSON.stringify(entries).includes("guessed"));
  });

  await t.step("redacts tokens from paths and queries", async () => {
    const entries = await accessLog(async () => {
      await send("GET", "/api/users/token/abcdef");
      await send("GET", "/api/users/abcdef?token=abc&password=p&x=1");
    });
    assertEquals(entries.map((e) => e.path), [
      "/api/users/token/:token",
      "/api/users/:token",
    ]);
    assertEquals(entries[1].query, "?token=:redacted&password=:redacted&x=1");
    assert(!JSON.stringify(entries).includes("abc"));
  });

  await t.step("crafted input stays on one line", async () => {
    const lines: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => lines.push(args.join(" "));
    try {
      await send("GET", "/x%0A%7B%22kind%22%3A%22req%22%7D", {
        "user-agent": 'ua"\\ {"kind":"req"}',
      });
    } finally {
      console.log = original;
    }
    const logged = lines.filter((line) => line.includes('"kind":"req"'));
    assertEquals(logged.length, 1);
    assert(!logged[0].includes("\n"));
    assertEquals(JSON.parse(logged[0]).ua, 'ua"\\ {"kind":"req"}');
  });

  await t.step("skips requests with a valid session", async () => {
    await ensureUser(repo, "admin");
    const credentials = await enc.prepareCredentials("admin", "123");
    const login = await Agent.request(app).post("/api/auth/session")
      .json(credentials.login).expect(200);
    const { token } = await login.json();

    const entries = await accessLog(() =>
      send("GET", "/api/channels", { authorization: `Bearer ${token}` })
    );
    assertEquals(entries, []);
  });

  await t.step("writes only JSON lines", async () => {
    await ensureUser(repo, "admin");
    const credentials = await enc.prepareCredentials("admin", "123");
    const login = await Agent.request(app).post("/api/auth/session")
      .json(credentials.login).expect(200);
    const { token } = await login.json();

    const lines: string[] = [];
    const log = console.log;
    const warn = console.warn;
    console.log = (...args: unknown[]) => lines.push(args.join(" "));
    console.warn = (...args: unknown[]) => lines.push(args.join(" "));
    try {
      await send("GET", "/wp-login.php");
      await send("GET", "/api/channels", { authorization: `Bearer ${token}` });
    } finally {
      console.log = log;
      console.warn = warn;
    }
    assert(lines.length > 0);
    for (const line of lines) JSON.parse(line);
  });

  await core.close();
});
