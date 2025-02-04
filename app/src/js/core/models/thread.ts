import { makeAutoObservable, flow } from "mobx"
import type { AppModel } from "./app";
import { MessagesModel } from "./messages";
import { client } from "../client";
import { MessageEncryption } from "../tools/messageEncryption";
import { Eid, ViewMessage } from "../../types";
import { MessageModel } from "./message";
import { TypingModel } from "./typing";
import { ThreadReadReceiptsModel } from "./readReceipt";
import { InputModel } from "./input";
import { generateHexId } from "../tools/generateHexId";

type ThreadModelOptions = {
  channelId: Eid;
  parentId?: Eid | null;
  pinned?: boolean;
  search?: string;
}


export class ThreadModel {
    initialized: boolean = false;
    channelId: Eid;
    parentId?: Eid | null;
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

    init = () => {
      if(this.initialized) return;
      this.load();
    }


    sendMessage = async (msg: ViewMessage) => {
      msg.clientId = generateHexId();
      msg.userId = this.root.userId;
      msg.channelId = this.channelId;
      msg.parentId = this.parentId ?? null;
      msg.createdAt = new Date().toISOString();
      const ghost = new MessageModel(msg, this.messages);
      this.messages.addGhost(ghost);
      return await this.postMessage(ghost);
    };

    resendMessage = async (msg: MessageModel) => {
      msg.patch({info: null});
      return await this.postMessage(msg);
    };

    postMessage = flow(function*(this: ThreadModel, msg: MessageModel) {
      const channel = this.root.channels.get(this.channelId);
      if(!channel) {
        throw new Error(`Channel with id ${this.channelId} not found`);
      }
      try {
        const encryptionKey = yield channel.getEncryptionKey();
        const encryptedMessage = yield MessageEncryption.encrypt(msg.toJSON(), encryptionKey);
        const m = yield client.api.sendMessage(encryptedMessage);
        yield this.readReceipts.update(m.id);
        return m;
      }catch(e){
        console.error(e);
        msg.patch({
          info: {
            type: 'error', msg: 'Sending failed - click to retry', action: 'resend'
          },
        });
      }
    });

    load = flow(function*(this: ThreadModel) {
      this.initialized = true;
      yield this.messages.load();
      yield this.readReceipts.load();
    })
}

