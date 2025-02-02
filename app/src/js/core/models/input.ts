import { makeAutoObservable, flow } from "mobx"
import type { AppModel } from "./app";
import { FilesModel } from "./files";
import { ThreadModel } from "./thread";
import { fromDom } from "../../serializer";
import { client } from "../client";


type InputModelOptions = {
  channelId: string;
  parentId?: string | null;
}

export class InputModel {
  channelId: string;
  parentId?: string | null;

  files: FilesModel;
  thread: ThreadModel;

  root: AppModel;

  constructor(opts: InputModelOptions, thread: ThreadModel, root: AppModel) {
    makeAutoObservable(this, {
      root: false,
      thread: false,
    })
    this.channelId = opts.channelId;
    this.parentId = opts.parentId;
    this.files = new FilesModel(root);
    this.thread = thread;

    this.root = root;
  }

  async dispose() {
    this.channelId = '';
    this.parentId = null;
    await this.files.dispose();
  }

  isReady() {
    this.files.isReady();
  }

  send = flow(function*(this: InputModel, html: HTMLElement) {
    const payload: any = fromDom(html);
    html.innerHTML = '';
    payload.attachments = this.files.toJSON();
    if (payload.flat.length === 0 && payload.attachments.length === 0) return;
    const m = payload.flat.match('/([^ ]+)( (.*))?')
    if(m) {
      yield client.api.sendCommand({
        name: m[1],
        text: m[3] ?? '',
        attachments: payload.attachments,
        context: {
          channelId: this.channelId,
          parentId: this.parentId || undefined,
        }
      })
    }else{
      yield this.thread.sendMessage(payload);
    }
    this.files.clear();
  });
}

