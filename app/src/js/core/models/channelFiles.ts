import { flow, makeAutoObservable } from "mobx";
import type { AppModel } from "./app.ts";
import { client } from "../client.ts";
import { MessageFile } from "../../types.ts";
import { generateHexId } from "../tools/generateHexId.ts";

export type PendingUpload = {
  clientId: string;
  fileName: string;
  progress: number;
  error: boolean;
  file: File | null;
};

export class ChannelFilesModel {
  list: MessageFile[] = [];
  channelId: string;
  loading: boolean = false;
  initialized: boolean = false;
  error: boolean = false;
  removeError: boolean = false;
  uploads: PendingUpload[] = [];
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

  setUploadProgress = (clientId: string, progress: number) => {
    const entry = this.uploads.find((u) => u.clientId === clientId);
    if (entry) entry.progress = progress;
  };

  dismissUpload = (clientId: string) => {
    this.uploads = this.uploads.filter((u) => u.clientId !== clientId);
    client.api.files.abort(clientId);
  };

  retryUpload = flow(function* (this: ChannelFilesModel, clientId: string) {
    const entry = this.uploads.find((u) => u.clientId === clientId);
    if (!entry?.file) return;
    entry.error = false;
    entry.progress = 0;
    yield this.upload(clientId, entry.file);
  });

  clearRemoveError = () => {
    this.removeError = false;
  };

  upload = flow(function* (
    this: ChannelFilesModel,
    clientId: string,
    file: File,
  ) {
    try {
      const { status, file: uploaded } = yield client.api.files.upload({
        clientId,
        file,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        onProgress: (p: number) => this.setUploadProgress(clientId, p),
      }, this.channelId, true);
      if (status === "ok" && uploaded) this.onFile(uploaded as MessageFile);
      this.uploads = this.uploads.filter((u) => u.clientId !== clientId);
    } catch (err) {
      console.error(err);
      const entry = this.uploads.find((u) => u.clientId === clientId);
      if (entry) entry.error = true;
    }
  });

  uploadMany = flow(function* (this: ChannelFilesModel, files: FileList) {
    const queued: { clientId: string; file: File }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (!file) continue;
      const clientId = generateHexId();
      this.uploads.push({
        clientId,
        fileName: file.name,
        progress: 0,
        error: false,
        file,
      });
      queued.push({ clientId, file });
    }
    for (const item of queued) {
      yield this.upload(item.clientId, item.file);
    }
  });

  remove = flow(function* (this: ChannelFilesModel, fileId: string) {
    this.removeError = false;
    try {
      yield client.api.files.remove(this.channelId, fileId);
      this.list = this.list.filter((file) => file.id !== fileId);
    } catch (err) {
      console.error(err);
      this.removeError = true;
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
