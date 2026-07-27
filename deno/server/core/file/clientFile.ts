import { FileEntry } from "../../types.ts";

export type ClientFile = Omit<FileEntry, "storageId">;

export const toClientFile = (file: FileEntry): ClientFile => {
  const { storageId: _storageId, ...rest } = file;
  return rest;
};
