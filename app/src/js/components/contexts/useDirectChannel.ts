import { useEffect, useState } from "react";
import { client } from "../../core/index.ts";
import { Channel } from "../../types.ts";

export const useDirectChannel = (userId: string) => {
  const [channel, setChannel] = useState<Channel | null>(null);
  useEffect(() => {
    setChannel(null);
    client.api.getDirectChannel(userId).then((channel) => {
      setChannel(channel);
    }).catch(() => {
      setChannel(null);
    });
  }, [userId]);
  return channel;
};
