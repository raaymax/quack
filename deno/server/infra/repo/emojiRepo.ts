import { Emoji } from "../../types.ts";
import { Repo } from "./repo.ts";

type EmojiQuery = Partial<Emoji>;
export class EmojiRepo extends Repo<EmojiQuery, Emoji> {
  override COLLECTION = "emojis";
}
