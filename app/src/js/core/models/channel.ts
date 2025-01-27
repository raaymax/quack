import { makeAutoObservable, observable, computed, action, flow, autorun } from "mobx"
import { Channel } from "../../types"
import { MessagesModel } from "./messages"
import type { AppModel } from "./app";
import * as enc from '@quack/encryption';
import { client } from "../client";


export class ChannelModel {
    id: string;
    name: string;
    users: string[];
    messages: Record<string, MessagesModel>;
    channelType: 'DIRECT' | 'PRIVATE' | 'PUBLIC';
    root: AppModel;

    channelKey: JsonWebKey | null = null;

    constructor(value: Channel, root: AppModel) {
        makeAutoObservable(this, {root: false})
        this.root = root;
        this.id = value.id
        this.name = value.name
        this.users = value.users
        this.channelType = value.channelType
        this.messages = {}
    }

    get user() {
      return this.root.users.get(this.users[0]);
    }

    get otherUser() {
      const me = this.root.userId;
      return this.root.users.get(this.users.find(user => user !== me) || '');
    }

    get isDirect() {
      return this.channelType === 'DIRECT';
    }

    get isPrivate() {
      return this.channelType === 'PRIVATE';
    }

    getMessages = (parentId?: string | null) => {
      const parentKey = parentId || 'null';
      if(this.messages[parentKey]) {
        return this.messages[parentKey]
      }
      this.messages[parentKey] = new MessagesModel({channelId: this.id, parentId}, this.root)
      this.messages[parentKey].load()

      return this.messages[parentKey]
    }

    getPins = () => {
      const parentKey = 'pins';
      if(this.messages[parentKey]) {
        return this.messages[parentKey]
      }
      this.messages[parentKey] = new MessagesModel({channelId: this.id, pinned: true}, this.root)
      this.messages[parentKey].load()

      return this.messages[parentKey]
    }

    getSearch = (search: string) => {
      const parentKey = 'search';
      if(this.messages[parentKey] && this.messages[parentKey].search === search) {
        return this.messages[parentKey]
      }
      this.messages[parentKey] = new MessagesModel({channelId: this.id, search}, this.root)
      this.messages[parentKey].load()

      return this.messages[parentKey]
    }

    load = flow(function*(this: ChannelModel) {
      this.channelKey = yield this.getEncryptionKey();
    })

    patch = (value: Channel) => {
      this.name = value.name
      this.users = value.users
      this.channelType = value.channelType
    }

    getEncryptionKey = async () => {
      if(this.channelKey) return this.channelKey;

      const {privateKey, publicKey} = client.api;

      if(this.channelType === 'DIRECT' && privateKey && publicKey) {
        if( this.otherUser) {
          return await enc.deriveSharedKey(privateKey, this.otherUser.publicKey);
        }

        if(this.users[0] === this.root.userId) {
          return await enc.deriveSharedKey(privateKey, publicKey);
        }

        console.log("Error: Malformed channel");
      }
      return null;
    }
}
