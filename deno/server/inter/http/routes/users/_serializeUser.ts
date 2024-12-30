import { User } from "@quack/api";
import { DbUser } from "../../../../types.ts";

export const serializeUser = (user: DbUser): User => {
  return {
    id: user.id,
    alias: user.alias,
    email: user.email,
    name: user.name,
    avatarFileId: user.avatarFileId,
    status: user.status,
    publicKey: user.publicKey,
    hidden: user.hidden,
  };
};
