import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { SSESource } from "@planigale/sse";
import { Repository } from "../../../../infra/mod.ts";
import { ensureUser } from "./users.ts";
import {
  Channel,
  EntityId,
  Message,
  ReplaceEntityId,
} from "../../../../types.ts";
import { AsyncLocalStorage } from "node:async_hooks";

export type RegistrationRequest = {
  token: string;
  name: string;
  password: string;
  email: string;
};

type Arg<T extends Object> = T | ((chat: Chat) => T);
const asyncLocalStorage = new AsyncLocalStorage<{ instances: Chat[] }>();

export class Chat {
  repo: Repository;

  agent: Agent;

  token: string;

  parent: Chat | null;

  userId: string | null;

  channelId: string | null;

  parentId: string | null;

  eventSource: SSESource | null;

  ended = false;

  currentStep = 0;

  state: any = {};

  steps: any[] = [];

  cleanup: any[] = [];

  appVersion = "client-version";

  static async test(app, opts, fn) {
    await Agent.test(app, opts, async (agent) => {
      await asyncLocalStorage.run({ instances: [] }, async () => {
        await fn(agent);
        const count = asyncLocalStorage.getStore()?.instances.length ?? 0;
        if (count > 0) {
          throw new Error(`Chat instances are not cleaned up ${count}`);
        }
      });
    });
  }

  static init(repo: Repository, agent: Agent) {
    return new Chat(repo, agent);
  }

  _register() {
    const store = asyncLocalStorage.getStore();
    if (!store) {
      throw new Error("Chat instance should be created in Chat.test");
    }
    store.instances.push(this);
  }

  _unregister() {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store.instances.splice(store.instances.indexOf(this), 1);
    }
  }

  get userIdR() {
    assert(this.userId);
    return this.userId;
  }

  get channelIdR() {
    assert(this.channelId);
    return this.channelId;
  }

  constructor(repo: Repository, agent: Agent, parent: Chat | null = null) {
    this.repo = repo;
    this.agent = agent;
    this.parent = parent;
    this.userId = null;
    this.channelId = null;
    this.parentId = null; // parent and parentId are not related "parent" is a parent of this object
    this.token = "invalid";
    this.eventSource = null;
    this._register();
  }

  arg<I extends Object>(arg: Arg<I>): I {
    if (typeof arg === "function") {
      return arg(this);
    }
    return arg;
  }

  connectSSE() {
    this.steps.push(async () => {
      this.eventSource = this.agent.events("/api/sse", {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const { event } = await this.eventSource.next();
      assertEquals(JSON.parse(event?.data ?? ""), { status: "connected" });
      this.cleanup.push(async () => {
        await this.eventSource?.close();
      });
    });
    return this;
  }

  nextEvent(fn: (event: any, chat: Chat) => any) {
    this.steps.push(async () => {
      const { event } = await this.eventSource?.next() || {};
      await fn(JSON.parse(event?.data || "{}"), this);
    });
    return this;
  }

  login(login = "admin", password = "123") {
    this.steps.push(async () => {
      await ensureUser(this.repo, login);
      const res = await this.agent.request()
        .post("/api/auth/session")
        .json({
          login,
          password,
        })
        .expect(200);
      const body = await res.json();
      this.userId = body.userId;
      this.token = body.token;
    });
    return this;
  }

  checkToken(tokenData: Arg<string>, test?: (body: any) => Promise<any> | any) {
    this.steps.push(async () => {
      const token = this.arg(tokenData);
      const res = await this.agent.request()
        .get(`/api/users/token/${token}`)
        .expect(200);
      const data = await res.json();
      await test?.(data);
    });
    return this;
  }

  register(
    { token, ...data }: RegistrationRequest,
    test?: (body: any) => Promise<any> | any,
  ) {
    this.steps.push(async () => {
      const res = await this.agent.request()
        .post(`/api/users/${token}`)
        .json(data)
        .expect(200);
      const body = await res.json();
      if (body.id) {
        this.cleanup.push(async () => {
          const user = await this.repo.user.get({ id: EntityId.from(body.id) });
          await this.repo.channel.update({ id: user?.mainChannelId }, {});
          await this.repo.user.remove({ id: EntityId.from(body.id) });
        });
      }
      await test?.(body);
    });
    return this;
  }

  createChannel(
    channelData: Arg<Partial<ReplaceEntityId<Channel>>>,
    test?: (channel: Channel, chat: Chat) => Promise<any> | any,
  ) {
    let channelId: string;
    this.steps.push(async () => {
      const channel = this.arg(channelData);
      const res = await this.agent.request()
        .post("/api/channels")
        .json({
          ...channel,
        })
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);

      const body = await res.json();
      channelId = body.id;
      this.channelId = channelId;
      this.cleanup.push(async () => {
        if (!channelId) return;
        await this.repo.badge.removeMany({
          channelId: EntityId.from(channelId),
        });
        await this.repo.message.removeMany({
          channelId: EntityId.from(channelId),
        });
        await this.repo.channel.remove({ id: EntityId.from(channelId) });
      });
      await test?.(body, this);
    });
    return this;
  }

  putDirectChannel(
    data: Arg<{ userId: string }>,
    test?: (
      channel: ReplaceEntityId<Channel>,
      chat: Chat,
    ) => Promise<any> | any,
  ) {
    this.steps.push(async () => {
      const { userId } = this.arg(data);
      const res = await this.agent.request()
        .put(`/api/channels/direct/${userId}`)
        .json({})
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      this.channelId = body.id;
      this.cleanup.push(async () => {
        await this.repo.badge.removeMany({
          channelId: EntityId.from(body.id),
        });
        await this.repo.message.removeMany({
          channelId: EntityId.from(body.id),
        });
        await this.repo.channel.remove({ id: EntityId.from(body.id) });
      });
      await test?.(body, this);
    });
    return this;
  }

  openDirectChannel(
    data: Arg<{ userId: string }>,
    test?: (
      channel: ReplaceEntityId<Channel>,
      chat: Chat,
    ) => Promise<any> | any,
  ) {
    this.steps.push(async () => {
      const { userId } = this.arg(data);
      const res = await this.agent.request()
        .get(`/api/channels/direct/${userId}`)
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      this.channelId = body.id;
      await test?.(body, this);
    });
    return this;
  }

  openChannel(channelName: string) {
    this.steps.push(async () => {
      const res = await this.agent.request()
        .get("/api/channels")
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      const channelId = body.find(({ name }: { name: string }) =>
        name === channelName
      ).id;
      assert(channelId);
      this.channelId = channelId;
    });
    return this;
  }

  removeChannel() {
    this.steps.push(async () => {
      await this.agent.request()
        .delete(`/api/channels/${this.channelId}`)
        .emptyBody()
        .header("Authorization", `Bearer ${this.token}`)
        .expect(204);
      const res = await this.agent.request()
        .get(`/api/channels/${this.channelId}`)
        .header("Authorization", `Bearer ${this.token}`)
        .expect(404);
      res.body?.cancel?.();
    });
    return this;
  }

  getChannel(
    fn: (channel: ReplaceEntityId<Channel>, chat: Chat) => Promise<any> | any,
  ) {
    this.steps.push(async () => {
      const res = await this.agent.request()
        .get(`/api/channels/${this.channelId}`)
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      await fn(body, this);
    });
    return this;
  }

  getEmojis(fn: (emojis: any[]) => Promise<any>) {
    this.steps.push(async () => {
      const res = await this.agent.request()
        .get("/api/emojis")
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      await fn(body);
    });
    return this;
  }

  getConfig(fn: (config: any) => Promise<any>) {
    this.steps.push(async () => {
      const res = await this.agent.request()
        .get("/api/profile/config")
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      await fn(body);
    });
    return this;
  }

  getChannels(fn: (channels: Channel[]) => Promise<any> | any) {
    this.steps.push(async () => {
      const res = await this.agent.request()
        .get("/api/channels")
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      await fn(body);
    });
    return this;
  }

  getUsers(fn: (users: any[], chat: Chat) => Promise<any>) {
    this.steps.push(async () => {
      const res = await this.agent.request()
        .get("/api/users")
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      await fn(body, this);
    });
    return this;
  }

  getUser(
    userId: string | ((chat: Chat) => string),
    fn: (user: any) => Promise<any>,
  ) {
    this.steps.push(async () => {
      const id = typeof userId === "function" ? userId(this) : userId;
      const res = await this.agent.request()
        .get(`/api/users/${id}`)
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      await fn(body);
    });
    return this;
  }

  getMessages(
    queryData: Arg<{ parentId?: string }> = {},
    test?: (messages: any[], chat: Chat) => Promise<any> | any,
  ) {
    this.steps.push(async () => {
      const { parentId } = this.arg(queryData);
      let query = "";
      if (typeof parentId !== "undefined") {
        query = `?parentId=${parentId}`;
      }

      const res = await this.agent.request()
        .get(`/api/channels/${this.channelId}/messages${query}`)
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      await test?.(body, this);
    });
    return this;
  }

  sendMessage(
    messageData: Arg<Partial<ReplaceEntityId<Message>>>,
    test?: (
      message: ReplaceEntityId<Message>,
      chat: Chat,
    ) => Promise<any> | any,
  ) {
    this.steps.push(async () => {
      const message = this.arg(messageData);
      const res = await this.agent.request()
        .post(`/api/channels/${this.channelId}/messages`)
        .json(message)
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      this.cleanup.push(async () => {
        if (!body?.id) return;
        await this.repo.message.remove({ id: EntityId.from(body.id) });
      });
      await test?.(body, this);
    });
    return this;
  }

  interaction(
    data: Arg<{
      channelId?: string;
      parentId?: string;
      clientId: string;
      payload?: any;
      action: string;
    }>,
  ) {
    this.steps.push(async () => {
      const int = this.arg(data);
      await this.agent.request()
        .post(`/api/interactions`)
        .json({
          ...int,
          channelId: int.channelId ?? this.channelId,
          ...(int.parentId ?? this.parentId
            ? { parentId: int.parentId ?? this.parentId }
            : {}),
        })
        .header("Authorization", `Bearer ${this.token}`)
        .expect(204);
    });
    return this;
  }

  reactToMessage(data: Arg<{ messageId: string; reaction: string }>) {
    this.steps.push(async () => {
      const { messageId, reaction } = this.arg(data);
      await this.agent.request()
        .put(`/api/messages/${messageId}/react`)
        .json({ reaction })
        .header("Authorization", `Bearer ${this.token}`)
        .expect(204);
    });
    return this;
  }

  getChannelReadReceipts(
    fn: (receipts: any[], chat: Chat) => Promise<any> | any,
  ) {
    this.steps.push(async () => {
      const res = await this.agent.request()
        .get(`/api/channels/${this.channelId}/read-receipts`)
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      await fn(body, this);
    });
    return this;
  }

  getReadReceipts(fn: (receipts: any[], chat: Chat) => Promise<any> | any) {
    this.steps.push(async () => {
      const res = await this.agent.request()
        .get("/api/read-receipts")
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      await fn(body, this);
    });
    return this;
  }

  updateReadReceipts(
    messageId: string | ((chat: Chat) => string),
    test?: (receipt: any, chat: Chat) => Promise<any> | any,
  ) {
    this.steps.push(async () => {
      const res = await this.agent.request()
        .post("/api/read-receipts")
        .json({
          messageId: typeof messageId === "function"
            ? messageId(this)
            : messageId,
        })
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      await test?.(body, this);
      this.cleanup.push(async () => {
        await this.repo.badge.remove({ id: EntityId.from(body.id) });
      });
    });
    return this;
  }

  executeCommand(
    command: string,
    attachments: any[],
    test?: (...args: any) => any,
  ) {
    this.steps.push(async () => {
      const [name, ...args] = command.split(" ");
      const text = args.join(" ");
      const res = await this.agent.request()
        .post("/api/commands/execute")
        .json({
          name,
          text,
          attachments,
          context: {
            channelId: this.channelId,
            appVersion: this.appVersion,
          },
        })
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const json = res.status === 204 ? {} : await res.json();
      await test?.({
        status: res.status,
        json,
        channelId: this.channelId,
        events: this.eventSource,
      });
    });
    return this;
  }

  pinMessage(arg: Arg<{ messageId: string; pinned?: boolean }>) {
    this.steps.push(async () => {
      const { messageId, pinned = true } = this.arg(arg);
      await this.agent.request()
        .put(`/api/messages/${messageId}/pin`)
        .json({ pinned })
        .header("Authorization", `Bearer ${this.token}`)
        .expect(204);
    });
    return this;
  }

  getPinnedMessages(fn: (messages: any[], chat: Chat) => Promise<any> | any) {
    this.steps.push(async () => {
      const res = await this.agent.request()
        .get(`/api/channels/${this.channelId}/messages?pinned=true`)
        .header("Authorization", `Bearer ${this.token}`)
        .expect(200);
      const body = await res.json();
      await fn(body, this);
    });
    return this;
  }

  typing() {
    this.steps.push(async () => {
      await this.agent.request()
        .post(`/api/channels/${this.channelId}/typing`)
        .json({})
        .header("Authorization", `Bearer ${this.token}`)
        .expect(204);
    });
    return this;
  }

  step(test: (chat: Chat) => any) {
    this.steps.push(async () => {
      await test(this);
    });
    return this;
  }

  end() {
    this.ended = true;
    return this;
  }

  async then(resolve: (self?: any) => any, reject: (e: Error) => any) {
    let cleanupStart = false;
    try {
      while (this.steps[this.currentStep]) {
        try {
          await this.steps[this.currentStep]();
        } catch (e) {
          throw e;
        } finally {
          this.currentStep++;
        }
      }
      if (!this.ended) {
        return resolve();
      }
      cleanupStart = true;
      for (const cleanup of this.cleanup) {
        await cleanup();
      }
      this._unregister();
      resolve();
    } catch (e) {
      if (!cleanupStart) {
        for (const cleanup of this.cleanup) {
          try {
            await cleanup();
          } catch (e) {
            console.error(e);
          }
        }
      }
      reject(e);
    }
  }
}
