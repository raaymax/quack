import { Badge } from "../../types.ts";
import { Repo } from "./repo.ts";

type BadgeQuery = Partial<Badge>;
export class BadgeRepo extends Repo<BadgeQuery, Badge> {
  override COLLECTION = "badges";

  async increment(where: BadgeQuery) {
    await this.updateMany(where, { count: 1 }, "inc");
  }

  async reset(where: BadgeQuery) {
    await this.updateMany(where, { count: 0 }, "set");
  }
}
