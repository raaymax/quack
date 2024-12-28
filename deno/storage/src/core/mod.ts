import sharp from "sharp";
import type { Config } from "@quack/config";
import { toNodeStream, toWebStream } from "./streams.ts";
import type { FileData, FileOpts } from "./types.ts";
import { files } from "./store/mod.ts";
import { ApiError } from "@planigale/planigale";

type ScalingOpts = {
  width?: number;
  height?: number;
};

class Files {
  _sharp: any;
  async getSharp() {
    if (this._sharp === undefined) {
      try {
        const { default: sharp } = await import("sharp");
        this._sharp = sharp;
      } catch (e) {
        console.warn("[WARNING] sharp not available", e);
        this._sharp = null;
      }
    }
    return this._sharp;
  }

  static getFileId = (id: string, width = 0, height = 0) =>
    `${id}-${width}x${height}`;

  private service: any;

  constructor(config: Config) {
    this.init(config.storage);
    this.getSharp();
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

    const sharp = await this.getSharp();
    const file = await this.service.get(id);
    if (
      !sharp ||
      !opts || !opts.width || !opts.height ||
      (file.contentType !== "image/jpeg" && file.contentType !== "image/png")
    ) {
      return file;
    }

    await this.service.upload(
      toWebStream(
        toNodeStream(file.stream).pipe(sharp().resize(width, height)),
      ),
      {
        id: targetId,
        filename: file.filename,
        contentType: file.contentType,
      },
    );
    return this.service.get(targetId);
  }
}

export type Storage = Files;

export const initStorage = (config: Config) => new Files(config);
