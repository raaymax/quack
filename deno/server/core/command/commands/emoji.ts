
export class EmojiCommand {
  static name = "emoji";

  static validate(data: any) {
    if (!data.attachments || data.attachments.length === 0) {
      throw new Error("missing attachment image");
    }
    if (!data.attachments[0].contentType.match(/^image\//)) {
      throw new Error("invalid attachment type, expected image");
    }
    if (!data.text.trim().match(/^:[a-zA-Z0-9_-]+:$/)) {
      throw new Error("invalid emoji shortname, expected :shortname:");
    }
  }

  static async execute(data: any, core: any) {
    EmojiCommand.validate(data);
    await core.repo.emoji.create({
      shortname: data.text.trim().replace(/^:/, '').replace(/:$/, ''),
      fileId: data.attachments[0].id,
    });

    core.bus.direct(data.userId, {
      type: "message",
      channelId: data.context.channelId,
      flat: `Emoji :${data.shortname}: created`,
      message: [
        { text: 'Emoji '}, { emoji: data.shortname }, { text: "created" },
      ]
    });
  }

}

