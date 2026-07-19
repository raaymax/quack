import { flow, makeAutoObservable } from "mobx";
import type { AppModel } from "./app.ts";
import { client } from "../client.ts";
import { MessageFile } from "../../types.ts";

export class ChannelFilesModel {
  list: MessageFile[] = [];
  channelId: string;
  loading: boolean = false;
  initialized: boolean = false;
  error: boolean = false;
  root: AppModel;

  private unsubscribers: (() => void)[] = [];

  constructor(channelId: string, root: AppModel) {
    makeAutoObservable(this, { root: false });
    this.channelId = channelId;
    this.root = root;
    this.unsubscribers = [
      client.on2("file", (file: MessageFile) => this.onFile(file)),
      client.on2(
        "file:removed",
        (msg: { id: string; channelId: string }) => this.onRemoved(msg),
      ),
    ];
  }

  async dispose() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    this.list = [];
    this.initialized = false;
  }

  getAll() {
    return this.list;
  }

  init = () => {
    if (this.initialized || this.loading) return;
    this.load();
  };

  load = flow(function* (this: ChannelFilesModel) {
    this.loading = true;
    this.error = false;
    try {
      const fetched: MessageFile[] = yield client.api.files.list(
        this.channelId,
      );
      const missed = this.list.filter(
        (file) => !fetched.some((f) => f.id === file.id),
      );
      this.list = [...fetched, ...missed];
      this.initialized = true;
    } catch (err) {
      console.error(err);
      this.error = true;
    } finally {
      this.loading = false;
    }
  });

  remove = flow(function* (this: ChannelFilesModel, fileId: string) {
    try {
      yield client.api.files.remove(this.channelId, fileId);
      this.list = this.list.filter((file) => file.id !== fileId);
    } catch (err) {
      console.error(err);
    }
  });

  onFile = (file: MessageFile) => {
    if (file.channelId !== this.channelId) return;
    if (file.status !== "attached") return;
    const idx = this.list.findIndex((f) => f.id === file.id);
    if (idx === -1) this.list.push(file);
    else this.list[idx] = file;
  };

  onRemoved = (msg: { id: string; channelId: string }) => {
    if (msg.channelId !== this.channelId) return;
    this.list = this.list.filter((file) => file.id !== msg.id);
  };
}
