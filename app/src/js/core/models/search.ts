import { flow, makeAutoObservable } from "mobx";
import type { AppModel } from "./app.ts";
import { MessagesModel } from "./messages.ts";
import { Eid } from "../../types.ts";
import { runInAction } from "mobx";

type SearchModelOptions = {
  channelId: Eid;
  parentId?: Eid | null;
  search?: string;
};

export class SearchModel {
  initialized: boolean = false;
  text: string | null = null;
  channelId: Eid;
  parentId?: Eid | null;
  messages: MessagesModel | null = null;
  open: boolean = false;

  root: AppModel;

  constructor(opts: SearchModelOptions, root: AppModel) {
    makeAutoObservable(this, {
      root: false,
    });
    this.channelId = opts.channelId;
    this.parentId = opts.parentId;
    this.messages = null;
    this.root = root;
  }

  async find(text: string) {
    this.close();
    setTimeout(() => {
      runInAction(() => {
        this.open = true;
        this.text = text;
        this.messages = new MessagesModel(
          { 
            search: text,
            channelId: this.channelId,
          },
          this.root,
        );
        this.messages.init();
      })
    }, 500);
  }

  getMessages() {
    return this.messages;
  }

  close() {
    this.open = false;
    this.messages = null;
    this.text = null;
    if (!this.messages) return;
    this.messages.dispose();
  }

  async dispose() {
    if (this.messages) {
      await this.messages.dispose();
      this.messages = null;
    }
  }

  init = () => {
    if (this.initialized) return;
    this.load();
  };

  load = flow(function* (this: SearchModel) {
    this.initialized = true;

    yield this.messages?.load();
  });
}
