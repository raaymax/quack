import * as path from "@std/path";

const __dirname = new URL(".", import.meta.url).pathname;

export class FileService {
  command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-ffi",
      "--allow-read",
      "--allow-env",
      path.join(__dirname, "server.ts"),
    ],
    stdout: "piped",
  });

  child: Deno.ChildProcess | null = null;

  running = false;

  async start() {
    this.running = true;
    while (this.running) {
      const child = this.command.spawn();
      this.child = child;
      const s = child.stdout.tee();
      s[0].pipeTo(
        Deno.openSync("file-service.log", { write: true, create: true })
          .writable,
      );

      const decodedStream = s[1].pipeThrough(new TextDecoderStream());
      for await (const chunk of decodedStream) {
        console.log(chunk);
      }
      const status = await child.status;
      console.log(`file service exited with status ${status.code}`);
      if (status.success) {
        break;
      }
    }
  }

  async close() {
    this.running = false;
    if (this.child) {
      console.log("closing file service");
      this.child.kill();
      const timeout = new Promise((resolve) =>
        setTimeout(() => resolve(null), 1000)
      );
      const status = await Promise.race([timeout, this.child.status]);
      if (status) return;
      console.log("close timeout, killing file service");
      this.child.kill("SIGKILL");
      await this.child.status;
    }
  }
}
