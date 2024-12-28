import { Readable } from "node:stream";

interface ListenerInterface {
  data: (chunk: any) => void;
  end: (chunk: any) => void;
  close: (err: any) => void;
  error: (err: any) => void;
}

export function toWebStream(nodeStream: Readable) {
  let destroyed = false;
  const listeners = {} as ListenerInterface;

  function start(controller: any) {
    listeners.data = onData;
    listeners.end = onData;
    listeners.end = onDestroy;
    listeners.close = onDestroy;
    listeners.error = onDestroy;
    for (const name in listeners) {
      nodeStream.on(name, listeners[name as keyof ListenerInterface]);
    }

    nodeStream.pause();

    function onData(chunk: any) {
      if (destroyed) return;
      controller.enqueue(new Uint8Array(chunk));
      nodeStream.pause();
    }

    function onDestroy(err: any) {
      if (destroyed) return;
      destroyed = true;

      for (const name in listeners) {
        nodeStream.removeListener(
          name,
          listeners[name as keyof ListenerInterface],
        );
      }

      if (err) controller.error(err);
      else controller.close();
    }
  }

  function pull() {
    if (destroyed) return;
    nodeStream.resume();
  }

  function cancel() {
    destroyed = true;

    for (const name in listeners) {
      nodeStream.removeListener(
        name,
        listeners[name as keyof ListenerInterface],
      );
    }

    nodeStream.push(null);
    nodeStream.pause();
    if (nodeStream.destroy) nodeStream.destroy();
  }

  return new ReadableStream({ start, pull, cancel });
}

class NodeReadable extends Readable {
  public bytesRead = 0;

  public released = false;

  private reader: ReadableStreamDefaultReader<Uint8Array>;

  private pendingRead?: Promise<any>;

  constructor(stream: ReadableStream) {
    super();
    this.reader = stream.getReader();
  }

  public override async _read() {
    if (this.released) {
      this.push(null);
      return;
    }
    this.pendingRead = this.reader.read();
    const data = await this.pendingRead;
    delete this.pendingRead;
    if (data.done || this.released) {
      this.push(null);
    } else {
      this.bytesRead += data.value.length;
      this.push(data.value);
    }
  }

  public async waitForReadToComplete() {
    if (this.pendingRead) {
      await this.pendingRead;
    }
  }

  public async close(): Promise<void> {
    await this.syncAndRelease();
  }

  private async syncAndRelease() {
    this.released = true;
    await this.waitForReadToComplete();
    this.reader.releaseLock();
  }
}

export function toNodeStream(webStream: ReadableStream) {
  return new NodeReadable(webStream);
}
