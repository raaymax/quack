/// <reference lib="deno.worker" />
import { PhotonImage, resize, SamplingFilter } from "@cf-wasm/photon/node";

export type ResizeRequest = {
  bytes: Uint8Array<ArrayBuffer>;
  width: number;
  height: number;
  png: boolean;
};

export type ResizeResponse =
  | { ok: true; bytes: Uint8Array<ArrayBuffer> }
  | { ok: false };

self.onmessage = (event: MessageEvent<ResizeRequest>) => {
  const { bytes, width, height, png } = event.data;
  let img: PhotonImage | undefined;
  let out: PhotonImage | undefined;
  try {
    img = PhotonImage.new_from_byteslice(bytes);

    const ow = img.get_width();
    const oh = img.get_height();
    let w = width || 0;
    let h = height || 0;
    if (!w) w = Math.max(1, Math.round((ow / oh) * h));
    if (!h) h = Math.max(1, Math.round((oh / ow) * w));

    out = resize(img, w, h, SamplingFilter.Lanczos3);
    const result = new Uint8Array(
      png ? out.get_bytes() : out.get_bytes_jpeg(90),
    );
    self.postMessage({ ok: true, bytes: result }, [result.buffer]);
  } catch {
    self.postMessage({ ok: false });
  } finally {
    img?.free();
    out?.free();
  }
};
