import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { EntityId } from "../../../../types.ts";

type BusMessage = {
  type: string;
  id?: string;
  channelId?: string;
  userId?: string;
  flat?: string;
  parentId?: string;
  channel?: string;
  [key: string]: unknown;
};

const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

export default (core: Core) =>
  new Route({
    method: "GET",
    url: "/",
    handler: async (req) => {
      const res = new Res();
      const target = res.sendEvents();
      const userId = req.state.user.id;

      // Send connected status
      try {
        target.sendMessage({ data: JSON.stringify({ status: "connected" }) });
      } catch (_e) {
        target.close();
        return res;
      }

      // Set up heartbeat to keep connection alive and detect stale connections
      const heartbeatInterval = setInterval(() => {
        try {
          target.sendMessage({ data: JSON.stringify({ type: "ping" }) });
        } catch (_e) {
          // Connection closed, cleanup will happen via close event
        }
      }, HEARTBEAT_INTERVAL_MS);

      // Subscribe to bus events for this user
      const off = core.bus.on(userId, async (raw) => {
        const msg = raw as BusMessage;
        // Only process message events for notifications
        if (msg.type !== "message") {
          return;
        }

        // Skip notifications for user's own messages
        if (msg.userId === userId) {
          return;
        }

        try {
          // Build notification payload
          const notification = await buildNotification(core, msg, userId);
          if (notification) {
            target.sendMessage({ data: JSON.stringify(notification) });
          }
        } catch (e) {
          console.error(
            "[MobileNotifications] Error building notification:",
            e,
          );
        }
      });

      target.addEventListener("close", () => {
        clearInterval(heartbeatInterval);
        off();
      }, { once: true });

      return res;
    },
  });

async function buildNotification(
  core: Core,
  msg: BusMessage,
  _currentUserId: string,
): Promise<object | null> {
  const { repo } = core;

  // Get channel info for title
  let title = "New message";
  let channelName = "";

  if (msg.channelId) {
    const channel = await repo.channel.get({
      id: EntityId.from(msg.channelId),
    });
    if (channel) {
      channelName = channel.name;
      title = `#${channel.name}`;
    }
  }

  // Get sender info
  let senderName = "";
  let senderId = "";

  if (msg.userId) {
    senderId = msg.userId;
    const sender = await repo.user.get({ id: EntityId.from(msg.userId) });
    if (sender) {
      senderName = sender.name;
      // Include sender name in title
      if (channelName) {
        title = `${senderName} in #${channelName}`;
      } else {
        title = senderName;
      }
    }
  }

  // Build the notification payload
  // Handle parentId which might be an EntityId object or string
  let parentId: string | null = null;
  if (msg.parentId) {
    parentId = typeof msg.parentId === "object" && "value" in msg.parentId
      ? (msg.parentId as { value: string }).value
      : String(msg.parentId);
  }

  return {
    type: "notification",
    channelId: msg.channelId,
    parentId,
    title,
    body: msg.flat || "",
    senderId,
    senderName,
  };
}
