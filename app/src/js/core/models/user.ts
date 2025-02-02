/* global JsonWebKey */
import type { AppModel } from "./app"
import { makeAutoObservable, flow } from "mobx"
import { Eid, User } from "../../types"

export class UserModel {
    id: Eid;
    alias: string | null;
    email: string;
    name: string;
    avatarFileId: string;
    status?: "active" | "inactive" | "away";
    lastSeen?: string;
    publicKey: JsonWebKey;
    privateKey?: JsonWebKey;
    hidden?: boolean;

    channelId: string | null = null;
    root?: AppModel;

    constructor(value: User, root?: AppModel) {
      makeAutoObservable(this, {root: false});
      this.id = value.id;
      this.alias = value.alias ?? null;
      this.email = value.email;
      this.name = value.name;
      this.avatarFileId = value.avatarFileId;
      this.status = value.status;
      this.lastSeen = value.lastSeen;
      this.publicKey = value.publicKey;
      this.hidden = value.hidden;


      this.root = root;
      this.loadChannel();
    }

    async dispose() {
      this.id = '';
      this.alias = null;
      this.email = '';
      this.name = '';
      this.avatarFileId = '';
      this.status = undefined;
      this.lastSeen = undefined;
      this.publicKey = {} as JsonWebKey;
      this.privateKey = undefined;
      this.hidden = undefined;
      this.channelId = null;
    }

    get channel() {
      if(!this.root) throw new Error('Root not set');
      return this.root.channels.get(this.channelId || '');
    }

    patch = (value: User) => {
      this.name = value.name
    }

    loadChannel = flow(function*(this: UserModel) {
      if(!this.root) throw new Error('Root not set');
      if(this.channelId) return this.channelId;
      const direct = yield this.root.channels.findDirect(this.id);
      if(direct){
        this.channelId = direct.id;
        return direct.id;
      }
    });
}
