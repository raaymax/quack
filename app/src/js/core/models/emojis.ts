import { makeAutoObservable, observable, computed, action, flow } from "mobx"
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
    }

    load = flow(function*(this: EmojisModel) {
      const emojis = yield client.api.getEmojis();
      const {default: baseEmojis} = yield import('../../../assets/emoji_list.json');
      [...baseEmojis, ...emojis].forEach((emoji: Emoji) => {
        if(!this.emojis[emoji.shortname]) {
          this.emojis[emoji.shortname] = new EmojiModel(emoji, this.root);
        }else{
          this.emojis[emoji.shortname].patch(emoji);
        }
      });
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
