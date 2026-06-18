/// <reference lib="deno.worker" />
import { PhotonImage, resize, SamplingFilter } from "@cf-wasm/photon/node";

export type ResizeRequest = {
  op?: "resize";
  bytes: Uint8Array<ArrayBuffer>;
  width: number;
  height: number;
  png: boolean;
};

export type ResolutionRequest = {
  op: "resolution";
  bytes: Uint8Array<ArrayBuffer>;
};

export type WorkerRequest = ResizeRequest | ResolutionRequest;

export type ResizeResponse =
  | { ok: true; bytes: Uint8Array<ArrayBuffer> }
  | { ok: false };

export type ResolutionResponse =
  | { ok: true; width: number; height: number }
  | { ok: false };

export type WorkerResponse = ResizeResponse | ResolutionResponse;

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  let img: PhotonImage | undefined;
  try {
    img = PhotonImage.new_from_byteslice(req.bytes);

    if (req.op === "resolution") {
      self.postMessage({
        ok: true,
        width: img.get_width(),
        height: img.get_height(),
      });
      return;
    }

    let out: PhotonImage | undefined;
    try {
      const ow = img.get_width();
      const oh = img.get_height();
      let w = req.width || 0;
      let h = req.height || 0;
      if (!w) w = Math.max(1, Math.round((ow / oh) * h));
      if (!h) h = Math.max(1, Math.round((oh / ow) * w));

      out = resize(img, w, h, SamplingFilter.Lanczos3);
      const result = new Uint8Array(
        req.png ? out.get_bytes() : out.get_bytes_jpeg(90),
      );
      self.postMessage({ ok: true, bytes: result }, [result.buffer]);
    } finally {
      out?.free();
    }
  } catch {
    self.postMessage({ ok: false });
  } finally {
    img?.free();
  }
};
