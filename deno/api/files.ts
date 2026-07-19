import type API from "./mod.ts";
import { FileUpload } from "./types.ts";
import { MessageFile } from "./messageTypes.ts";

export type UploadResult = { status: string; file: MessageFile };

export class FilesAPI {
  aborts: Record<string, () => void> = {};
  api: API;

  constructor(api: API) {
    this.api = api;
  }

  list = async (channelId: string): Promise<MessageFile[]> => {
    const res = await this.api.fetchWithCredentials(
      `/api/channels/${channelId}/files`,
      { method: "GET" },
    );
    if (!res.ok) {
      await res.body?.cancel();
      throw new Error(`Failed to list channel files (${res.status})`);
    }
    return await res.json();
  };

  remove = async (channelId: string, fileId: string): Promise<void> => {
    const res = await this.api.fetchWithCredentials(
      `/api/channels/${channelId}/files/${fileId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      await res.body?.cancel();
      throw new Error(`Failed to remove file (${res.status})`);
    }
    await res.body?.cancel();
  };

  abort(clientId: string) {
    this.aborts[clientId]?.();
  }

  upload = (
    args: FileUpload,
    channelId: string,
  ): Promise<UploadResult> => {
    return new Promise<UploadResult>((resolve, reject) => {
      // @ts-ignore XMLHttpRequest is only available in the browser
      const xhr = new XMLHttpRequest();
      this.aborts[args.clientId] = () => xhr.abort();

      xhr.upload.addEventListener("progress", (e: ProgressEvent) => {
        if (e.lengthComputable) {
          args.onProgress?.((e.loaded / e.total) * 100);
        }
      });
      xhr.addEventListener("load", () => {
        delete this.aborts[args.clientId];
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }, { once: true });
      xhr.addEventListener("error", () => {
        delete this.aborts[args.clientId];
        reject(new Error("Upload failed"));
      }, { once: true });
      xhr.addEventListener("abort", () => {
        delete this.aborts[args.clientId];
        reject(new Error("Upload aborted"));
      }, { once: true });

      xhr.open("POST", `/api/channels/${channelId}/files`, true);
      xhr.setRequestHeader("Authorization", `Bearer ${this.api.token}`);
      xhr.setRequestHeader(
        "Content-Type",
        args.contentType || "application/octet-stream",
      );
      xhr.setRequestHeader(
        "Content-Disposition",
        `attachment; filename="${args.fileName}"`,
      );
      xhr.send(args.file);
    });
  };
}
