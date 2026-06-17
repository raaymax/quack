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
    return await res.json();
  };

  remove = async (channelId: string, fileId: string): Promise<void> => {
    await this.api.fetchWithCredentials(
      `/api/channels/${channelId}/files/${fileId}`,
      { method: "DELETE" },
    );
  };

  isRequestStreamSupported = (() => {
    let duplexAccessed = false;

    // @ts-ignore This is only for deno
    if (typeof Deno !== "undefined") {
      return true;
    }

    const hasContentType = new Request("", {
      body: new ReadableStream(),
      method: "POST",
      // @ts-ignore This is a method to check if the browser supports duplex streams
      get duplex() {
        duplexAccessed = true;
        return "half";
      },
    }).headers.has("Content-Type");

    return duplexAccessed && !hasContentType;
  })();

  abort(clientId: string) {
    this.aborts[clientId]?.();
  }

  upload = async (
    args: FileUpload,
    channelId: string,
  ): Promise<UploadResult> => {
    if (this.isRequestStreamSupported) {
      return await this.uplaodFileStream(args, channelId);
    } else {
      return await this.uploadFileOld(args, channelId);
    }
  };

  private uploadFileOld = (
    args: FileUpload,
    channelId: string,
  ): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      // @ts-ignore This is only for browsers
      const xhr = new XMLHttpRequest();
      xhr.addEventListener("load", () => {
        const data = JSON.parse(xhr.responseText);
        delete this.aborts[args.clientId];
        resolve(data);
      }, { once: true });
      xhr.upload.addEventListener("progress", (e: ProgressEvent) => {
        if (e.lengthComputable) {
          args.onProgress?.((e.loaded / e.total) * 100);
        }
      });
      xhr.addEventListener("error", (e: Event) => {
        delete this.aborts[args.clientId];
        reject(e);
      }, { once: true });
      xhr.open("POST", `/api/channels/${channelId}/files`, true);
      xhr.setRequestHeader("Authorization", `Bearer ${this.api.token}`);

      const formData = new FormData();
      this.streamToBlob(args.stream, args.contentType)
        .then((blob) => {
          formData.append("file", blob, args.fileName);
          this.aborts[args.clientId] = () => xhr.abort();
          xhr.send(formData);
        });
    });
  };

  private uplaodFileStream = async (
    args: FileUpload,
    channelId: string,
  ): Promise<UploadResult> => {
    let uploadedSize = 0;
    const abortController = new AbortController();
    this.aborts[args.clientId] = () => abortController.abort();
    const blobStream = args.stream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          uploadedSize += chunk.length;
          args.onProgress?.(uploadedSize / args.fileSize * 100);
          controller.enqueue(chunk);
        },
      }),
    );
    const res = await this.api.fetchWithCredentials(
      `/api/channels/${channelId}/files`,
      {
        method: "POST",
        signal: abortController.signal,
        duplex: "half",
        headers: {
          Authorization: `Bearer ${localStorage.token}`,
          "Content-Type": args.contentType || "application/octet-stream",
          "Content-Length": args.fileSize.toString(),
          "Content-Disposition": `attachment; filename="${args.fileName}"`,
        },
        body: blobStream,
      },
    );

    delete this.aborts[args.clientId];

    return await res.json();
  };

  private streamToBlob = (
    stream: ReadableStream,
    mimeType: string,
  ): Promise<Blob> => {
    if (mimeType != null && typeof mimeType !== "string") {
      throw new Error("Invalid mimetype, expected string.");
    }
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const chunks: BlobPart[] = [];
          // @ts-ignore This is only for browsers
          for await (const chunk of stream) {
            chunks.push(chunk.value);
          }
          const blob = mimeType != null
            ? new Blob(chunks, { type: mimeType })
            : new Blob(chunks);
          resolve(blob);
        } catch (e) {
          reject(e);
        }
      })();
    });
  };
}
