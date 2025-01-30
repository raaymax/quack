import type { AppModel } from "./app"
import { makeAutoObservable, flow } from "mobx"
import { FileUpload, client } from "../client"
import { generateHexId } from "../tools/generateHexId";


type FileUploadPatch = FileUpload & { id: string, status: string, progress: number, error: string | null };

export class FileModel {
  id?: string;
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
    makeAutoObservable(this, {root: false});
    this.clientId = value.clientId;
    this.stream = value.stream;
    this.status = 'pending';
    this.fileSize = value.fileSize;
    this.fileName = value.fileName;
    this.contentType = value.contentType;
    this.progress = 0;
    
    this.root = root;
  }

  async dispose() {
    this.id = undefined;
    this.clientId = '';
    this.stream = null as any;
    this.status = 'pending';
    this.fileSize = 0;
    this.fileName = '';
    this.contentType = '';
    this.progress = 0;
    this.error = null;
  }

  patch = (value: Partial<FileUploadPatch>) => {
    this.id = value.id;
    if(value.status) this.status = value.status;
    if(value.fileSize) this.fileSize = value.fileSize;
    if(value.fileName) this.fileName = value.fileName;
    if(value.contentType) this.contentType = value.contentType;
    if(value.progress) this.progress = value.progress;
    if(value.error) this.error = value.error;
  }

  onProgress = (progress: number) => {
    this.progress = progress;
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

  async dispose() {
    this.list.forEach((f) => this.abort(f.clientId));
    await Promise.all(this.list.map(file => file.dispose()));
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
    if(f) f.patch(file);
  }

  isReady() {
    return this.list.length === 0 || this.list.every((f) => f.status === 'ok');
  }
  
  clear() {
    this.list = [];
  }

  abort = (clientId: string) => {
    client.api.files.abort(clientId);

    const idx = this.list.findIndex((f) => f.clientId === clientId);
    if(idx !== -1) this.list.splice(idx, 1);
  }

  uploadMany = flow(function*(this: FilesModel, files: FileList){
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (!file) continue;
      yield this.uplaod(file);
    }
  })

  uplaod = flow(function*(this: FilesModel, file: File) {
    const local = new FileModel({
      clientId: generateHexId(),
      stream: file.stream(),
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
    }, this.root);

    this.list.push(local);

    try {
      const { status, id: fileId } = yield client.api.files.upload(local);

      if (status === 'ok') {
        local.patch({ status, id: fileId, progress: 100 });
      } else {
        local.patch({ status, progress: 0, error: 'something went wrong' });
      }
    } catch (err) {
      if (err instanceof Error) {
        local.patch({ status: 'error', progress: 0, error: err.message });
        return;
      }
      console.error(err);
      local.patch({ status: 'error', progress: 0, error: 'unknown error' });
    }
  })
  toJSON(): any {
    return this.list.map((f) => ({
      id: f.id,
      clientId: f.clientId,
      fileName: f.fileName,
      fileSize: f.fileSize,
      contentType: f.contentType,
    }));
  }
}
