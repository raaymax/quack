import { Config } from "@quack/config";
import { Database } from "./db.ts";
import { UserRepo } from "./userRepo.ts";
import { SessionRepo } from "./sessionRepo.ts";
import { ChannelRepo } from "./channelRepo.ts";
import { MessageRepo } from "./messageRepo.ts";
import { InvitationRepo } from "./invitationRepo.ts";
import { EmojiRepo } from "./emojiRepo.ts";
import { BadgeRepo } from "./badgeRepo.ts";

export { UserRepo } from "./userRepo.ts";
export { SessionRepo } from "./sessionRepo.ts";
export { ChannelRepo } from "./channelRepo.ts";
export { MessageRepo } from "./messageRepo.ts";
export { InvitationRepo } from "./invitationRepo.ts";
export { EmojiRepo } from "./emojiRepo.ts";
export { BadgeRepo } from "./badgeRepo.ts";
export { Database, ObjectId } from "./db.ts";

export class Repository {
  db: Database;

  user: UserRepo;

  session: SessionRepo;

  channel: ChannelRepo;

  message: MessageRepo;

  invitation: InvitationRepo;

  emoji: EmojiRepo;

  badge: BadgeRepo;

  constructor(config: Config) {
    const databaseUrl = config.databaseUrl ?? Deno.env.get("DATABASE_URL") ??
      "mongodb://chat:chat@localhost:27017/chat?authSource=admin";
    const db = new Database(databaseUrl);
    this.user = new UserRepo(db);
    this.session = new SessionRepo(db);
    this.channel = new ChannelRepo(db);
    this.message = new MessageRepo(db);
    this.invitation = new InvitationRepo(db);
    this.emoji = new EmojiRepo(db);
    this.badge = new BadgeRepo(db);
    this.db = db;
  }

  async close() {
    await this.db.disconnect();
  }
}
