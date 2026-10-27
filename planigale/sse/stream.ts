const encoder = new TextEncoder();

export type SSEEvent = {
  data?: string;
  comment?: string;
  event?: string;
  id?: string;
  retry?: number;
};

function serialize(message: SSEEvent): Uint8Array {
  const lines = [];
  if (message.comment) lines.push(`:${message.comment}`);
  if (message.event) lines.push(`event:${message.event}`);
  if (message.data) {
    message.data.split(/\r\n|\r|\n/).forEach((line) =>
      lines.push(`data:${line}`)
    );
  }
  if (message.id) lines.push(`id:${message.id}`);
  if (message.retry) lines.push(`retry:${message.retry}`);
  return encoder.encode(lines.join("\n") + "\n\n");
}
export class SSEStream extends TransformStream<SSEEvent, Uint8Array> {
  constructor() {
    super({
      transform: (message, controller) => {
        controller.enqueue(serialize(message));
      },
    });
  }
}
