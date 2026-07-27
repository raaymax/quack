export type Resolution = {
  width: number;
  height: number;
};

export type FileOpts = {
  id?: string;
  contentType: string;
  filename: string;
  size?: number;
  resolution?: Resolution | null;
};

export type FileMeta = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  resolution?: Resolution | null;
};

export type FileData = FileMeta & {
  stream: ReadableStream<Uint8Array>;
};
