import { assertEquals } from "./deps_test.ts";
import { TextLineStream } from "./lines.ts";

const split = async (chunks: string[]): Promise<string[]> => {
  const stream = ReadableStream.from(chunks).pipeThrough(new TextLineStream());
  return await Array.fromAsync(stream);
};

Deno.test("TextLineStream - splits on LF, CRLF and CR", async () => {
  assertEquals(await split(["a\nb\r\nc\rd\n"]), ["a", "b", "c", "d"]);
});

Deno.test("TextLineStream - keeps empty lines", async () => {
  assertEquals(await split(["data: x\n\ndata: y\n\n"]), [
    "data: x",
    "",
    "data: y",
    "",
  ]);
});

Deno.test("TextLineStream - joins lines split across chunks", async () => {
  assertEquals(await split(["da", "ta: x\r", "\n", "\n"]), ["data: x", ""]);
});

Deno.test("TextLineStream - emits trailing text on flush", async () => {
  assertEquals(await split(["a\nlast"]), ["a", "last"]);
});
