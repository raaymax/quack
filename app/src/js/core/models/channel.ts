import { makeObservable, observable, computed, action, flow } from "mobx"
import { Channel } from "../../types"
import { MessagesModel } from "./messages.ts"

export class ChannelModel {
    id: string;
    name: string;
    users: string[];
    messages: Record<string, MessagesModel>;
    channelType: 'DIRECT' | 'PRIVATE' | 'PUBLIC';
    

    constructor(value: Channel) {
        makeObservable(this, {
            id: observable,
            name: observable,
            users: observable,
            channelType: observable,
            messages: observable,
        })
        this.id = value.id
        this.name = value.name
        this.users = value.users
        this.channelType = value.channelType
        this.messages = {}
    }

    getMessages = flow(function*(this: ChannelModel, parentId: string | null | undefined) {
      const parentKey = parentId || 'null';
      if(this.messages[parentKey]) {
        return this.messages[parentKey]
      }
      this.messages[parentKey] = new MessagesModel(this.id, parentId, [])
      yield this.messages[parentKey].load()
      return this.messages[parentKey]
    })
}
