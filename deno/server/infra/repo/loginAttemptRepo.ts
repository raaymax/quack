import { LoginAttempt } from "../../types.ts";
import { Repo } from "./repo.ts";
import { deserialize, serialize } from "./serializer.ts";

type LoginAttemptQuery = Partial<LoginAttempt>;

type FailureFilter = { ip: string } | { email: string };

export type LoginStats = {
  since: Date;
  outcomes: Record<string, number>;
  ips: {
    ip: string;
    failures: number;
    blocked: number;
    emails: string[];
    lastAttemptAt: Date;
  }[];
  unknownEmails: {
    email: string;
    attempts: number;
    ips: string[];
    lastAttemptAt: Date;
  }[];
  targetedAccounts: {
    email: string;
    failures: number;
    ips: string[];
    lastAttemptAt: Date;
  }[];
  successes: {
    email: string;
    logins: number;
    ips: string[];
    lastAttemptAt: Date;
  }[];
  recent: LoginAttempt[];
};

const attempts = { $ifNull: ["$count", 1] };

export class LoginAttemptRepo extends Repo<LoginAttemptQuery, LoginAttempt> {
  override COLLECTION = "loginAttempts";

  async recentFailureTimes(
    filter: FailureFilter,
    since: Date,
    limit: number,
  ): Promise<Date[]> {
    const { db } = await this.connect();
    const docs = await db.collection(this.COLLECTION)
      .find(
        { ...filter, outcome: "failure", createdAt: { $gte: since } },
        { projection: { createdAt: 1 } },
      )
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map((doc) => doc.createdAt);
  }

  async lastSuccessAt(email: string): Promise<Date | null> {
    const { db } = await this.connect();
    const doc = await db.collection(this.COLLECTION).findOne(
      { email, outcome: "success" },
      { sort: { createdAt: -1 }, projection: { createdAt: 1 } },
    );
    return doc?.createdAt ?? null;
  }

  async recordBlocked(
    data: Pick<LoginAttempt, "email" | "ip" | "userAgent">,
    bucket: Date,
  ): Promise<void> {
    const { db } = await this.connect();
    const now = new Date();
    await db.collection(this.COLLECTION).updateOne(
      { outcome: "blocked", ip: data.ip, createdAt: bucket },
      {
        $inc: { count: 1 },
        $set: {
          email: data.email,
          userAgent: data.userAgent,
          lastAttemptAt: now,
        },
      },
      { upsert: true },
    );
  }

  async stats(since: Date, limit = 10): Promise<LoginStats> {
    const { db } = await this.connect();
    const collection = db.collection(this.COLLECTION);
    const window = { lastAttemptAt: { $gte: since } };
    const top = (sortBy: string) => [
      { $sort: { [sortBy]: -1, lastAttemptAt: -1 } },
      { $limit: limit },
    ];
    const lastAttemptAt = { $max: "$lastAttemptAt" };

    const [outcomes, ips, unknownEmails, targetedAccounts, successes, recent] =
      await Promise.all([
        collection.aggregate([
          { $match: window },
          { $group: { _id: "$outcome", count: { $sum: attempts } } },
        ]).toArray(),
        collection.aggregate([
          { $match: { ...window, outcome: { $in: ["failure", "blocked"] } } },
          {
            $group: {
              _id: "$ip",
              failures: {
                $sum: { $cond: [{ $eq: ["$outcome", "failure"] }, 1, 0] },
              },
              blocked: {
                $sum: {
                  $cond: [{ $eq: ["$outcome", "blocked"] }, attempts, 0],
                },
              },
              emails: { $addToSet: "$email" },
              lastAttemptAt,
            },
          },
          ...top("failures"),
          {
            $project: {
              _id: 0,
              ip: "$_id",
              failures: 1,
              blocked: 1,
              emails: { $slice: ["$emails", 10] },
              lastAttemptAt: 1,
            },
          },
        ]).toArray(),
        collection.aggregate([
          {
            $match: {
              ...window,
              outcome: "failure",
              userId: { $exists: false },
            },
          },
          {
            $group: {
              _id: "$email",
              attempts: { $sum: 1 },
              ips: { $addToSet: "$ip" },
              lastAttemptAt,
            },
          },
          ...top("attempts"),
          {
            $project: {
              _id: 0,
              email: "$_id",
              attempts: 1,
              ips: { $slice: ["$ips", 10] },
              lastAttemptAt: 1,
            },
          },
        ]).toArray(),
        collection.aggregate([
          {
            $match: {
              ...window,
              outcome: "failure",
              userId: { $exists: true },
            },
          },
          {
            $group: {
              _id: "$email",
              failures: { $sum: 1 },
              ips: { $addToSet: "$ip" },
              lastAttemptAt,
            },
          },
          ...top("failures"),
          {
            $project: {
              _id: 0,
              email: "$_id",
              failures: 1,
              ips: { $slice: ["$ips", 10] },
              lastAttemptAt: 1,
            },
          },
        ]).toArray(),
        collection.aggregate([
          { $match: { ...window, outcome: "success" } },
          {
            $group: {
              _id: "$email",
              logins: { $sum: 1 },
              ips: { $addToSet: "$ip" },
              lastAttemptAt,
            },
          },
          { $sort: { lastAttemptAt: -1 } },
          {
            $project: {
              _id: 0,
              email: "$_id",
              logins: 1,
              ips: { $slice: ["$ips", 10] },
              lastAttemptAt: 1,
            },
          },
        ]).toArray(),
        collection.find({ ...window, outcome: { $ne: "success" } })
          .sort({ lastAttemptAt: -1 })
          .limit(limit * 2)
          .toArray(),
      ]);

    return {
      since,
      outcomes: Object.fromEntries(outcomes.map((o) => [o._id, o.count])),
      ips: deserialize(ips),
      unknownEmails: deserialize(unknownEmails),
      targetedAccounts: deserialize(targetedAccounts),
      successes: deserialize(successes),
      recent: deserialize(recent),
    };
  }

  override makeQuery(data: LoginAttemptQuery) {
    return serialize(data);
  }
}
