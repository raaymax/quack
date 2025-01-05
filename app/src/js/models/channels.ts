import { makeObservable, observable, computed, action, flow } from "mobx"
import { Channel } from "../types"
import { client } from "../core"

class ChannelsState {
    channels: Channel[] = []

    constructor(value: Channel[] = []) {
        makeObservable(this, {
            channels: observable,
        })
        this.channels = value 
    }

    *load(): Generator<Promise<Channel[]>> {
      const channels = yield client.api.getChannels();
      this.channels = channels as Channel[];
    }
}
