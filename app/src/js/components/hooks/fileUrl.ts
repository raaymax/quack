import { client } from "../../core";

export const getFileUrl = (fileId?: string): string | undefined => {
  if (!fileId) return undefined;
  return client.api.getUrl(fileId);
};
