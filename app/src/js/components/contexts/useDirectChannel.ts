import { useEffect, useState } from "react";
import { client } from "../../core";
import { Channel } from "../../types";

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
