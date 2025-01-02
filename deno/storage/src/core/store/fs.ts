import type { Config } from "@quack/config";
import { ResourceNotFound } from "@planigale/planigale";
import { existsSync } from "@std/fs";
import * as path from "@std/path";
import type { FileData, FileOpts } from "../types.ts";

export const files = (config: Config["storage"]) => {
  const dir = (config.type === "fs" && config.directory) || Deno.cwd();

  const exists = (id: string): boolean => existsSync(path.join(dir, id));

  return {
    upload: async (
      stream: ReadableStream<Uint8Array>,
      options: FileOpts,
    ): Promise<string> => {
      let size = 0;
      const id = options.id ?? crypto.randomUUID();
      Deno.mkdirSync(dir, { recursive: true });
      const file = await Deno.open(path.join(dir, id), {
        write: true,
        create: true,
        append: false,
        truncate: true,
      });
      const s = stream.tee();
      s[0].pipeTo(file.writable);
      for await (const chunk of s[1]) {
        size += chunk.length;
      }
      if (options.size && size !== options.size) {
        throw new Error("Size mismatch");
      }
      await Deno.writeTextFile(
        path.join(dir, `${id}.json`),
        JSON.stringify({ ...options, size }),
      );
      return id;
    },
    get: async (id: string): Promise<FileData> => {
      if (!exists(id) || !exists(`${id}.json`)) {
        throw new ResourceNotFound("File not found");
      }
      const file = await Deno.open(path.join(dir, id), { read: true });
      const meta = JSON.parse(
        await Deno.readTextFile(path.join(dir, `${id}.json`)),
      );
      return {
        ...meta,
        stream: file.readable,
      };
    },
    remove: async (id: string): Promise<void> => {
      if (exists(id)) {
        await Deno.remove(path.join(dir, id));
      }
      if (exists(`${id}.json`)) {
        await Deno.remove(path.join(dir, `${id}.json`));
      }
    },
    exists: (id: string): Promise<boolean> =>
      Promise.resolve(exists(id) && exists(`${id}.json`)),
  };
};
