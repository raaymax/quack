import { makeAutoObservable } from "mobx"
import type { AppModel } from "./app";
import { client } from "../client";
import { isSameThread } from "../tools/sameThread";

type TypingModelOptions = {
  channelId: string;
  parentId?: string | null;
}

export class TypingModel {
  channelId: string;
  parentId?: string | null;

  typings: { [userId: string]: Date}

  root: AppModel;
  _dispose: () => void;
  _cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: TypingModelOptions, root: AppModel) {
    makeAutoObservable(this, {
      root: false,
      _dispose: false,
      _cleanupTimer: false,
    })
    this.channelId = opts.channelId;
    this.parentId = opts.parentId;

    this.root = root;
    this.typings = {};
    this._dispose = client.on2('typing', (msg) => this.onTyping(msg));
  }

  async dispose() {
    this.channelId = '';
    this.parentId = undefined;
    this.typings = {};
    this._dispose?.();
  }

  onTyping = (typing: { userId: string, channelId: string, parentId?: string }) => {
    if(isSameThread(typing, this)) {
      this.typings[typing.userId] = new Date();
    }

    if(this._cleanupTimer) clearTimeout(this._cleanupTimer);
    this._cleanupTimer = setTimeout(this.cleanup, 1000);
  }

  cleanup = () => {
    this.typings = Object.fromEntries(
      Object.entries(this.typings)
        .filter(([_, date]) => new Date() < new Date(date.getTime() + 1000))
    );
  }

  getStatusLine = () => {
    const now = new Date();
    const typings = Object.entries(this.typings)
      .filter(([_, date]) => now < new Date(date.getTime() + 1000))
      .map(([userId,_]) => userId);

    if(typings.length === 0) {
      return '';
    }
    if(typings.length === 1) {
      return `${this.root.users.get(typings[0])?.name} is typing...`;
    }
    return `${typings.map((userId) => this.root.users.get(userId)?.name).join(', ')} are typing...`;
  }
}
