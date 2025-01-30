import { makeAutoObservable, observable, computed, action, flow, autorun } from "mobx"
import { Channel } from "../../types"
import type { AppModel } from "./app";
import * as enc from '@quack/encryption';
import { client } from "../client";
import { ThreadModel } from "./thread";


export class ChannelModel {
    id: string;
    name: string;
    users: string[];
    threads: Record<string, ThreadModel>;
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
        this.threads = {}
    }

    async dispose() {
      this.id = '';
      this.name = '';
      this.users = [];
      this.channelType = 'DIRECT';
      this.channelKey = null;
      await Promise.all(Object.values(this.threads).map(thread => thread.dispose()));
      this.threads = {};
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

    getThread = (key?: string | null, opts: {parentId?: string | null, pinned?: boolean, search?: string} = {}) => {
      const parentKey = key || 'null';
      if (key === 'search') {
        if (opts.search != this.threads[parentKey]?.search) {
          this.threads[parentKey] = new ThreadModel({channelId: this.id, ...opts}, this.root)
          this.threads[parentKey].load();
        }
        return this.threads[parentKey]
      }

      if(this.threads[parentKey]) {
        return this.threads[parentKey]
      }
      this.threads[parentKey] = new ThreadModel({channelId: this.id, ...opts}, this.root)
      this.threads[parentKey].load()

      return this.threads[parentKey]
    }


    getMessages = (parentId?: string | null) => {
      return this.getThread(parentId).messages
    }

    getPins = () => {
      return this.getThread('pins', {pinned: true}).messages
    }

    getSearch = (search: string) => {
      return this.getThread('search', {search}).messages
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
