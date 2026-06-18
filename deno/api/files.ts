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
    // Request-body streaming (duplex) requires HTTP/2. Production runs behind an
    // HTTP/2 proxy so big files stream without buffering; the dev server is
    // HTTP/1.1, so there we buffer and upload via XHR instead.
    if (!this.api.bufferedUpload && this.isRequestStreamSupported) {
      return await this.uploadStream(args, channelId);
    }
    return await this.uploadBuffered(args, channelId);
  };

  private uploadStream = async (
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
          Authorization: `Bearer ${this.api.token}`,
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

  private uploadBuffered = async (
    args: FileUpload,
    channelId: string,
  ): Promise<UploadResult> => {
    const blob = await this.streamToBlob(args.stream, args.contentType);
    return await new Promise<UploadResult>((resolve, reject) => {
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
      xhr.send(blob);
    });
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
          for await (const chunk of stream) {
            chunks.push(chunk);
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
