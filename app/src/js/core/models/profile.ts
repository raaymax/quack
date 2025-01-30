import type { AppModel } from "./app"
import { makeAutoObservable, observable, computed, action, flow, autorun } from "mobx"
import { Eid, User } from "../../types"

export class ProfileModel {
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
    root: AppModel;

    constructor(value: User, root: AppModel) {
      makeAutoObservable(this, {root: false});
      this.id = value.id;
      this.alias = value.alias;
      this.email = value.email;
      this.name = value.name;
      this.avatarFileId = value.avatarFileId;
      this.status = value.status;
      this.lastSeen = value.lastSeen;
      this.publicKey = value.publicKey;
      this.hidden = value.hidden;

      this.root = root;
    }

    async dispose() {
      this.id = '';
      this.alias = null;
      this.email = '';
      this.name = '';
      this.avatarFileId = '';
      this.status = undefined;
      this.lastSeen = undefined;
      this.publicKey = undefined as any;
      this.privateKey = undefined as any;
      this.hidden = undefined;
      this.channelId = null;
    }

    get channel() {
      return this.root.channels.get(this.channelId || '');
    }
}
