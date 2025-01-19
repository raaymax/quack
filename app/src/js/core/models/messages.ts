import { client } from "../client";
import { Message } from "../../types";
import { makeObservable, observable, computed, action, flow } from "mobx"

export class MessagesModel {
  channelId: string = '';
  parentId: string | null | undefined = null;
  list: Message[] = [];

  constructor(channelId: string, parentId: string | null | undefined, value: any[] = []) {
      makeObservable(this, {
          list: observable,
          latest: computed,
          oldest: computed,
          load: flow,
          loadPrev: flow,
          loadNext: flow,
      })
      this.channelId = channelId
      this.parentId = parentId
      this.list = value
  }

  get latest() {
    return this.list[0];
  }

  get oldest() {
    return this.list[this.list.length - 1];
  }

  load = flow( function*(this: MessagesModel) {
    const messages = yield client.messages.fetch({
      channelId: this.channelId,
      parentId: this.parentId,
      limit: 50,
    });
    this.list = messages as any[];
    return this.list;
  })

  loadPrev = flow(function*(this: MessagesModel) {
    const messages = yield client.messages.fetch({
      channelId: this.channelId,
      parentId: this.parentId,
      before: this.oldest.id,
      limit: 50,
    });
    this.list = [...messages as any[], ...this.list];
    return messages;
  })

  loadNext = flow(function*(this: MessagesModel) {
    const messages = yield client.messages.fetch({
      channelId: this.channelId,
      parentId: this.parentId,
      after: this.oldest.id,
      limit: 50,
    });
    this.list = [...this.list, ...messages as any[]];
    return messages;
  })
}
