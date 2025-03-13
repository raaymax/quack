import { client } from "../client";
import { Eid, FullMessage, Message } from "../../types";
import { action, flow, makeAutoObservable, runInAction } from "mobx";
import { merge, mergeFn } from "../tools/merger";
import type { AppModel } from "./app";
import { MessageModel } from "./message";
import { isSameThread } from "../tools/sameThread";
import { MessageEncryption } from "../tools/messageEncryption";

type Messages = Message | Message[];

type MessageModelOptions = {
  channelId: Eid;
  parentId?: Eid | null;
  pinned?: boolean;
  search?: string;

  selected?: Eid;
};

export class MessagesModel {
  channelId: Eid = "";
  parentId?: Eid | null;
  pinned?: boolean;
  search?: string;

  mode: "live" | "archive" | "spotlight";
  date: Date;
  selected: Eid | null = null;

  list: MessageModel[] = [];
  ghosts: MessageModel[] = [];

  _cleanups: (() => void)[] = [];
  root: AppModel;

  constructor(
    { channelId, parentId, pinned, search, selected }: MessageModelOptions,
    root: AppModel,
  ) {
    makeAutoObservable(this, { root: false, decrypt: false, _cleanups: false });
    this.root = root;
    this.channelId = channelId;
    this.parentId = parentId;
    this.list = [];
    this.pinned = pinned;
    this.search = search;
    this.date = new Date();
    this.selected = selected ?? null;
    this.mode = selected ? "spotlight" : "live";

    this._cleanups.push(client.on2("message", (msg) => this.onMessage(msg)));
    this._cleanups.push(
      client.on2("message:remove", (msg) => this.onRemove(msg)),
    );
    this._cleanups.push(this.subscribeUnfreeze());
  }

  subscribeUnfreeze = () => {
    const resume = () => {
      console.log("resume");
      this.refresh();
    };
    const focus = () => {
      console.log("focus");
      this.refresh();
    };
    addEventListener("resume", resume);
    addEventListener("focus", focus);
    return () => {
      removeEventListener("resume", resume);
      removeEventListener("focus", focus);
    };
  };

  async dispose() {
    this.channelId = "";
    this.parentId = undefined;
    this.pinned = undefined;
    this.search = undefined;
    this._cleanups.forEach((c) => c());
    this._cleanups = [];
    await Promise.all(this.list.map((m) => m.dispose()));
    await Promise.all(this.ghosts.map((m) => m.dispose()));
    this.list = [];
  }

  onMessage = async (msg: Message) => {
    if (isSameThread(msg, this)) {
      const m = await this.decrypt(msg);
      runInAction(() => {
        this.ghosts = this.ghosts.filter((g) => g.clientId !== msg.clientId);
        this.list = mergeFn<MessageModel>(
          (a: MessageModel, b: MessageModel) => a.patch(b),
          ({ id }) => id,
          this.list,
          m.map((m: FullMessage) => new MessageModel(m, this)),
        ).sort((a, b) =>
          new Date(a.createdAt) < new Date(b.createdAt) ? 1 : -1
        );
      });
    }
  };

  setMode = (mode: "live" | "archive" | "spotlight") => {
    this.mode = mode;
  };

  setDate = (date: Date) => {
    this.date = date;
  };

  setSetected = (id: Eid | null) => {
    this.selected = id;
  };

  addGhost = (msg: MessageModel) => {
    this.ghosts.push(msg);
  };

  getGhost(clientId: string): MessageModel | null {
    return this.ghosts.find((g) => g.clientId === clientId) ?? null;
  }

  onRemove = (id: string) => {
    this.list = this.list.filter((m) => m.id !== id);
  };

  decrypt = async (msg: Messages): Promise<FullMessage[]> => {
    try {
      const channel = this.root.channels.get(this.channelId);
      if (!channel) {
        throw new Error(`Channel with id ${this.channelId} not found`);
      }
      const encryptionKey = await channel?.getEncryptionKey();
      return MessageEncryption.decrypt(msg, encryptionKey);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  get latestDate() {
    return this.list.reduce(
      (acc, item) => Math.max(acc, new Date(item.createdAt).getTime()),
      new Date("1970-01-01").getTime(),
    );
  }
  get earliestDate() {
    return this.list.reduce(
      (acc, item) => Math.min(acc, new Date(item.createdAt).getTime()),
      new Date().getTime(),
    );
  }

  get latest() {
    return this.list.reduce((acc: Message | null, item: Message) => {
      if (!acc) return item;
      if (new Date(item.createdAt) > new Date(acc.createdAt)) {
        return item;
      }
      return acc;
    }, null);
  }

  get oldest() {
    return this.list.reduce((acc: Message | null, item: Message) => {
      if (!acc) return item;
      if (new Date(item.createdAt) < new Date(acc.createdAt)) {
        return item;
      }
      return acc;
    }, null);
  }

  reload = flow(function* (this: MessagesModel) {
    this.mode = "live";
    this.list = [];
    yield this.load();
  });

  load = flow(function* (this: MessagesModel) {
    yield this.root.setLoading(true);
    const messages = yield client.messages.fetch({
      channelId: this.channelId,
      parentId: this.parentId,
      pinned: this.pinned,
      search: this.search,
      limit: 50,
      preprocess: this.decrypt,
    });
    yield this.root.setLoading(false);
    this.list = merge<MessageModel>(
      ({ id }) => id,
      this.list,
      messages.map((m: FullMessage) => new MessageModel(m, this)),
    ).sort((a, b) => new Date(a.createdAt) < new Date(b.createdAt) ? 1 : -1);

    return this.list;
  });

  refresh = flow(function* (this: MessagesModel) {
    if (this.mode !== "live") {
      return;
    }
    yield this.root.setLoading(true);
    const messages = yield client.messages.fetch({
      channelId: this.channelId,
      parentId: this.parentId,
      pinned: this.pinned,
      search: this.search,
      limit: 50,
      preprocess: this.decrypt,
    });
    yield this.root.setLoading(false);
    this.list = merge<MessageModel>(
      ({ id }) => id,
      [],
      messages.map((m: FullMessage) => new MessageModel(m, this)),
    ).sort((a, b) => new Date(a.createdAt) < new Date(b.createdAt) ? 1 : -1);

    return messages.length;
  });

  loadPrev = flow(function* (this: MessagesModel) {
    yield this.root.setLoading(true);
    const messages = yield client.messages.fetch({
      channelId: this.channelId,
      parentId: this.parentId,
      before: this.oldest?.createdAt,
      pinned: this.pinned,
      search: this.search,
      limit: 50,
      preprocess: this.decrypt,
    });
    yield this.root.setLoading(false);
    this.list = merge<MessageModel>(
      ({ id }) => id,
      this.list,
      messages.map((m: FullMessage) => new MessageModel(m, this)),
    ).sort((a, b) => new Date(a.createdAt) < new Date(b.createdAt) ? 1 : -1);

    setTimeout(
      action(() => {
        this.list = this.list.slice(Math.max(0, this.list.length - 100));
      }),
      100,
    );

    return messages.length;
  });

  loadNext = flow(function* (this: MessagesModel) {
    yield this.root.setLoading(true);
    const messages = yield client.messages.fetch({
      channelId: this.channelId,
      parentId: this.parentId,
      after: this.latest?.createdAt,
      pinned: this.pinned,
      search: this.search,
      limit: 50,
      preprocess: this.decrypt,
    });
    yield this.root.setLoading(false);
    this.list = merge<MessageModel>(
      ({ id }) => id,
      this.list,
      messages.map((m: FullMessage) => new MessageModel(m, this)),
    ).sort((a, b) => new Date(a.createdAt) < new Date(b.createdAt) ? 1 : -1);

    setTimeout(
      action(() => {
        this.list = this.list.slice(0, 100);
      }),
      100,
    );
    return messages.length;
  });

  getAll(): MessageModel[] {
    return [...this.ghosts, ...this.list];
  }
  get(parentId: string) {
    return this.list.find((m) => m.id === parentId) ?? null;
  }

  remove = flow(function* (this: MessagesModel, id: string) {
    yield client.api.removeMessage(id);
    this.list = this.list.filter((m) => m.id !== id);
  });

  toJSON() {
    return {
      channelId: this.channelId,
      parentId: this.parentId,
      pinned: this.pinned,
      search: this.search,

      messages: this.list.map((m) => m.toJSON()),
    };
  }
}
