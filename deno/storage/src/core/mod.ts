import type { Config } from "@quack/config";
import type { FileData, FileOpts } from "./types.ts";
import { files } from "./store/mod.ts";
import { getResizePool } from "./resizePool.ts";
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
  remove(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

const MAX_RESIZE_BYTES = 25 * 1024 * 1024;

class Files {
  static getFileId = (id: string, width = 0, height = 0) =>
    `${id}-${width}x${height}`;

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
    return await this.service.upload(stream, options);
  }

  async exists(fileId: string): Promise<boolean> {
    return await this.service.exists(fileId);
  }

  async remove(fileId: string): Promise<void> {
    return await this.service.remove(fileId);
  }

  async get(id: string, opts?: ScalingOpts): Promise<FileData> {
    const { width, height } = opts ?? {};
    const targetId = Files.getFileId(id, width, height);
    if (await this.service.exists(targetId)) {
      return this.service.get(targetId);
    }
    if (!await this.service.exists(id)) {
      throw new ApiError(404, "FILE_NOT_FOUND", "File not found");
    }

    const file = await this.service.get(id);
    if (
      (!width && !height) ||
      file.size > MAX_RESIZE_BYTES ||
      (file.contentType !== "image/jpeg" && file.contentType !== "image/png")
    ) {
      return file;
    }

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
  }

  private async scale(
    file: FileData,
    width?: number,
    height?: number,
  ): Promise<ReadableStream<Uint8Array> | null> {
    try {
      const bytes = new Uint8Array(
        await new Response(file.stream).arrayBuffer(),
      );
      const resized = await getResizePool().resize(
        bytes,
        width || 0,
        height || 0,
        file.contentType === "image/png",
      );
      if (!resized) {
        return null;
      }
      return new Blob([resized]).stream();
    } catch (e) {
      console.warn("[storage] thumbnail resize failed, serving original", e);
      return null;
    }
  }
}

export type Storage = Files;

export const initStorage = (config: Config) => new Files(config);
