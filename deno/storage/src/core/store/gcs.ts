/* eslint-disable class-methods-use-this */
import { GoogleAuth } from "google-auth-library";
import { ResourceNotFound } from "@planigale/planigale";
import type { FileData, FileMeta, FileOpts, Resolution } from "../types.ts";
import { getEnvInt } from "../env.ts";

function parseResolution(raw: unknown): Resolution | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed && typeof parsed.width === "number" &&
      typeof parsed.height === "number"
    ) {
      return { width: parsed.width, height: parsed.height };
    }
  } catch {
    return null;
  }
  return null;
}

// const API_URL = "http://localhost:8888";
const API_URL = "https://storage.googleapis.com";

const GCS_TIMEOUT_MS = getEnvInt("STORAGE_GCS_TIMEOUT_MS", 20_000);
const GCS_UPLOAD_TIMEOUT_MS = getEnvInt(
  "STORAGE_GCS_UPLOAD_TIMEOUT_MS",
  60_000,
);
const GCS_MAX_RETRIES = getEnvInt("STORAGE_GCS_MAX_RETRIES", 3);
const GCS_BUFFER_LIMIT_BYTES = getEnvInt(
  "STORAGE_GCS_BUFFER_LIMIT_BYTES",
  64 * 1024 * 1024,
);
const GCS_AUTH_TIMEOUT_MS = getEnvInt("STORAGE_GCS_AUTH_TIMEOUT_MS", 10_000);
const GCS_AUTH_MAX_RETRIES = getEnvInt("STORAGE_GCS_AUTH_MAX_RETRIES", 2);
const TOKEN_REFRESH_AFTER_MS = 45 * 60 * 1000;
const TOKEN_MAX_AGE_MS = 58 * 60 * 1000;

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function backoff(attempt: number): Promise<void> {
  const ms = Math.min(500 * 2 ** attempt, 5_000) +
    Math.floor(Math.random() * 250);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new DOMException(`${label} timed out after ${ms}ms`, "TimeoutError"),
        ),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function gcsFetch(
  url: string,
  init: RequestInit,
  opts: { label: string; timeoutMs?: number; retries?: number },
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? GCS_TIMEOUT_MS;
  const retries = opts.retries ?? GCS_MAX_RETRIES;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await backoff(attempt - 1);
    const started = Date.now();
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (RETRYABLE_STATUS.has(res.status) && attempt < retries) {
        await res.body?.cancel?.();
        lastError = new Error(`GCS ${opts.label} returned ${res.status}`);
        console.warn(
          `[storage][gcs] ${opts.label} status ${res.status}, retrying (${
            attempt + 1
          }/${retries})`,
        );
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      const reason = err instanceof Error ? err.name : String(err);
      console.warn(
        `[storage][gcs] ${opts.label} failed after ${
          Date.now() - started
        }ms (${reason}), attempt ${attempt + 1}/${retries + 1}`,
      );
    }
  }
  console.error(
    `[storage][gcs] ${opts.label} gave up after ${retries + 1} attempts`,
  );
  throw lastError instanceof Error
    ? lastError
    : new Error(`GCS ${opts.label} failed`);
}

class Gcs {
  bucketName: string;

  accessToken: string | null = null;

  private tokenFetchedAt = 0;

  private refreshPromise: Promise<string | null> | null = null;

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

  async getAccessToken(): Promise<string | null> {
    const age = Date.now() - this.tokenFetchedAt;
    if (this.accessToken && age < TOKEN_MAX_AGE_MS) {
      if (age >= TOKEN_REFRESH_AFTER_MS) {
        this.refresh().catch(() => {});
      }
      return this.accessToken;
    }
    try {
      return await this.refresh();
    } catch (err) {
      if (this.accessToken) return this.accessToken;
      throw err;
    }
  }

  private refresh(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.fetchAccessToken()
        .then((token) => {
          this.accessToken = token;
          this.tokenFetchedAt = Date.now();
          return token;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  private async fetchAccessToken(): Promise<string | null> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= GCS_AUTH_MAX_RETRIES; attempt++) {
      if (attempt > 0) await backoff(attempt - 1);
      try {
        const token = await withTimeout(
          this.auth.getAccessToken(),
          GCS_AUTH_TIMEOUT_MS,
          "auth token",
        );
        return token ?? null;
      } catch (err) {
        lastError = err;
        const reason = err instanceof Error ? err.name : String(err);
        console.warn(
          `[storage][gcs] auth token fetch failed (${reason}), attempt ${
            attempt + 1
          }/${GCS_AUTH_MAX_RETRIES + 1}`,
        );
      }
    }
    console.error("[storage][gcs] auth token fetch gave up");
    throw lastError instanceof Error
      ? lastError
      : new Error("GCS auth token fetch failed");
  }

  async exists(fileId: string): Promise<boolean> {
    const token = await this.getAccessToken();
    const meta = await gcsFetch(this.getUrl(fileId), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }, { label: "exists" });
    await meta.body?.cancel?.();
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

    const knownSize = typeof file.size === "number" ? file.size : undefined;
    const canBuffer = knownSize !== undefined &&
      knownSize <= GCS_BUFFER_LIMIT_BYTES;
    const body: BodyInit = canBuffer
      ? new Uint8Array(await new Response(webStream).arrayBuffer())
      : webStream;

    const res = await gcsFetch(this.getUploadUrl(fileId), {
      headers: {
        "Content-Type": file.contentType,
        Authorization: `Bearer ${token}`,
      },
      method: "POST",
      body,
    }, {
      label: "upload",
      timeoutMs: GCS_UPLOAD_TIMEOUT_MS,
      retries: canBuffer ? GCS_MAX_RETRIES : 0,
    });
    await res.body?.cancel?.();
    if (res.status !== 200) {
      throw new Error("Upload failed");
    }

    const meta = await gcsFetch(this.getUrl(fileId), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        metadata: {
          filename: file.filename,
          ...(file.resolution
            ? { resolution: JSON.stringify(file.resolution) }
            : {}),
        },
      }),
    }, { label: "metadata patch" });
    await meta.body?.cancel?.();
    if (meta.status !== 200) {
      throw new Error("Upload failed");
    }

    return fileId;
  }

  async stat(fileId: string): Promise<FileMeta> {
    const token = await this.getAccessToken();
    const meta = await gcsFetch(this.getUrl(fileId), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }, { label: "stat" });
    const metadata = await meta.json();
    if (meta.status !== 200) {
      throw new ResourceNotFound("File not found");
    }
    const filename = metadata.metadata?.filename || "file";
    return {
      id: fileId,
      contentType: metadata.contentType || "application/octet-stream",
      filename: typeof filename === "string" ? filename : "file",
      size: parseInt(metadata.size, 10) || 0,
      resolution: parseResolution(metadata.metadata?.resolution),
    };
  }

  async list(prefix: string): Promise<string[]> {
    const token = await this.getAccessToken();
    const res = await gcsFetch(
      `${API_URL}/storage/v1/b/${this.bucketName}/o?prefix=${
        encodeURIComponent(prefix)
      }`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      { label: "list" },
    );
    const data = await res.json();
    if (res.status !== 200) {
      return [];
    }
    return (data.items ?? []).map((item: { name: string }) => item.name);
  }

  async remove(fileId: string): Promise<void> {
    const token = await this.getAccessToken();
    const meta = await gcsFetch(this.getUrl(fileId), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    }, { label: "remove" });
    await meta.body?.cancel?.();
    if (meta.status !== 200 && meta.status !== 204) {
      throw new Error("Delete failed");
    }
  }

  get = async (fileId: string): Promise<FileData> => {
    const token = await this.getAccessToken();
    const meta = await gcsFetch(
      this.getUrl(fileId),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      { label: "get metadata" },
    );
    const metadata = await meta.json();
    if (meta.status !== 200) {
      throw new ResourceNotFound("File not found");
    }
    const res = await gcsFetch(
      metadata.mediaLink,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      { label: "get media", timeoutMs: GCS_UPLOAD_TIMEOUT_MS },
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
      resolution: parseResolution(metadata.metadata?.resolution),
      stream: res.body,
    };
  };
}

export const files = (config: { bucket: string }) => new Gcs(config);
