export class TextLineStream extends TransformStream<string, string> {
  constructor() {
    let buffer = "";
    super({
      transform(chunk, controller) {
        buffer += chunk;
        const end = buffer.endsWith("\r") ? buffer.length - 1 : buffer.length;
        const lines = buffer.slice(0, end).split(/\r\n|\r|\n/);
        buffer = (lines.pop() ?? "") + buffer.slice(end);
        for (const line of lines) controller.enqueue(line);
      },
      flush(controller) {
        const rest = buffer.endsWith("\r") ? buffer.slice(0, -1) : buffer;
        if (rest.length > 0) controller.enqueue(rest);
      },
    });
  }
}
