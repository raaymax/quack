import { flow, makeAutoObservable } from "mobx";
import { ChannelsModel } from "./channels.ts";
import { UsersModel } from "./users.ts";
import { UserModel } from "./user.ts";
import { client } from "../client.ts";
import { initNotifications } from "../notifications.ts";
import { EmojisModel } from "./emojis.ts";
import { ReadReceiptsModel } from "./readReceipt.ts";
import { InfoModel } from "./info.ts";
import { SearchModel } from "./search.ts";

export class AppModel {
  profile: UserModel | null;
  channels: ChannelsModel;
  users: UsersModel;
  emojis: EmojisModel;
  readReceipts: ReadReceiptsModel;
  search: SearchModel;
  mainChannelId: string | null = null;
  status: "connected" | "disconnected" = "disconnected";
  initFailed: boolean = false;
  loading: boolean = false;
  loadingTimeout: number = 0;
  info: InfoModel;
  searchText: string | null = null;
  _init: Promise<void> | null = null;

  constructor() {
    makeAutoObservable(this);
    this.channels = new ChannelsModel(this);
    this.users = new UsersModel(this);
    this.emojis = new EmojisModel(this);
    this.readReceipts = new ReadReceiptsModel(this);
    this.info = new InfoModel({}, this);
    this.search = new SearchModel({}, this);
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

  setSearch(channelId: string, search: string) {
    const channel = this.getChannel(channelId);
    if (!channel) {
      return null;
    }
    channel.search.find(search);
  }

  clearSearch(channelId: string) {
    const channel = this.getChannel(channelId);
    if (!channel) {
      return null;
    }
    channel.search.close();
  }

  getSearch(channelId: string) {
    const channel = this.getChannel(channelId);
    if (!channel) {
      return null;
    }
    return channel.search;
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
    if (loading) {
      clearTimeout(this.loadingTimeout);
      this.loading = true;
      this.loadingTimeout = setTimeout(() => {
        this.loading = false;
      }, 5000);
      return;
    } else {
      clearTimeout(this.loadingTimeout);
      this.loading = false;
    }
  };
}
