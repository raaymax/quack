import { useSelector, useTyping } from '../../store';
import { observer } from 'mobx-react-lite';

export const StatusLine = observer(({channelId, parentId}: {channelId: string, parentId?: string}) => {
  const info = useSelector((state) => state.info);
  const typing = useTyping(channelId, parentId); // FIXME: status line should work in context

  const names = (typing || []).map((u) => u.name).join(', ');

  if (info?.type) {
    return (
      <div className={['info', info.type].join(' ')}>{info.message}</div>
    );
  }

  if (names) {
    return (
      <div className='info'>{names} is typing!</div>
    );
  }

  return <div className='info' />;
});
