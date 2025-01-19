import { useEffect } from 'react';
import styled from 'styled-components';
import {
  useActions, useDispatch, useMethods, useSelector,
} from '../../store';
import { Icon } from '../atoms/Icon';
import { observer } from 'mobx-react-lite';

const StyledChannelLink = styled.a`
  span {
    padding-left: 1px;
  }
`;

type ChannelInlineProps = {
  channelId: string;
};

export const ChannelLink = observer(({ channelId: id }: ChannelInlineProps) => {
  const dispatch = useDispatch();
  const methods = useMethods();
  const actions = useActions();
  const channel = useSelector((state) => state.channels[id]);
  useEffect(() => {
    if (!channel) {
      dispatch(methods.channels.find(id));
    }
  }, [id, channel, methods, dispatch]);
  return (
    <StyledChannelLink className='channel' data-id={id} href={`#${channel?.id || id}`} onClick={() => {
      dispatch(actions.view.set(null));
    }} >
      { channel?.private ? <Icon icon='lock' /> : <Icon icon="hash" /> }
      <span className='name'>{channel?.name || channel?.id || id}</span>
    </StyledChannelLink>
  );
});
