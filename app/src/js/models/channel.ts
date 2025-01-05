import { makeObservable, observable, computed, action, flow } from "mobx"
import { Channel } from "../types"

export class ChannelState {
    id: string;
    name: string;
    users: string[];
    channelType: 'DIRECT' | 'PRIVATE' | 'PUBLIC';
    

    constructor(value: Channel) {
        makeObservable(this, {
            id: observable,
            name: observable,
            users: observable,
            channelType: observable,
        })
        this.id = value.id
        this.name = value.name
        this.users = value.users
        this.channelType = value.channelType
    }
}
