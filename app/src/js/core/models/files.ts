import type { AppModel } from "./app.ts";
import { flow, makeAutoObservable } from "mobx";
import { client, FileUpload } from "../client.ts";
import { generateHexId } from "../tools/generateHexId.ts";

type FileUploadPatch = FileUpload & {
  id: string;
  storageId: string;
  status: string;
  progress: number;
  error: string | null;
};

export class FileModel {
  id?: string;
  storageId?: string;
  clientId: string;
  stream: ReadableStream;
  status: string;
  fileSize: number;
  fileName: string;
  contentType: string;
  progress: number;
  error: string | null = null;

  root: AppModel;

  constructor(value: FileUpload, root: AppModel) {
    makeAutoObservable(this, { root: false });
    this.clientId = value.clientId;
    this.stream = value.stream;
    this.status = "pending";
    this.fileSize = value.fileSize;
    this.fileName = value.fileName;
    this.contentType = value.contentType;
    this.progress = 0;

    this.root = root;
  }

  async dispose() {
    this.id = undefined;
    this.storageId = undefined;
    this.clientId = "";
    this.stream = null as unknown as ReadableStream;
    this.status = "pending";
    this.fileSize = 0;
    this.fileName = "";
    this.contentType = "";
    this.progress = 0;
    this.error = null;
  }

  patch = (value: Partial<FileUploadPatch>) => {
    if (value.id !== undefined) this.id = value.id;
    if (value.storageId !== undefined) this.storageId = value.storageId;
    if (value.status) this.status = value.status;
    if (value.fileSize) this.fileSize = value.fileSize;
    if (value.fileName) this.fileName = value.fileName;
    if (value.contentType) this.contentType = value.contentType;
    if (value.progress) this.progress = value.progress;
    if (value.error) this.error = value.error;
  };

  onProgress = (progress: number) => {
    this.progress = progress;
  };
}

export class FilesModel {
  list: FileModel[];

  channelId: string;

  root: AppModel;

  constructor(root: AppModel, channelId: string) {
    makeAutoObservable(this, { root: false });
    this.root = root;
    this.channelId = channelId;
    this.list = [];
  }

  async dispose() {
    this.list.forEach((f) => this.abort(f.clientId));
    await Promise.all(this.list.map((file) => file.dispose()));
    this.list = [];
  }

  getAll() {
    return this.list;
  }

  add(file: FileUpload) {
    this.list.push(new FileModel(file, this.root));
  }

  patch = (file: FileUploadPatch) => {
    const f = this.list.find((f) => f.id === file.id);
    if (f) f.patch(file);
  };

  isReady() {
    return this.list.length === 0 || this.list.every((f) => f.status === "ok");
  }

  clear() {
    this.list = [];
  }

  abort = (clientId: string) => {
    client.api.files.abort(clientId);

    const idx = this.list.findIndex((f) => f.clientId === clientId);
    if (idx !== -1) this.list.splice(idx, 1);
  };

  uploadMany = flow(function* (this: FilesModel, files: FileList) {
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (!file) continue;
      yield this.uplaod(file);
    }
  });

  uplaod = flow(function* (this: FilesModel, file: File) {
    const local = new FileModel({
      clientId: generateHexId(),
      stream: file.stream(),
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
    }, this.root);

    this.list.push(local);

    try {
      const { status, file } = yield client.api.files.upload(
        local,
        this.channelId,
      );

      if (status === "ok" && file) {
        local.patch({
          status,
          id: file.id,
          storageId: file.storageId,
          progress: 100,
        });
      } else {
        local.patch({ status, progress: 0, error: "something went wrong" });
      }
    } catch (err) {
      if (err instanceof Error) {
        local.patch({ status: "error", progress: 0, error: err.message });
        return;
      }
      console.error(err);
      local.patch({ status: "error", progress: 0, error: "unknown error" });
    }
  });
  toJSON(): Array<{ id?: string; clientId: string; fileName: string; fileSize: number; contentType: string }> {
    return this.list.map((f) => ({
      id: f.storageId,
      clientId: f.clientId,
      fileName: f.fileName,
      fileSize: f.fileSize,
      contentType: f.contentType,
    }));
  }

  fileIds(): string[] {
    return this.list
      .filter((f) => f.status === "ok" && f.id)
      .map((f) => f.id as string);
  }

  toFiles() {
    return this.list
      .filter((f) => f.status === "ok" && f.id && f.storageId)
      .map((f) => ({
        id: f.id as string,
        storageId: f.storageId as string,
        channelId: this.channelId,
        uploaderId: this.root.userId ?? "",
        fileName: f.fileName,
        contentType: f.contentType,
        size: f.fileSize,
        resolution: null,
        status: "attached" as const,
        messageId: null,
        createdAt: new Date().toISOString(),
      }));
  }
}
