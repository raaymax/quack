import { randomBytes } from "node:crypto";
import type { Core } from "../../core.ts";
import { CommandBody } from "../params.ts";

export class InviteCommand {
  static commandName = "invite";
  static prompt = "";
  static description = "Generate an invitation link";

  static async execute(data: CommandBody, core: Core) {
    const { repo, bus, config } = core;
    const token = randomBytes(16).toString("hex");
    await core.channel.access({
      id: data.context.channelId,
      userId: data.userId,
    }).internal();

    await repo.invitation.removeOutdated();
    const channel = await repo.channel.get({ id: data.context.channelId });
    const isDirect = channel?.channelType === "DIRECT";

    await repo.invitation.create({
      token,
      userId: data.userId,
      channelId: data.context.channelId,
      expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      createdAt: new Date(),
    });
    const link = `${config.baseUrl}/#/invite/${token}`;

    bus.direct(data.userId, {
      type: "message",
      clientId: `sys:${Math.random().toString(10)}`,
      userId: (await core.repo.user.get({ email: "system" }))?.id,
      ephemeral: true,
      channelId: data.context.channelId,
      flat:
        `Invitation link (valid 5 days from now):\n${config.baseUrl}/#/invite/${token}`,
      message: [
        { line: { text: "Invitation link: " } },
        { codeblock: link },
        { line: { text: "Link will be valid for 5 days" } },
        !isDirect
          ? {
            line: { text: "User will be automatically added to this channel" },
          }
          : undefined,
      ],
      createdAt: new Date().toISOString(),
    });

    return link;
  }
}
