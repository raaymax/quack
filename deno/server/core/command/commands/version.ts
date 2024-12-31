export class VersionCommand {
  static commandName = "version";
  static prompt = "";
  static description = "Show the current version";

  static async execute(data: any, core: any) {
    core.bus.direct(data.userId, {
      type: "message",
      clientId: `sys:${Math.random().toString(10)}`,
      userId: (await core.repo.user.get({ name: "System" })).id,
      ephemeral: true,
      flat: `Server version: ${
        Deno.env.get("APP_VERSION") ?? "3.x.x"
      }\nClient version: ${data.context?.appVersion ?? "3.x.x"}`,
      message: [
        {
          line: [
            { text: "Server version: " },
            { bold: { text: Deno.env.get("APP_VERSION") ?? "3.x.x" } },
          ],
        },
        {
          line: [
            { text: "Client version: " },
            { bold: { text: data.context?.appVersion ?? "3.x.x" } },
          ],
        },
      ],
      channelId: data.context.channelId,
      createdAt: new Date().toISOString(),
    });
  }
}
