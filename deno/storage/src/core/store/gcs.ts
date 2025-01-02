/* eslint-disable class-methods-use-this */
import { GoogleAuth } from "google-auth-library";
import { ResourceNotFound } from "@planigale/planigale";
import type { FileData, FileOpts } from "../types.ts";

// const API_URL = "http://localhost:8888";
const API_URL = "https://storage.googleapis.com";

class Gcs {
  bucketName: string;

  accessToken: Promise<string | null | undefined> | null = null;

  accessTokenExpires = 0;

  auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });

  getUrl(fileId: string): string {
    return `${API_URL}/storage/v1/b/${this.bucketName}/o/${fileId}`;
  }

  getUploadUrl(fileId: string): string {
    return `${API_URL}/upload/storage/v1/b/${this.bucketName}/o?uploadType=media&name=${fileId}`;
  }

  constructor(config: { bucket: string }) {
    this.bucketName = config.bucket;
  }

  getAccessToken() {
    if (!this.accessToken || Date.now() > this.accessTokenExpires) {
      this.accessToken = this.auth.getAccessToken();
      this.accessTokenExpires = Date.now() + 2 * 1000;
    }
    return this.accessToken;
  }

  async exists(fileId: string): Promise<boolean> {
    const token = await this.getAccessToken();
    const meta = await fetch(
      this.getUrl(fileId),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    await meta.json();
    if (meta.status !== 200) {
      return false;
    }
    return true;
  }

  async upload(
    webStream: ReadableStream<Uint8Array>,
    fileOpts: FileOpts,
  ): Promise<string> {
    const file = fileOpts ??
      { contentType: "application/octet-stream", filename: "file" };
    const fileId = file?.id ?? crypto.randomUUID();
    const token = await this.getAccessToken();

    const res = await fetch(this.getUploadUrl(fileId), {
      // client: this.client,
      headers: {
        "Content-Type": file.contentType,
        Authorization: `Bearer ${token}`,
      },
      method: "POST",
      body: webStream,
    });
    await res.body?.cancel?.();
    if (res.status !== 200) {
      throw new Error("Upload failed");
    }

    const meta = await fetch(this.getUrl(fileId), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        metadata: {
          filename: file.filename,
        },
      }),
    });
    await meta.body?.cancel?.();
    if (meta.status !== 200) {
      throw new Error("Upload failed");
    }

    return fileId;
  }

  async remove(fileId: string): Promise<void> {
    const token = await this.getAccessToken();
    const meta = await fetch(this.getUrl(fileId), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    await meta.body?.cancel?.();
    if (meta.status !== 200 && meta.status !== 204) {
      throw new Error("Delete failed");
    }
  }

  get = async (fileId: string): Promise<FileData> => {
    const token = await this.getAccessToken();
    const meta = await fetch(
      this.getUrl(fileId),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const metadata = await meta.json();
    if (meta.status !== 200) {
      throw new ResourceNotFound("File not found");
    }
    const res = await fetch(
      metadata.mediaLink,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (res.status !== 200 || res.body === null) {
      await res.body?.cancel();
      throw new ResourceNotFound("File not found");
    }
    const filename = metadata.metadata?.filename || "file";
    return {
      id: fileId,
      contentType: metadata.contentType || "application/octet-stream",
      filename: typeof filename === "string" ? filename : "file",
      size: parseInt(metadata.size, 10) || 0,
      stream: res.body,
    };
  };
}

export const files = (config: { bucket: string }) => new Gcs(config);
