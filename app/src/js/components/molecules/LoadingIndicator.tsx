import { useSelector } from '../../store';
import { Loader } from '../atoms/Loader';
import { observer } from 'mobx-react-lite';

export const LoadingIndicator = observer(() => {
  const loading = useSelector((state) => state.messages.loading);
  if (!loading) return null;
  return <Loader />;
})
