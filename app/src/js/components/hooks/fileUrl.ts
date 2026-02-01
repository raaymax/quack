import { client } from "../../core";

export const getFileUrl = (fileId?: string): string | undefined => {
  if (!fileId) return undefined;
  return client.api.getUrl(fileId);
};

export const getThumbnailUrl = (
  fileId?: string,
  options?: { h?: number },
): string | undefined => {
  if (!fileId) return undefined;
  return client.api.getThumbnail(fileId, options);
};

export const getDownloadUrl = (fileId?: string): string | undefined => {
  if (!fileId) return undefined;
  return client.api.getDownloadUrl(fileId);
};
