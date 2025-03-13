type Thread = {
  channelId: string;
  parentId?: string | null;
};
export const isSameThread = (a: Thread, b: Thread): boolean => {
  return a.channelId === b.channelId &&
    ((!a.parentId && !b.parentId) || a.parentId === b.parentId);
};
