import { PhotonImage, resize, SamplingFilter } from "@cf-wasm/photon/node";
import type { Config } from "@quack/config";
import type { FileData, FileOpts } from "./types.ts";
import { files } from "./store/mod.ts";
import { ApiError } from "@planigale/planigale";

type ScalingOpts = {
  width?: number;
  height?: number;
};

// Source images larger than this are streamed as-is instead of being decoded
// for thumbnailing. Resizing decodes the whole bitmap into memory, so this caps
// the transient allocation a single pathological upload can trigger.
const MAX_RESIZE_BYTES = 25 * 1024 * 1024;

class Files {
  static getFileId = (id: string, width = 0, height = 0) =>
    `${id}-${width}x${height}`;

  private service: any;

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
      // Decoding/resizing failed (e.g. corrupt or unsupported image): fall back
      // to streaming the original rather than failing the request.
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
    let img: PhotonImage | undefined;
    let out: PhotonImage | undefined;
    try {
      const bytes = new Uint8Array(
        await new Response(file.stream).arrayBuffer(),
      );
      img = PhotonImage.new_from_byteslice(bytes);

      // Resolve a missing dimension from the source aspect ratio so a single
      // requested side (the UI only sends height) doesn't distort the image.
      const ow = img.get_width();
      const oh = img.get_height();
      let w = width || 0;
      let h = height || 0;
      if (!w) w = Math.max(1, Math.round((ow / oh) * h));
      if (!h) h = Math.max(1, Math.round((oh / ow) * w));

      out = resize(img, w, h, SamplingFilter.Lanczos3);
      const result = file.contentType === "image/png"
        ? out.get_bytes()
        : out.get_bytes_jpeg(90);
      // Copy into a fresh ArrayBuffer-backed view so it satisfies BlobPart.
      return new Blob([new Uint8Array(result)]).stream();
    } catch (e) {
      console.warn("[storage] thumbnail resize failed, serving original", e);
      return null;
    } finally {
      img?.free();
      out?.free();
    }
  }
}

export type Storage = Files;

export const initStorage = (config: Config) => new Files(config);
