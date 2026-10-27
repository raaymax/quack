import type { Config } from "@quack/config";
import type { FileData, FileMeta, FileOpts, Resolution } from "./types.ts";
import { files } from "./store/mod.ts";
import { getResizePool } from "./resizePool.ts";
import { Limiter } from "./limiter.ts";
import { ApiError } from "@planigale/planigale";

type ScalingOpts = {
  width?: number;
  height?: number;
};

interface FileService {
  upload(
    stream: ReadableStream<Uint8Array>,
    options: FileOpts,
  ): Promise<string>;
  get(id: string): Promise<FileData>;
  stat(id: string): Promise<FileMeta>;
  list(prefix: string): Promise<string[]>;
  remove(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

const MAX_RESIZE_BYTES = 25 * 1024 * 1024;

class Files {
  static getFileId = (id: string, width = 0, height = 0) =>
    `${id}-${width}x${height}`;

  static isInspectableImage = (contentType: string) =>
    contentType === "image/jpeg" || contentType === "image/png";

  static MAX_DIMENSION = 2048;

  static clampDimension = (value?: number): number | undefined => {
    if (!value || value <= 0) return undefined;
    return Math.min(Math.floor(value), Files.MAX_DIMENSION);
  };

  private service!: FileService;

  constructor(config: Config) {
    this.init(config.storage);
  }

  init(config: Config["storage"]) {
    this.service = files(config);
  }

  async upload(
    stream: ReadableStream<Uint8Array>,
    options: FileOpts,
  ): Promise<string> {
    const size = typeof options.size === "number" ? options.size : undefined;
    const canInspect = Files.isInspectableImage(options.contentType) &&
      (size === undefined || size <= MAX_RESIZE_BYTES);
    if (!canInspect) {
      return await this.service.upload(stream, options);
    }

    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    // Blob copies the bytes, so readResolution can transfer the buffer to the
    // worker without affecting the payload we store.
    const blob = new Blob([bytes]);
    const resolution = bytes.length <= MAX_RESIZE_BYTES
      ? await this.readResolution(bytes)
      : null;
    return await this.service.upload(
      blob.stream(),
      { ...options, resolution },
    );
  }

  private async readResolution(
    bytes: Uint8Array<ArrayBuffer>,
  ): Promise<Resolution | null> {
    const pool = getResizePool();
    if (!pool.hasCapacity()) return null;
    return await pool.readResolution(bytes);
  }

  async stat(fileId: string): Promise<FileMeta> {
    return await this.service.stat(fileId);
  }

  async exists(fileId: string): Promise<boolean> {
    return await this.service.exists(fileId);
  }

  async remove(fileId: string): Promise<void> {
    await this.service.remove(fileId);
    const variants = await this.service.list(`${fileId}-`);
    await Promise.all(variants.map((variant) => this.service.remove(variant)));
  }

  async get(id: string, opts?: ScalingOpts): Promise<FileData> {
    const width = Files.clampDimension(opts?.width);
    const height = Files.clampDimension(opts?.height);
    const targetId = Files.getFileId(id, width, height);
    if (await this.service.exists(targetId)) {
      return this.service.get(targetId);
    }
    const meta = await this.service.stat(id).catch(() => null);
    if (!meta) {
      throw new ApiError(404, "FILE_NOT_FOUND", "File not found");
    }
    if (
      (!width && !height) ||
      meta.size > MAX_RESIZE_BYTES ||
      !Files.isInspectableImage(meta.contentType)
    ) {
      return this.service.get(id);
    }

    return await this.getThumbnailLimiter().run(async () => {
      if (await this.service.exists(targetId)) {
        return this.service.get(targetId);
      }
      const file = await this.service.get(id);
      const resized = await this.scale(file, width, height);
      if (!resized) {
        return this.service.get(id);
      }
      await this.service.upload(resized, {
        id: targetId,
        filename: file.filename,
        contentType: file.contentType,
      });
      return this.service.get(targetId);
    });
  }

  private thumbnailLimiter?: Limiter;

  private getThumbnailLimiter(): Limiter {
    if (!this.thumbnailLimiter) {
      this.thumbnailLimiter = new Limiter(getResizePool().maxPending);
    }
    return this.thumbnailLimiter;
  }

  private async scale(
    file: FileData,
    width?: number,
    height?: number,
  ): Promise<ReadableStream<Uint8Array> | null> {
    const pool = getResizePool();
    if (!pool.hasCapacity()) {
      console.warn("[storage] resize pool saturated, serving original");
      return null;
    }
    let bytes: Uint8Array<ArrayBuffer>;
    try {
      bytes = new Uint8Array(await new Response(file.stream).arrayBuffer());
    } catch (e) {
      console.warn("[storage] reading image to resize failed", e);
      return null;
    }
    const resized = await pool.resize(
      bytes,
      width || 0,
      height || 0,
      file.contentType === "image/png",
    );
    if (!resized) {
      console.warn("[storage] thumbnail resize failed, serving original");
      return null;
    }
    return new Blob([resized]).stream();
  }
}

export type Storage = Files;

export const initStorage = (config: Config) => new Files(config);
