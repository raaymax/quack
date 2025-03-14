// deno-lint-ignore-file no-window
import { SSESource } from "@jsr/planigale__sse";
import {
  ApiErrorResponse,
  Channel,
  Command,
  CreateChannelRequest,
  Emoji,
  Message,
  ReadReceipt,
  User,
  UserConfig,
} from "./types.ts";
import AuthAPI from "./auth.ts";
import { FilesAPI } from "./files.ts";

export * from "./types.ts";

declare global {
  interface Window {
    isTauri: boolean;
  }
}
declare const document: any;

const isDeno = typeof window === "undefined";

type RequestInit = (typeof fetch)["prototype"]["init"];

async function waitBeforeRetry(retry: number) {
  switch (retry) {
    case 0:
      await new Promise((r) => setTimeout(r, 1000));
      break;
    case 1:
      await new Promise((r) => setTimeout(r, 2000));
      break;
    default:
      await new Promise((r) => setTimeout(r, 5000));
      break;
  }
}

export class ApiError extends Error {
  payload: any;
  url: string;
  status: number;
  constructor(msg: string, status: number, url: string, payload: any) {
    super(msg);
    this.status = status;
    this.url = url;
    this.payload = payload;
  }
}

class API extends EventTarget {
  baseUrl: string;

  _http: any;
  _token: string | undefined;

  userId: string | undefined;

  source: SSESource | null;

  tokenInit: () => void;

  abortController: AbortController;

  userEncryptionKey: JsonWebKey | null = null;

  privateKey: JsonWebKey | null = null;

  publicKey: JsonWebKey | null = null;

  auth: AuthAPI;
  files: FilesAPI;

  fetch: typeof fetch;

  sseEnabled: boolean;

  set token(value: any) {
    if (typeof value === "string" && value.trim() !== "") {
      this._token = value;
      this.tokenInit();
    }
  }

  get token() {
    return this._token;
  }

  getUrl = (fileId: string) => `/api/files/${fileId}`;
  getThumbnail = (id: string, size?: { w?: number; h?: number }) => {
    const params = new URLSearchParams();
    if (size?.w) params.set("w", size.w.toString());
    if (size?.h) params.set("h", size.h.toString());
    return `${this.getUrl(id)}?${params.toString()}`;
  };
  getDownloadUrl = (id: string) => `${this.getUrl(id)}?download=true`;

  constructor(url: string, opts: { fetch: typeof fetch; sse?: boolean }) {
    super();
    this.baseUrl = isDeno || window?.isTauri ? url : "";
    this.abortController = new AbortController();
    this.source = null;
    this.tokenInit = () => {
      this.abortController.abort("App is frozen");
      this.abortController = new AbortController();
      if (this.sseEnabled) {
        this.reconnect(this.abortController.signal);
      }
    };
    this.userId = localStorage.userId;
    this.token = localStorage.token;
    this.fetch = opts.fetch;
    this.auth = new AuthAPI(this);
    this.files = new FilesAPI(this);
    this.sseEnabled = opts.sse ?? true;
  }

  init = () => {
    if (typeof document !== "undefined") {
      document.addEventListener("freeze", () => {
        console.debug("[SSE] App is frozen");
        this.abortController.abort("App is frozen");
      });
      document.addEventListener("resume", () => {
        console.debug("[SSE] App is resumed");
        this.abortController = new AbortController();
        this.reconnect(this.abortController.signal);
      });
    }
    this.reconnect(this.abortController.signal);
  };

  async reconnect(signal?: AbortSignal) {
    try {
      console.debug("events reconnecting SSE");
      await this.listen();
    } catch (e) {
      console.error("[API_SSE]", e);
    } finally {
      if (signal && !signal.aborted) {
        setTimeout(() => this.reconnect(signal), 1000);
      }
    }
  }

  async listen(signal?: AbortSignal) {
    if (signal && signal.aborted) return;
    try {
      console.debug(`events listening ${this.baseUrl}/api/sse`);
      this.source = new SSESource(`${this.baseUrl}/api/sse`, {
        signal,
        fetch: this.fetch,
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      if (!this.source) return;
      this.emit(new CustomEvent("con:open", { detail: {} }));
      // @ts-ignore For some reason the AsyncIterator is not recognized
      for await (const event of this.source) {
        if (event.data === "") continue;
        const data = JSON.parse(event.data);
        console.debug("[SSE]", data);
        this.dispatchEvent(new CustomEvent(data.type, { detail: data }));
      }
      console.debug("event disconnected");
    } finally {
      this.emit(new CustomEvent("con:close", { detail: {} }));
      if (this.source) {
        await this.source.close();
        this.source = null;
      }
    }
  }

  async fetchWithCredentials(
    url: string,
    opts: RequestInit = {},
  ): Promise<any> {
    return await this.fetch(
      `${this.baseUrl}${url}`,
      this.token
        ? {
          credentials: "include",
          ...opts,
          headers: {
            "Content-Type": "application/json",
            ...opts.headers || {},
            Authorization: `Bearer ${this.token}`,
          },
        }
        : {
          credentials: "include",
          ...opts,
          headers: {
            "Content-Type": "application/json",
            ...opts.headers || {},
          },
        },
    );
  }

  async callApi(
    url: string,
    opts: {
      seqId?: string;
      mapFn?: (i: any) => any;
      retry?: number;
      retries?: number;
    } & RequestInit = {},
  ): Promise<any> {
    const retries = opts?.retries ?? 5;
    const retry = opts?.retry ?? 0;
    const res = await this.fetchWithCredentials(url, opts);
    if (res.status == 200 || res.status == 204) {
      const data = res.status === 200 ? await res.json() : {};
      return {
        type: "response",
        status: "ok",
        seqId: opts.seqId,
        data: [data].flat().map(opts.mapFn ?? ((a) => a)),
      };
    }

    if (res.status >= 500) {
      if (retries > 0) {
        try {
          console.error(await res.json());
        } catch { /*ignore*/ }
        await waitBeforeRetry(retry);
        return this.callApi(url, {
          ...opts,
          retries: retries - 1,
          retry: retry + 1,
        });
      } else {
        return new ApiErrorResponse(
          "INTERNAL_SERVER_ERROR",
          "Server error",
          await res.json(),
        );
      }
    }
    return new ApiErrorResponse(
      "CLIENT_ERROR",
      "Client error",
      await res.json(),
    );
  }

  getResource = async <T = any>(
    url: string,
    retries = 5,
    retry = 0,
  ): Promise<T | null> => {
    const res = await this.fetchWithCredentials(url);
    if (res.status === 404) {
      return null;
    }

    if (res.status >= 500) {
      if (retries > 0) {
        try {
          console.error(await res.json());
        } catch { /*ignore*/ }
        await waitBeforeRetry(retry);
        return this.getResource(url, retries - 1, retry + 1);
      } else {
        throw new ApiError("Server error", res.status, url, await res.json());
      }
    }

    if (res.status >= 400) {
      throw new ApiError("Api error", res.status, url, await res.json());
    }
    const data = await res.json();
    console.debug("[API] getResource", url, data);
    return data;
  };

  getUserConfig = async (): Promise<UserConfig | null> => (
    await this.getResource<UserConfig>(`/api/profile/config`)
  );

  getChannelById = async (channelId: string): Promise<Channel | null> => (
    await this.getResource<Channel>(`/api/channels/${channelId}`)
  );

  getChannels = async (): Promise<Channel[]> => (
    await this.getResource<Channel[]>(`/api/channels`) ?? []
  );

  getUsers = async (): Promise<User[]> => (
    await this.getResource<User[]>(`/api/users`) ?? []
  );

  getChannelReadReceipts = async (
    channelId: string,
  ): Promise<ReadReceipt[]> => (
    await this.getResource<ReadReceipt[]>(
      `/api/channels/${channelId}/read-receipts`,
    ) ?? []
  );

  getOwnReadReceipts = async (): Promise<ReadReceipt[]> => (
    await this.getResource<ReadReceipt[]>(`/api/read-receipts`) ?? []
  );

  getEmojis = async (): Promise<Emoji[]> => (
    await this.getResource<Emoji[]>(`/api/emojis`) ?? []
  );

  getMessages = async (
    q: {
      pinned?: boolean;
      before?: string;
      after?: string;
      limit?: number;
      channelId: string;
      parentId?: string | null;
      q?: string;
    },
  ) => {
    const { channelId, ...query } = q;
    const params = new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(query).filter(([_, v]) => typeof v !== "undefined"),
      ),
    } as any);
    return await this.getResource(
      `/api/channels/${channelId}/messages?${params.toString()}`,
    );
  };

  notifyTyping = async (channelId: string, parentId?: string) => {
    console.log("notifyTyping", channelId, parentId);
    return await this.callApi(`/api/channels/${channelId}/typing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ parentId }),
    });
  };

  updateReadReceipt = async (messageId: string) => {
    return await this.callApi("/api/read-receipts", {
      method: "POST",
      body: JSON.stringify({ messageId }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  createChannel = async (
    { name, users, channelType }: CreateChannelRequest,
  ) => {
    return await this.callApi("/api/channels", {
      method: "POST",
      body: JSON.stringify({ name, users, channelType }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  async putDirectChannel(userId: string): Promise<Channel> {
    const res = await this.fetchWithCredentials(
      `/api/channels/direct/${userId}`,
      {
        method: "PUT",
        body: JSON.stringify({}),
      },
    );
    return await res.json();
  }

  async getDirectChannel(userId: string): Promise<Channel> {
    try {
      const res = await this.fetchWithCredentials(
        `/api/channels/direct/${userId}`,
        {
          method: "GET",
        },
      );
      const json = await res.json();
      return json;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async addReaction(msgId: string, reaction: string): Promise<void> {
    const res = await this.fetchWithCredentials(
      `/api/messages/${msgId}/react`,
      {
        method: "PUT",
        body: JSON.stringify({ reaction }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    await res.body?.cancel();
  }

  async pinMessage(msgId: string, pinned: boolean): Promise<void> {
    const res = await this.fetchWithCredentials(`/api/messages/${msgId}/pin`, {
      method: "PUT",
      body: JSON.stringify({ pinned }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    await res.body?.cancel();
  }

  async removeMessage(msgId: string): Promise<void> {
    const res = await this.fetchWithCredentials(`/api/messages/${msgId}`, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
    await res.body?.cancel();
  }

  async postInteraction(
    data: {
      channelId: string;
      parentId?: string;
      appId?: string;
      clientId: string;
      action: string;
      payload: any;
    },
  ): Promise<void> {
    const res = await this.fetchWithCredentials(`/api/interactions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    await res.body?.cancel();
  }

  async sendMessage(msg: Partial<Message>): Promise<any> {
    return await new Promise((resolve, reject) => {
      const data = { ...msg };
      const timeout = setTimeout(() => reject(new Error("Timeout")), 5000);
      if (msg.parentId === null) delete data.parentId;
      return this.fetchWithCredentials(
        `/api/channels/${data.channelId}/messages`,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      ).then(async (res) => {
        clearTimeout(timeout);
        if (res.status !== 200) {
          throw await res.json();
        }
        return await res.json();
      }).then(resolve).catch(reject);
    });
  }

  async sendCommand(cmd: Partial<Command>): Promise<any> {
    const data = { ...cmd };
    const res = await this.fetchWithCredentials(
      "/api/commands/execute",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    if (res.status !== 200) {
      throw await res.json();
    }
    return await res.json();
  }

  on = this.addEventListener.bind(this);

  off = this.removeEventListener.bind(this);

  emit = this.dispatchEvent.bind(this);

  request = async (msg: any): Promise<any> => {
    switch (msg.type) {
      case "user:config": {
        return this.callApi("/api/profile/config", { seqId: msg.seqId });
      }
      case "channel:get": {
        return this.callApi(`/api/channels/${msg.id}`, { seqId: msg.seqId });
      }
      case "channels:load": {
        return this.callApi("/api/channels", {
          seqId: msg.seqId,
          mapFn: (i: any) => ({ type: "channel", ...i }),
        });
      }
      case "user:getAll": {
        return this.callApi("/api/users", {
          seqId: msg.seqId,
          mapFn: (i: any) => ({ type: "user", ...i }),
        });
      }
      case "user:get": {
        return this.callApi(`/api/users/${msg.id}`, { seqId: msg.seqId });
      }
      case "emoji:getAll": {
        return this.callApi("/api/emojis", {
          seqId: msg.seqId,
          mapFn: (i: any) => ({ type: "emoji", ...i }),
        });
      }
      case "channel:create": {
        return await this.callApi("/api/channels", {
          method: "POST",
          body: JSON.stringify({
            name: msg.name,
            users: msg.users,
            channelType: msg.channelType,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      case "message:create": {
        const createRes = await this.callApi(
          `/api/channels/${msg.channelId}/messages`,
          {
            method: "POST",
            body: JSON.stringify(msg),
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        return await this.callApi(`/api/messages/${createRes.data[0].id}`, {
          method: "GET",
        });
      }
      case "message:remove": {
        return await this.callApi(`/api/messages/${msg.id}`, {
          method: "DELETE",
          body: JSON.stringify({}),
        });
      }
      case "message:pin": {
        await this.callApi(`/api/messages/${msg.id}/pin`, {
          method: "PUT",
          body: JSON.stringify({ pinned: msg.pinned }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        return await this.callApi(`/api/messages/${msg.id}`, { method: "GET" });
      }
      case "command:execute": {
        return this.callApi("/api/commands/execute", {
          method: "POST",
          body: JSON.stringify(msg),
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      case "message:search":
        return this.callApi(
          `/api/channels/${msg.channelId}/messages?q=${msg.text}`,
          {
            seqId: msg.seqId,
            mapFn: (i: any) => ({ type: "search", ...i }),
          },
        );
      case "readReceipt:getOwn": {
        return this.callApi("/api/read-receipts", {
          seqId: msg.seqId,
          mapFn: (i: any) => ({ type: "badge", ...i }),
        });
      }
      case "readReceipt:getChannel": {
        return this.callApi(`/api/channels/${msg.channelId}/read-receipts`, {
          seqId: msg.seqId,
          mapFn: (i: any) => ({ type: "badge", ...i }),
        });
      }
      case "readReceipt:update": {
        return this.callApi("/api/read-receipts", {
          method: "POST",
          body: JSON.stringify({ messageId: msg.messageId }),
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      case "message:react": {
        return this.callApi(`/api/messages/${msg.id}/react`, {
          method: "PUT",
          body: JSON.stringify({ reaction: msg.reaction }),
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      case "user:typing": {
        return this.callApi(`/api/channels/${msg.channelId}/typing`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ parentId: msg.parentId }),
        });
      }
      default:
        return {
          type: "response",
          status: "error",
          seqId: msg.seqId,
          data: [],
          error: "No handler for this message type",
        };
    }
  };

  req = async (msg: any): Promise<any> => {
    console.debug("[API] req out", msg);
    const ret = await this.request(msg);
    console.debug("[API] req in", msg, ret);
    return ret;
  };
}

export default API;
