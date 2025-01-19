import { makeObservable, observable, computed, action, flow } from "mobx"
import { ChannelsModel } from "./channels.ts"

export class AppModel {
  channels: ChannelsModel;

  constructor() {
      makeObservable(this, {
          channels: observable,
      })
      this.channels = new ChannelsModel()
  }

  getChannel(channelId: string) {
    return this.channels.get(channelId);
  }

  init = flow(function*(this: AppModel) {
    console.log("AppModel.init", this);
    yield this.channels.load();
  })
}
