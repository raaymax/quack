import { makeAutoObservable, flow } from "mobx"
import type { Emoji } from "@quack/api"
import { client } from "../client"
import type { AppModel } from "./app";
import Fuse from "fuse.js";

export class EmojiModel {
  empty?: boolean;
  unicode?: string;
  fileId?: string;
  shortname: string;
  category?: string;

  root: AppModel;

  constructor(value: Emoji, root: AppModel) {
    makeAutoObservable(this, {root: false})
    this.root = root;
    this.shortname = value.shortname;
    this.patch(value);
  }

  async dispose() {
    this.empty = undefined;
    this.unicode = undefined;
    this.fileId = undefined
    this.category = undefined;
    this.shortname = '';
  }

  patch = (value: Emoji) => {
    this.empty = value.empty;
    this.unicode = value.unicode;
    this.fileId = value.fileId;
    this.category = value.category;
  }
}

export class EmojisModel {
    emojis: {[id: string]: EmojiModel};
    root: AppModel;

    constructor(root: AppModel) {
        makeAutoObservable(this, {
          root: false,
        })
        this.root = root;
        this.emojis = {};
        client.on('emoji', (emoji: Emoji) => this.upsert(emoji));
    }

    async dispose() {
      await Promise.all(Object.values(this.emojis).map(emoji => emoji.dispose()));
      this.emojis = {};
    }

    upsert(emoji: Emoji) {
      if(!this.emojis[emoji.shortname]) {
        this.emojis[emoji.shortname] = new EmojiModel(emoji, this.root);
      }else{
        this.emojis[emoji.shortname].patch(emoji);
      }
    }

    load = flow(function*(this: EmojisModel) {
      const emojis = yield client.api.getEmojis();
      const {default: baseEmojis} = yield import('../../../assets/emoji_list.json');
      [...baseEmojis, ...emojis].forEach((emoji: Emoji) => this.upsert(emoji));
    })

    get(shortname: string) {
      return this.emojis[shortname];
    }

    getAll() {
      return Object.values(this.emojis)
    }

    getFuse() {
      return new Fuse(Object.values(this.emojis).filter((e: Emoji) => !e.empty), {
        findAllMatches: true,
        includeMatches: true,
        keys: [
          'name',
          'shortname',
        ],
      });
    }
}
