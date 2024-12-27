import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { createApp } from "../../__tests__/app.ts";
import { ensureUser } from "../../__tests__/users.ts";
import * as enc from "@quack/encryption";

Deno.env.set("ENV_TYPE", "test");

const { app, repo, core } = createApp();

Deno.test("GET /auth/session - No session", async () => {
  const request = new Request("http://localhost/api/auth/session");
  const response = await app.handle(request);
  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    status: "no-session",
  });
});
Deno.test("POST /auth/session - wrong params", async () => {
  const res = await Agent.request(app)
    .post("/api/auth/session")
    .json({ asd: "" })
    .expect(400);

  const body = await res.json();
  assertEquals(
    body.errors?.map((e: any) => e?.params?.missingProperty).sort(),
    ["email", "password"],
  );
});

Deno.test("Login/logout", async (t) => {
  let token: any = null;
  let userId: any = null;
  let key: any = null;
  await ensureUser(repo, "admin");

  await t.step("POST /auth/session - Create session", async () => {
    const credentials = await enc.prepareCredentials("admin", "123");
    const res = await Agent.request(app)
      .post("/api/auth/session")
      .json(credentials.login)
      .expect(200);
    const body = await res.json();
    assert(body.userId);
    assert(body.token);
    assert(body.id);
    token = body.token;
    userId = body.userId;
    key = credentials.login.key;
    assert(
      res.headers.get("Set-Cookie")?.includes(`key=${credentials.login.key}`),
    );
    assert(
      /^token=.+; HttpOnly; Path=\/$/.test(
        res.headers.get("Set-Cookie")?.toString() ?? "",
      ),
      "Set-Cookie header is not correct",
    );
  });

  await t.step("GET /auth/session - Get session with bearer", async () => {
    const res = await Agent.request(app)
      .get("/api/auth/session")
      .header("Cookie", `key=${key}`)
      .header("Authorization", `Bearer ${token}`)
      .expect(200);
    const body = await res.json();
    assertEquals(body.userId, userId);
    assertEquals(body.token, token);
    assertEquals(body.key, key);
  });

  await t.step("DELETE /auth/session", async () => {
    await Agent.request(app)
      .delete("/api/auth/session")
      .json({})
      .header("Authorization", `Bearer ${token}`)
      .expect(204);
  });

  await t.step("GET /auth/session - no session after delete", async () => {
    const res = await Agent.request(app)
      .get("/api/auth/session")
      .header("Authorization", `Bearer ${token}`)
      .expect(200);
    const body = await res.json();
    assertEquals(body.status, "no-session");
  });

  core.close();
});

Deno.test("Login/logout - cookies", async (t) => {
  let token: any = null;
  let userId: any = null;

  await t.step("POST /auth/session - Create session", async () => {
    const credentials = await enc.prepareCredentials("admin", "123");
    const res = await Agent.request(app)
      .post("/api/auth/session")
      .json(credentials.login)
      .expect(200);
    const body = await res.json();
    assert(body.userId);
    assert(body.token);
    assert(body.id);
    token = body.token;
    userId = body.userId;
    assert(
      /^token=.+; HttpOnly; Path=\/$/.test(
        res.headers.get("Set-Cookie")?.toString() ?? "",
      ),
      "Set-Cookie header is not correct",
    );
  });

  await t.step("GET /auth/session - Get session with cookie", async () => {
    const res = await Agent.request(app)
      .get("/api/auth/session")
      .header("Cookie", `token=${token}`)
      .expect(200);
    const body = await res.json();
    assertEquals(body.userId, userId);
    assertEquals(body.token, token);
  });

  await t.step("DELETE /auth/session", async () => {
    await Agent.request(app)
      .delete("/api/auth/session")
      .json({})
      .header("Cookie", `token=${token}`)
      .expect(204);
  });

  await t.step("GET /auth/session - no session after delete", async () => {
    const res = await Agent.request(app)
      .get("/api/auth/session")
      .header("Cookie", `token=${token}`)
      .expect(200);
    const body = await res.json();
    assertEquals(body.status, "no-session");
  });

  core.close();
});
/*
Deno.test("Login/logout - cookiejar", async (t) => {
  let token: any = null;
  let userId: any = null;
  const agent = new Agent(app);

  await t.step('POST /session - Create session', async () => {
    const res = await agent.request()
      .post('/auth/session')
      .json({
        email: "admin",
        password: "pass123",
      })
      .expect(200);
    const body = await res.json();
    assert(body.userId);
    assert(body.token);
    assert(body.id);
    token = body.token;
    userId = body.userId;
    assert(/^token=.+; HttpOnly$/.test(res.headers.get('Set-Cookie')?.toString() ?? ""), 'Set-Cookie header is not correct');
  });

  await t.step('GET /session - Get session with cookie', async () => {
    const res = await agent.request()
      .get('/auth/session')
      .expect(200);
    const body = await res.json();
    assertEquals(body.userId, userId);
    assertEquals(body.token, token);
  });

  await t.step('DELETE /session', async () => {
    const res = await agent.request()
      .delete('/auth/session')
      .json({})
      .expect(200);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.status, 'ok');
  });

  await t.step('GET /session - no session after delete', async () => {
    const res = await agent.request()
      .get('/auth/session')
      .expect(200);
    const body = await res.json();
    assertEquals(body.status, 'no-session');
  });

  core.close();
})
*/
