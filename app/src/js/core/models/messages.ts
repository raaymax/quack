import { client } from "../client";
import { BaseMessage, EncryptedData, EncryptedMessage, FullMessage, Message, MessageData, Notif, ReadReceipt, ViewMessage } from "../../types";
import { makeAutoObservable, observable, computed, action, flow, autorun, runInAction } from "mobx"
import { merge, mergeFn } from "../tools/merger";
import type { AppModel } from "./app";
import * as enc from '@quack/encryption';
import { ReadReceiptModel } from "./readReceipt";
import { MessageModel } from "./message";
import { FilesModel } from "./files";

type Messages = Message | Message[];

type MessageModelOptions = {
  channelId: string;
  parentId?: string | null;
  pinned?: boolean;
  search?: string;
}

export class MessagesModel {
  channelId: string = '';
  parentId: string | null | undefined = null;
  list: MessageModel[] = [];

  receipts: ReadReceiptModel[] = [];
  files: FilesModel;

  pinned?: boolean;
  search?: string;


  root: AppModel;

  constructor({channelId, parentId, pinned, search}: MessageModelOptions, root: AppModel) {
      makeAutoObservable(this, {root: false, decrypt: false});
      this.root = root;
      this.channelId = channelId;
      this.parentId = parentId;
      this.list = [];
      this.pinned = pinned;
      this.search = search;
      this.files = new FilesModel(this.root);
      client.on('message', this.onMessage);
      autorun(() => {
        console.log(this.list.length);
      })
  }

  onMessage = async (msg: Message) => {
    if(msg.channelId === this.channelId && msg.parentId === this.parentId) {
      console.log('onMessage before', msg);
      const m = await this.decrypt(msg);
      console.log('onMessage', m);
      runInAction(() => {
        this.list = mergeFn<MessageModel>(
          (a: MessageModel, b: MessageModel) => a.patch(b),
          ({id}) => id,
          this.list,
          m.map((m: FullMessage) => new MessageModel(m, this.root)),
        ).sort((a, b) => new Date(a.createdAt) < new Date(b.createdAt) ? 1 : -1);
      })
    }
  }

  decrypt = async (msg: Messages): Promise<FullMessage[]> => {
    try{ 
      const channel = this.root.channels.get(this.channelId);
      if(!channel) {
        throw new Error(`Channel with id ${this.channelId} not found`);
      }
      const encryptionKey = await channel?.getEncryptionKey();

      if(!channel || !encryptionKey){
        return [msg].flat().filter((m) => {
          if (m.secured) console.warn('no encryption key - skipping decryption');
          return !m.secured;
        }) as FullMessage[];
      }
      const e = enc.encryptor(encryptionKey);

      return Promise.all([msg].flat().map(async (msg) => {
        if (!msg.secured) return msg;

        const {encrypted, _iv, ...rest} = msg;
        const base: BaseMessage = rest;
        const decrypted: MessageData = await e.decrypt({encrypted, _iv});
        const ret: FullMessage = {...base, ...decrypted, secured: false};
        return ret;
      }));
    }catch(e){
      console.error(e);
      throw e;
    }
  }

  encrypt = async (msg: ViewMessage, sharedKey: JsonWebKey): Promise<Partial<Message>> => {
    const {clientId, channelId, parentId, ...data} = msg;
    const e = enc.encryptor(sharedKey);
    const encrypted: EncryptedData = await e.encrypt(data);
    const m: Partial<EncryptedMessage> = {
      clientId,
      channelId,
      parentId,
      ...encrypted,
      secured: true,
    };
    return m;
  }


  get latestDate() {
    return this.list.reduce((acc, item) => Math.max(acc, new Date(item.createdAt).getTime()), new Date('1970-01-01').getTime());
  }
  get earliestDate() {
    return this.list.reduce((acc, item) => Math.min(acc, new Date(item.createdAt).getTime()), new Date().getTime());
  }

  get latest() {
    return this.list.reduce((acc: Message | null, item: Message) => {
      if(!acc) return item;
      if(new Date(item.createdAt) > new Date(acc.createdAt)) {
        return item;
      }
      return acc;
    }, null);
  }

  get oldest() {
    return this.list.reduce((acc: Message | null, item: Message) => {
      if(!acc) return item;
      if(new Date(item.createdAt) < new Date(acc.createdAt)) {
        return item;
      }
      return acc;
    }, null);
  }

  putReadReceipt = (r: ReadReceipt) => {
      const existing = this.receipts.find(rr => rr.userId === r.userId);
      if(existing) {
        existing.patch(r);
        return existing;
      }
      const created = new ReadReceiptModel(r, this.root);
      return created;
  }

  loadReadReceipts = flow(function*(this: MessagesModel) {
    const receipts = yield client.api.getChannelReadReceipts(this.channelId);
    console.log('loadReadReceipts', receipts);
    this.receipts = receipts.filter((r) => (!this.parentId && !r.parentId) || r.parentId === this.parentId).map((r: ReadReceipt) => {
      return this.putReadReceipt(r);
    });
  });


  load = flow(function*(this: MessagesModel) {
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
    this.list = messages.map((m: FullMessage) => new MessageModel(m, this.root));
    yield this.loadReadReceipts();
    return this.list;
  })

  loadPrev = flow(function*(this: MessagesModel) {
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
      ({id}) => id,
      this.list,
      messages.map((m: FullMessage) => new MessageModel(m, this.root))
    ).sort((a, b) => new Date(a.createdAt) < new Date(b.createdAt) ? 1 : -1)
    return messages;
  })

  loadNext = flow(function*(this: MessagesModel) {
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
      ({id}) => id,
      this.list,
      messages.map((m: FullMessage) => new MessageModel(m, this.root))
    ).sort((a, b) => new Date(a.createdAt) < new Date(b.createdAt) ? 1 : -1)
    return messages;
  })

  getAll(): MessageModel[] {
    return this.list;
  }

  getReadReceipts = () => {
    return this.receipts;
  }

  remove = flow(function*(this: MessagesModel, id: string) {
    yield client.api.removeMessage(id);
    this.list = this.list.filter(m => m.id !== id);
  })
}

