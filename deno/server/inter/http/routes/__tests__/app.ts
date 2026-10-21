import * as Config from "@quack/config";
import { HttpInterface } from "../../mod.ts";
import { Core } from "../../../../core/mod.ts";
import { Repository } from "../../../../infra/mod.ts";
import { EntityId } from "../../../../types.ts";
import { ensureUser } from "./users.ts";

const __dirname = new URL(".", import.meta.url).pathname;
export const config = await Config.from(`${__dirname}chat.config.ts`);

const TARGET = Deno.env.get("QUACK_TEST_TARGET");
export const isRemote = Boolean(TARGET);

const remoteApp = (target: string, onClose: Array<() => Promise<void>>) => {
  const base = new URL(target);
  const forward = async (req: Request) => {
    const url = new URL(req.url);
    url.protocol = base.protocol;
    url.host = base.host;
    const res = await fetch(new Request(url, req));
    if (res.headers.get("content-type")?.startsWith("text/event-stream")) {
      return res;
    }
    const body = res.status === 204 ? null : await res.arrayBuffer();
    return new Response(body, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  };
  return {
    handle: forward,
    serve: () =>
      Promise.resolve({
        addr: {
          transport: "tcp",
          hostname: base.hostname,
          port: Number(base.port || 80),
        },
      }),
    onClose: (fn: () => Promise<void>) => onClose.push(fn),
    close: async () => {
      for (const fn of onClose) await fn();
    },
  } as unknown as HttpInterface;
};

const remoteCore = (target: string, core: Core, repo: Repository): Core => {
  const tokens = new Map<string, string>();
  const tokenFor = async (userId?: string | EntityId) => {
    let id = userId ? EntityId.from(userId) : null;
    if (!id) {
      await ensureUser(repo, "remote-storage");
      id = (await repo.user.get({ email: "remote-storage" }))!.id;
    }
    const key = id.toString();
    if (!tokens.has(key)) {
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      const sessionId = await repo.session.create({ userId: id, expires });
      tokens.set(key, (await repo.session.get({ id: sessionId }))!.token);
    }
    return tokens.get(key)!;
  };
  const call = async (path: string, init: RequestInit, userId?: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${await tokenFor(userId)}`);
    return await fetch(new URL(path, target), { ...init, headers });
  };
  const json = async (res: Response) => {
    if (!res.ok) {
      await res.body?.cancel();
      throw new Error(`remote call failed with ${res.status}`);
    }
    return await res.json();
  };
  const storage = {
    exists: async (id: string) => {
      const res = await call(`/api/files/${id}`, {});
      await res.body?.cancel();
      return res.status === 200;
    },
    upload: async (
      stream: ReadableStream<Uint8Array>,
      opts: { filename: string; contentType: string },
    ) => {
      const body = await new Response(stream).arrayBuffer();
      const res = await call("/api/files", {
        method: "POST",
        body,
        headers: {
          "Content-Type": opts.contentType,
          "Content-Disposition": `attachment; filename="${opts.filename}"`,
        },
      });
      return (await json(res)).id;
    },
  };
  const file = {
    getChannel: async (q: { userId: string; channelId: string }) =>
      await json(
        await call(`/api/channels/${q.channelId}/files`, {}, q.userId),
      ),
  };
  const message = {
    get: async (q: { userId: string; messageId: string }) =>
      await json(await call(`/api/messages/${q.messageId}`, {}, q.userId)),
  };
  // deno-lint-ignore no-explicit-any
  const dispatch = (cmd: { type: string; body: any }) => {
    const run = async () => {
      if (cmd.type !== "file:register") {
        throw new Error(`${cmd.type} is not available against a remote server`);
      }
      const b = cmd.body;
      return await repo.file.create({
        storageId: b.storageId,
        channelId: EntityId.from(b.channelId),
        userId: EntityId.from(b.userId),
        fileName: b.fileName,
        contentType: b.contentType ?? "application/octet-stream",
        size: b.size ?? null,
        resolution: b.resolution ?? null,
        status: "draft",
        messageId: null,
        createdAt: new Date(),
      });
    };
    const promise = run();
    return Object.assign(promise, { internal: () => promise });
  };
  return new Proxy(core, {
    get(target, prop, receiver) {
      if (prop === "storage") return storage;
      if (prop === "file") return file;
      if (prop === "message") return message;
      if (prop === "dispatch") return dispatch;
      return Reflect.get(target, prop, receiver);
    },
  });
};

export const createApp = (cfg = config) => {
  const repo = new Repository(config);
  const localCore = new Core({
    config: cfg,
    repo,
  });
  const core = TARGET ? remoteCore(TARGET, localCore, repo) : localCore;
  const http = TARGET ? remoteApp(TARGET, []) : new HttpInterface(core);

  http.onClose(async () => {
    await core.close();
  });

  return { app: http, repo, core };
};
