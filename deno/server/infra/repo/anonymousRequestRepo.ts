import { AnonymousRequest } from "../../types.ts";
import { Database } from "./db.ts";
import { deserialize } from "./serializer.ts";

export type AnonymousTrafficStats = {
  since: Date;
  total: number;
  uniqueIps: number;
  statuses: Record<string, number>;
  methods: Record<string, number>;
  sessions: Record<string, number>;
  ips: {
    ip: string;
    requests: number;
    notFound: number;
    unauthorized: number;
    paths: number;
    userAgents: string[];
    firstSeenAt: Date;
    lastSeenAt: Date;
  }[];
  notFoundPaths: {
    path: string;
    requests: number;
    ips: number;
    lastSeenAt: Date;
  }[];
  userAgents: { userAgent: string; requests: number; ips: number }[];
  referers: { referer: string; requests: number }[];
  withBody: AnonymousRequest[];
};

export class AnonymousRequestRepo {
  COLLECTION = "anonymousRequests";

  constructor(private db: Database) {}

  get connect() {
    return this.db.connect;
  }

  async insertMany(entries: Omit<AnonymousRequest, "id">[]): Promise<void> {
    if (entries.length === 0) return;
    const { db } = await this.connect();
    await db.collection(this.COLLECTION).insertMany(entries, {
      ordered: false,
    });
  }

  async getAll(
    query: Partial<Pick<AnonymousRequest, "ip" | "path" | "status">>,
  ): Promise<AnonymousRequest[]> {
    const { db } = await this.connect();
    const docs = await db.collection(this.COLLECTION).find(query)
      .sort({ createdAt: 1 }).toArray();
    return deserialize(docs);
  }

  async stats(since: Date, limit = 10): Promise<AnonymousTrafficStats> {
    const { db } = await this.connect();
    const collection = db.collection(this.COLLECTION);
    const match = { $match: { createdAt: { $gte: since } } };
    const countBy = (field: string) =>
      collection.aggregate([
        match,
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      ]).toArray();
    const isStatus = (status: number) => ({
      $sum: { $cond: [{ $eq: ["$status", status] }, 1, 0] },
    });
    const asRecord = (rows: { _id: unknown; count: number }[]) =>
      Object.fromEntries(rows.map((row) => [String(row._id), row.count]));

    const [
      [totals],
      statuses,
      methods,
      sessions,
      ips,
      notFoundPaths,
      userAgents,
      referers,
      withBody,
    ] = await Promise.all([
      collection.aggregate([
        match,
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            ips: { $addToSet: "$ip" },
          },
        },
        { $project: { total: 1, uniqueIps: { $size: "$ips" } } },
      ]).toArray(),
      countBy("status"),
      countBy("method"),
      countBy("session"),
      collection.aggregate([
        match,
        {
          $group: {
            _id: "$ip",
            requests: { $sum: 1 },
            notFound: isStatus(404),
            unauthorized: isStatus(401),
            paths: { $addToSet: "$path" },
            userAgents: { $addToSet: "$userAgent" },
            firstSeenAt: { $min: "$createdAt" },
            lastSeenAt: { $max: "$createdAt" },
          },
        },
        { $sort: { requests: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            ip: "$_id",
            requests: 1,
            notFound: 1,
            unauthorized: 1,
            paths: { $size: "$paths" },
            userAgents: { $slice: ["$userAgents", 5] },
            firstSeenAt: 1,
            lastSeenAt: 1,
          },
        },
      ]).toArray(),
      collection.aggregate([
        { $match: { createdAt: { $gte: since }, status: 404 } },
        {
          $group: {
            _id: "$path",
            requests: { $sum: 1 },
            ips: { $addToSet: "$ip" },
            lastSeenAt: { $max: "$createdAt" },
          },
        },
        { $sort: { requests: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            path: "$_id",
            requests: 1,
            ips: { $size: "$ips" },
            lastSeenAt: 1,
          },
        },
      ]).toArray(),
      collection.aggregate([
        match,
        {
          $group: {
            _id: "$userAgent",
            requests: { $sum: 1 },
            ips: { $addToSet: "$ip" },
          },
        },
        { $sort: { requests: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            userAgent: { $ifNull: ["$_id", ""] },
            requests: 1,
            ips: { $size: "$ips" },
          },
        },
      ]).toArray(),
      collection.aggregate([
        { $match: { createdAt: { $gte: since }, referer: { $exists: true } } },
        { $group: { _id: "$referer", requests: { $sum: 1 } } },
        { $sort: { requests: -1 } },
        { $limit: limit },
        { $project: { _id: 0, referer: "$_id", requests: 1 } },
      ]).toArray(),
      collection.find({ createdAt: { $gte: since }, body: { $exists: true } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray(),
    ]);

    return {
      since,
      total: totals?.total ?? 0,
      uniqueIps: totals?.uniqueIps ?? 0,
      statuses: asRecord(statuses as { _id: unknown; count: number }[]),
      methods: asRecord(methods as { _id: unknown; count: number }[]),
      sessions: asRecord(sessions as { _id: unknown; count: number }[]),
      ips: deserialize(ips),
      notFoundPaths: deserialize(notFoundPaths),
      userAgents: deserialize(userAgents),
      referers: deserialize(referers),
      withBody: deserialize(withBody),
    };
  }
}
