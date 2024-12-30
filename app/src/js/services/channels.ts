import { createMethod } from '../store';

export const gotoDirectChannel = createMethod('gotoDirectChannel', async (
  { userId, x = false }: {userId: string, x?: boolean},
  {
    dispatch, getState, methods, actions,
  },
) => {
  const { me: meId, channels } = getState();
  const direct = Object.values(channels).find((c) => (
    c.direct === true
    && c.users.includes(userId)
    && (userId === meId
      ? (c.users.length === 2 && c.users.every((u) => u === meId))
      : true)));

  if (!x && !direct) {
    dispatch(methods.channels.create({ channelType: 'DIRECT', name: 'Direct', users: [userId] }));
    setTimeout(() => {
      dispatch(gotoDirectChannel({ userId, x: !x }));
    }, 1000);
    return;
  }
  if (!direct) return;
  dispatch(actions.view.set(null));
});
