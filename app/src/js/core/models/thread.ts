import { makeAutoObservable, observable, computed, action, flow } from "mobx"
import type { AppModel } from "./app";
import { MessagesModel } from "./messages";
import { client } from "../client";
import { MessageEncryption } from "../tools/messageEncryption";
import { ViewMessage } from "../../types";
import { MessageModel } from "./message";
import { TypingModel } from "./typing";
import { ThreadReadReceiptsModel } from "./readReceipt";
import { InputModel } from "./input";
import { generateHexId } from "../tools/generateHexId";

type ThreadModelOptions = {
  channelId: string;
  parentId?: string | null;
  pinned?: boolean;
  search?: string;
}


export class ThreadModel {
    channelId: string;
    parentId?: string | null;
    messages: MessagesModel;

    input: InputModel;
    typing: TypingModel;
    readReceipts: ThreadReadReceiptsModel;

    root: AppModel;

    constructor(opts: ThreadModelOptions, root: AppModel) {
      const localOpts = {...opts};
        makeAutoObservable(this, {
          root: false,
        })
        if( !opts.pinned && !opts.search ) {
          localOpts.parentId = opts.parentId ?? null;
        }
        this.channelId = opts.channelId;
        this.parentId = opts.parentId;
        this.messages = new MessagesModel(localOpts, root);
        this.input = new InputModel(localOpts, this, root);
        this.typing = new TypingModel(localOpts, root);
        this.readReceipts = new ThreadReadReceiptsModel(localOpts, root);
        this.root = root;
    }

    async dispose() {
      this.channelId = '';
      this.parentId = undefined;
      await this.messages.dispose();
      await this.input.dispose();
      await this.typing.dispose();
      await this.readReceipts.dispose();
    }

    get search() {
      return this.messages.search;
    }

    get pinned() {
      return this.messages.pinned;
    }


    sendMessage = flow(function*(this: ThreadModel, msg: ViewMessage) {
      msg.clientId = generateHexId();
      msg.userId = this.root.userId;
      msg.channelId = this.channelId;
      msg.parentId = this.parentId ?? null;
      msg.createdAt = new Date().toISOString();
      const ghost = new MessageModel(msg, this.root);
      this.messages.addGhost(ghost);
      const channel = this.root.channels.get(this.channelId);
      if(!channel) {
        throw new Error(`Channel with id ${this.channelId} not found`);
      }
      try {
        const encryptionKey = yield channel.getEncryptionKey();
        const encryptedMessage = yield MessageEncryption.encrypt(msg, encryptionKey);
        const m = yield client.api.sendMessage(encryptedMessage);
        yield this.readReceipts.update(m.id);
        return m;
      }catch(e){
        console.error(e);
        this.messages.getGhost(msg.clientId)?.patch({
          info: {
            type: 'error', msg: 'Sending failed - click to retry', action: 'retry'
          },
        });
      }
    });

    load = flow(function*(this: ThreadModel) {
      yield this.messages.load();
      yield this.readReceipts.load();
    })
}

