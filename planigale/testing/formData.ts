const ESCAPE_FILENAME_PATTERN = new RegExp(/\r?\n|\r/g);
const ESCAPE_PATTERN = new RegExp(/([\n\r"])/g);
const ESCAPE_MAP: Record<string, string> = Object.freeze({
  "\n": "%0A",
  "\r": "%0D",
  '"': "%22",
});

function escape(str: string, isFilename?: boolean) {
  return (isFilename ? str : str.replace(ESCAPE_FILENAME_PATTERN, "\r\n"))
    .replace(
      ESCAPE_PATTERN,
      (c) => ESCAPE_MAP[c],
    );
}

const FORM_DETA_SERIALIZE_PATTERN = new RegExp(/\r(?!\n)|(?<!\r)\n/g);

export async function formDataToBlob(formData: FormData): Promise<Blob> {
  const enc = new TextEncoder();
  const boundary = `${Math.random()}${Math.random()}`.replace(".", "").slice(
    -28,
  ).padStart(32, "-");
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const prefix = `--${boundary}\r\nContent-Disposition: form-data; name="`;

  for (const [name, value] of formData) {
    if (typeof value === "string") {
      const serialized = value.replace(FORM_DETA_SERIALIZE_PATTERN, "\r\n");
      chunks.push(
        enc.encode(prefix + escape(name) + `"\r\n\r\n${serialized}\r\n`),
      );
    } else {
      chunks.push(enc.encode(
        prefix + escape(name) + `"; filename="${escape(value.name, true)}"` +
          `\r\nContent-Type: ${
            value.type || "application/octet-stream"
          }\r\n\r\n`,
      ));
      chunks.push(await value.bytes());
      chunks.push(enc.encode("\r\n"));
    }
  }
  chunks.push(enc.encode(`--${boundary}--`));
  return new Blob(chunks, {
    type: "multipart/form-data; boundary=" + boundary,
  });
}

export async function formDataToStream(
  formData: FormData,
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string }> {
  const boundary = `${Math.random()}${Math.random()}`.replace(".", "").slice(
    -28,
  ).padStart(32, "-");
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const prefix = `--${boundary}\r\nContent-Disposition: form-data; name="`;

      for (const [name, value] of formData) {
        if (typeof value === "string") {
          const serialized = value.replace(FORM_DETA_SERIALIZE_PATTERN, "\r\n");
          controller.enqueue(
            enc.encode(prefix + escape(name) + `"\r\n\r\n${serialized}\r\n`),
          );
        } else {
          controller.enqueue(enc.encode(
            prefix + escape(name) +
              `"; filename="${escape(value.name, true)}"` +
              `\r\nContent-Type: ${
                value.type || "application/octet-stream"
              }\r\n\r\n`,
          ));
          for await (const chunk of value.stream()) {
            controller.enqueue(chunk);
          }
          controller.enqueue(enc.encode("\r\n"));
        }
      }
      controller.enqueue(enc.encode(`--${boundary}--`));
      controller.close();
    },
  });
  return {
    stream,
    contentType: "multipart/form-data; boundary=" + boundary,
  };
}
