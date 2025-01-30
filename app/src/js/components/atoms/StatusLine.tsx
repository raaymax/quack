import { observer } from 'mobx-react-lite';
import { useApp } from '../contexts/appState';

export const StatusLine = observer(({channelId, parentId}: {channelId: string, parentId?: string | null}) => {
  const app = useApp();
  const typingModel = app.getThread(channelId, parentId).typing;
  
  if(app.message) {
      console.log('app.message', app.message);
      return <div className='info'>{app.message}</div>
  }

  return <div className='info'>{typingModel.getStatusLine()}</div>
});
