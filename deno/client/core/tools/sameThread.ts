import { Eid } from "../../types.ts";

type Thread = {
  channelId: Eid;
  parentId?: Eid | null;
};
export const isSameThread = (a: Thread, b: Thread): boolean => {
  return a.channelId === b.channelId &&
    ((!a.parentId && !b.parentId) || a.parentId === b.parentId);
};
