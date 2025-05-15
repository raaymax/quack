import type { AppModel } from "./app.ts";
import { flow, makeAutoObservable } from "mobx";
import { Eid, ReadReceipt } from "../../types.ts";
import { client } from "../client.ts";
import { isSameThread } from "../tools/sameThread.ts";

export class ReadReceiptModel {
  id: Eid;
  channelId: Eid;
  parentId: Eid | null;
  userId: Eid;
  count: number;
  lastRead: Date;
  lastMessageId: Eid;

  root: AppModel;

  constructor(value: ReadReceipt, root: AppModel) {
    makeAutoObservable(this, { root: false });
    this.id = value.id;
    this.channelId = value.channelId;
    this.parentId = value.parentId ?? null;
    this.userId = value.userId;
    this.count = value.count;
    this.lastRead = new Date(value.lastRead);
    this.lastMessageId = value.lastMessageId;

    this.root = root;
  }

  async dispose() {
    this.id = "";
    this.channelId = "";
    this.parentId = "";
    this.userId = "";
    this.count = 0;
    this.lastRead = new Date();
    this.lastMessageId = "";
  }

  patch = (value: ReadReceipt) => {
    this.count = value.count;
    this.lastRead = new Date(value.lastRead);
    this.lastMessageId = value.lastMessageId;
  };
}

export class ThreadReadReceiptsModel {
  list: ReadReceiptModel[];
  channelId: Eid;
  parentId?: Eid | null;

  root: AppModel;
  _dispose: () => void;

  constructor(
    opts: {
      channelId: string;
      parentId?: string | null;
      pinned?: boolean;
      search?: string;
    },
    root: AppModel,
  ) {
    makeAutoObservable(this, { root: false, _dispose: false });
    this.channelId = opts.channelId;
    this.parentId = opts.parentId;
    this.root = root;
    this.list = [];
    this._dispose = client.on2("readReceipt", this.upsert);
  }

  async dispose() {
    this._dispose();
    await Promise.all(this.list.map((rr) => rr.dispose()));
    this.list = [];
  }

  update = async (id: Eid) => {
    return await client.api.updateReadReceipt(id);
  };

  upsert = (r: ReadReceipt) => {
    if (isSameThread(r, this)) {
      const existing = this.list.find((rr) => rr.userId === r.userId);
      if (existing) {
        existing.patch(r);
        return existing;
      }
      const created = new ReadReceiptModel(r, this.root);
      return created;
    }
    return null;
  };

  load = flow(function* (this: ThreadReadReceiptsModel) {
    const receipts = yield client.api.getChannelReadReceipts(this.channelId);
    this.list = receipts.filter((r: ReadReceipt) => (
      (!this.parentId && !r.parentId) || r.parentId === this.parentId
    )).map((r: ReadReceipt) => {
      return this.upsert(r);
    });
  });

  getAll = () => {
    return this.list;
  };
}

export class ReadReceiptsModel {
  list: ReadReceiptModel[];

  root: AppModel;
  _dispose: (() => void)[];

  constructor(root: AppModel) {
    makeAutoObservable(this, { root: false, _dispose: false });
    this.root = root;
    this.list = [];

    this._dispose = [
      client.on2("readReceipt", this.upsert),
      this.onResume(),
    ];
  }

  onResume = () => {
    globalThis.addEventListener("resume", () => this.load());
    globalThis.addEventListener("focus", () => this.load());
    return () => {
      globalThis.removeEventListener("resume", () => this.load());
      globalThis.removeEventListener("focus", () => this.load());
    };
  };

  async dispose() {
    this._dispose.forEach((d) => d());
    await Promise.all(this.list.map((rr) => rr.dispose()));
    this.list = [];
  }

  upsert = (r: ReadReceipt) => {
    if (r.userId !== this.root.userId) return;
    const existing = this.list.find((rr) => rr.id === r.id);
    if (existing) {
      existing.patch(r);
      return existing;
    }
    const created = new ReadReceiptModel(r, this.root);
    this.list.push(created);
    return created;
  };

  load = flow(function* (this: ReadReceiptsModel) {
    const receipts = yield client.api.getOwnReadReceipts();
    receipts.forEach((receipt: ReadReceipt) => this.upsert(receipt));
  });

  getForChannel = (channelId?: Eid): ReadReceiptModel | null => {
    if (!channelId) return null;
    return this.list.find((r) =>
      r.channelId === channelId && r.parentId === null
    ) ?? null;
  };

  getMap = (parentId?: Eid) => {
    return this.list.filter((r) => !parentId || r.parentId === parentId)
      .reduce((acc, p) => ({
        ...acc,
        [p.channelId]: p,
      }), {});
  };
}
