import type { AppModel } from "./app"
import { makeAutoObservable, observable, computed, action, flow, autorun } from "mobx"
import { Eid, File, User } from "../../types"
import { client } from "../client"

export class FileModel {
  id: string;
  clientId: string;
  streamId: string;
  status: string;
  fileSize: number;
  fileName: string;
  contentType: string;
  progress: number;
  file: {
    name: string;
    type: string;
    size: number;
  };

    root: AppModel;

    constructor(value: File, root: AppModel) {
      makeAutoObservable(this, {root: false});
      this.id = value.id;
      this.clientId = value.clientId;
      this.streamId = value.streamId;
      this.status = value.status;
      this.fileSize = value.fileSize;
      this.fileName = value.fileName;
      this.contentType = value.contentType;
      this.progress = value.progress;
      this.file = value.file;
      
      this.root = root;
    }
    patch = (value: File) => {
      this.fileSize = value.fileSize;
      this.fileName = value.fileName;
      this.contentType = value.contentType;
      this.progress = value.progress;
      this.file = value.file;
    }
}

export class FilesModel {
  list: FileModel[];

  root: AppModel;

  constructor(root: AppModel) {
    makeAutoObservable(this, {root: false});
    this.root = root;
    this.list = [];
  }

  getAll() {
    return this.list;
  }

  add(file: File) {
    this.list.push(new FileModel(file, this.root));
  }

  patch = (file: File) => {
    const f = this.list.find((f) => f.id === file.id);
    if(f) f.patch(file);
  }

  abort = (id: string) => {
    const idx = this.list.findIndex((f) => f.id === id);
    if(idx !== -1) this.list.splice(idx, 1);
  }
}
