import { flow, makeAutoObservable } from "mobx";
import { ChannelsModel } from "./channels";
import { UsersModel } from "./users";
import { UserModel } from "./user";
import { client } from "../client";
import { initNotifications } from "../notifications";
import { EmojisModel } from "./emojis";
import { ReadReceiptsModel } from "./readReceipt";
import { InfoModel } from "./info";

export class AppModel {
  profile: UserModel | null;
  channels: ChannelsModel;
  users: UsersModel;
  emojis: EmojisModel;
  readReceipts: ReadReceiptsModel;
  mainChannelId: string | null = null;
  status: "connected" | "disconnected" = "disconnected";
  initFailed: boolean = false;
  loading: boolean = false;
  loadingTimeout: number = 0;
  info: InfoModel;
  _init: Promise<void> | null = null;

  constructor() {
    makeAutoObservable(this);
    this.channels = new ChannelsModel(this);
    this.users = new UsersModel(this);
    this.emojis = new EmojisModel(this);
    this.readReceipts = new ReadReceiptsModel(this);
    this.info = new InfoModel({}, this);
    this.profile = null;
    client.on2("con:close", () => this.info.setMessage("connecting..."));
    client.on2(
      "con:open",
      () => Promise.all([this.info.setMessage(null), this.init()]),
    );
  }

  async dispose() {
    await Promise.all([
      this.channels.dispose(),
      this.users.dispose(),
      this.emojis.dispose(),
      this.readReceipts.dispose(),
      this.profile?.dispose(),
    ]);
    this.profile = null;
  }

  get userId() {
    if (!client.api.userId) {
      throw new Error("User id not set");
    }
    return client.api.userId;
  }

  getChannel(channelId: string) {
    return this.channels.get(channelId);
  }

  getThread(
    channelId: string,
    parentId?: string | null,
    opts: { init?: boolean } = {},
  ) {
    const channel = this.getChannel(channelId);
    if (!channel) {
      throw new Error(`Channel with id ${channelId} not found`);
    }
    return channel.getThread(parentId, { parentId, ...opts });
  }

  getMessages(channelId: string, parentId?: string | null) {
    const channel = this.getChannel(channelId);
    if (!channel) {
      throw new Error(`Channel with id ${channelId} not found`);
    }
    return channel.getMessages(parentId);
  }

  getPins(channelId: string) {
    const channel = this.getChannel(channelId);
    if (!channel) {
      return null;
    }
    return channel.getPins();
  }

  getSearch(channelId: string, search: string) {
    const channel = this.getChannel(channelId);
    if (!channel) {
      return null;
    }
    return channel.getSearch(search);
  }

  loadConfig = flow(function* (this: AppModel) {
    const config = yield client.api.getUserConfig();
    this.mainChannelId = config.mainChannelId;
  });

  load = flow(function* (this: AppModel) {
    try {
      yield this.loadConfig();
      yield initNotifications(this);
      yield this.channels.load();
      yield this.users.load();
      yield this.emojis.load();
      yield this.readReceipts.load();
      this.profile = this.users.get(this.userId) ?? null;
    } catch (e) {
      console.error(e);
      this.initFailed = true;
    }
  });

  init = async () => {
    if (this._init) return this._init;
    this._init = this.load();
    return this._init;
  };

  setLoading = (loading: boolean) => {
    if(loading) {
      clearTimeout(this.loadingTimeout);
      this.loading = true;
      this.loadingTimeout = setTimeout(() => {
        this.loading = false;
      }, 5000);
      return
    } else {
      clearTimeout(this.loadingTimeout);
      this.loading = false;
    }
  };
}
