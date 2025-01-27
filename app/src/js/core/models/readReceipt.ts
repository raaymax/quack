import type { AppModel } from "./app"
import { makeAutoObservable, observable, computed, action, flow, autorun } from "mobx"
import { Eid, ReadReceipt, User } from "../../types"
import { client } from "../client"

export class ReadReceiptModel {
    id: Eid;
    channelId: Eid;
    parentId: Eid;
    userId: Eid;
    count: number;
    lastRead: Date;
    lastMessageId: Eid;

    root: AppModel;

    constructor(value: ReadReceipt, root: AppModel) {
      makeAutoObservable(this, {root: false});
      this.id = value.id;
      this.channelId = value.channelId;
      this.parentId = value.parentId;
      this.userId = value.userId;
      this.count = value.count;
      this.lastRead = new Date(value.lastRead);
      this.lastMessageId = value.lastMessageId;
      
      this.root = root;
    }
    patch = (value: ReadReceipt) => {
      this.count = value.count;
      this.lastRead = new Date(value.lastRead);
      this.lastMessageId = value.lastMessageId;
    }
}

export class ReadReceiptsModel {
  list: ReadReceiptModel[];

  root: AppModel;

  constructor(root: AppModel) {
    makeAutoObservable(this, {root: false});
    this.root = root;
    this.list = [];
  }

  load = flow(function*(this: ReadReceiptsModel) {
    const receipts = yield client.api.getOwnReadReceipts();
    receipts.forEach((receipt: ReadReceipt) => {
      if(!this.list.find((r) => r.id === receipt.id)) {
        this.list.push(new ReadReceiptModel(receipt, this.root));
      }else{
        this.list.find((r) => r.id === receipt.id)?.patch(receipt);
      }
    });
  })
  
  getMap = (parentId?: Eid) => {
    return this.list.filter((r) => !parentId || r.parentId === parentId)
      .reduce((acc, p) => ({
        ...acc,
        [p.channelId]: p.count,
      }), {});
  }
}
