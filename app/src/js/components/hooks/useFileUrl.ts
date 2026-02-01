import { client } from "../../core";

export const useFileUrl = (fileId?: string): string | undefined => {
  if (!fileId) return undefined;
  return client.api.getUrl(fileId);
};

export const useThumbnailUrl = (
  fileId?: string,
  options?: { h?: number },
): string | undefined => {
  if (!fileId) return undefined;
  return client.api.getThumbnail(fileId, options);
};

export const useDownloadUrl = (fileId?: string): string | undefined => {
  if (!fileId) return undefined;
  return client.api.getDownloadUrl(fileId);
};
