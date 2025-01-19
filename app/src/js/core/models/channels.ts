import { makeObservable, observable, computed, action, flow } from "mobx"
import { Channel } from "../../types"
import { client } from "../client"
import { ChannelModel } from "./channel"

export class ChannelsModel {
    channels: ChannelModel[] = []

    constructor(value: Channel[] = []) {
        makeObservable(this, {
            channels: observable,
        })
        this.channels = value.map((channel) => new ChannelModel(channel))
    }

    load = flow(function*(this: ChannelsModel) {
      console.log("ChannelsModel.load");
      const channels = yield client.api.getChannels();
      this.channels = channels.map((channel: Channel) => new ChannelModel(channel))
    })

    get(id: string) {
      return this.channels.find((c) => c.id === id);
    }
}
