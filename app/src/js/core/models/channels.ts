import { makeAutoObservable, observable, computed, action, flow } from "mobx"
import { Channel, ChannelType, CreateChannelRequest } from "../../types"
import { client } from "../client"
import { ChannelModel } from "./channel"
import type { AppModel } from "./app";

export class ChannelsModel {
    channels: {[id: string]: ChannelModel};
    root: AppModel;

    constructor(root: AppModel) {
      makeAutoObservable(this, {root: false});
      this.channels = {};
      this.root = root;
      client.on('channel', (channel: Channel) => this.add(channel));
      client.on('channel:remove', this.onRemove);
    }

    async dispose() {
      await Promise.all(Object.values(this.channels).map(channel => channel.dispose()));
      this.channels = {};
    }

    add(channel: Channel) {
      if(!this.channels[channel.id]) {
        this.channels[channel.id] = new ChannelModel(channel, this.root);
      }else{
        this.channels[channel.id].patch(channel);
      }
    }

    load = flow(function*(this: ChannelsModel) {
      const channels = yield client.api.getChannels();
      channels.forEach((channel: Channel) => this.add(channel));
    });

    find = flow(function*(this: ChannelsModel, id: string) {
      const channel = yield client.api.getChannelById(id);
      this.channels[channel.id] = new ChannelModel(channel, this.root);
    });

    get(id: string): ChannelModel | null {
      return this.channels[id] ?? null;
    }

    getDirect(userId: string): ChannelModel | null {
      const direct = Object.values(this.channels).find(channel => (
        channel.channelType === 'DIRECT' && channel.users.includes(userId) && channel.users.length === (userId === this.root.userId ? 1 : 2)
      ))
      if(!direct) this.findDirect(userId);
      return direct ?? null;
    };

    getAll(channelType: ChannelType[]) {
      return Object.values(this.channels)
        .filter((channel: ChannelModel) => (
          channelType.length === 0 || channelType.includes(channel.channelType)
        ));
    }

    findDirect = flow(function*(this: ChannelsModel, userId: string) {
      const channel = yield client.api.getDirectChannel(userId);
      if(channel) {
        this.channels[channel.id] = new ChannelModel(channel, this.root);
        return this.channels?.[channel.id];
      }
      return null
    })

    create = flow(function*(this: ChannelsModel, channel: CreateChannelRequest) {
      const created = yield client.api.createChannel(channel);
      this.channels[created.id] = created;
    })

    putDirectChannel = flow(function*(this: ChannelsModel, userId: string) {
      const channel = yield this.findDirect(userId);
      if(channel) return channel;
      return yield client.api.putDirectChannel(userId);
    })

    onRemove = (id: string) => {
      delete this.channels[id];
    }
}
