import styled from 'styled-components';
import { useCallback, useEffect } from 'react';
import { Channel } from '../molecules/NavChannel';
import { useDispatch, useMethods, useSelector } from '../../store';
import { HoverProvider } from '../contexts/hover';
import { MessageList } from '../organisms/MessageListScroller';
import { Message as MessageType } from '../../types';
import { useNavigate, useNavigation, useParams } from 'react-router-dom';
import { useSidebar } from '../contexts/useSidebar';
import { ButtonWithIcon } from '../molecules/ButtonWithIcon';
import { MessageListArgsProvider } from '../contexts/messageListArgs';
import { Toolbar } from '../atoms/Toolbar';
import { BaseRenderer } from './MessageListRenderer';

const StyledPins = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;

  .message-list-scroll {
    padding: 0px 16px 16px 16px;
    padding-bottom: 50px;
  }
  .message.pinned {
    background-color: ${(props) => props.theme.Chatbox.Background};
    border-radius: 8px;
    margin: 8px 0px;
  }
  & .message:hover {
      background-color: var(--primary_active_mask);
  }
`;

const StyledHeader = styled.div`
  display: flex;
  flex-direction: row;
  padding: 16px 16px 16px 16px;
`;

export const Header = () => {
  const navigate = useNavigate();
  return (
    <StyledHeader>
      <Toolbar size={28}>
        <h2>
        Pinned messages
        </h2>
        <ButtonWithIcon icon='xmark' onClick={() => navigate('..', {relative: 'path'})} />
      </Toolbar>
    </StyledHeader>
  );
};

export const PinsInner = () => {
  const { channelId } = useParams()!;
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const methods = useMethods();
  const navigate = useNavigate();
  useEffect(() => {
    if (!channelId) {
      return navigate('/');
    }
    dispatch(methods.pins.load(channelId));
  }, [navigation])
  const messages = useSelector((state) => channelId ? state.pins[channelId] : []);
  const gotoMessage = useCallback((msg: MessageType) => {
    navigate(`/${msg.channelId}${(msg.parentId ? '/t/'+msg.parentId : '')}`, {
      state: {
        type: 'archive',
        selected: msg.id,
        date: msg.createdAt,
      }
    });
  }, [navigate]);
  return (
    <StyledPins className='pins'>
      <HoverProvider>
        <Header />
        <MessageList
          renderer={BaseRenderer}
          list={messages || []}
          onMessageClicked={(msg: MessageType) => {
            gotoMessage(msg);
          }}
        />
      </HoverProvider>
    </StyledPins>
  );
};

export const Pins = () => {
  return (
    <MessageListArgsProvider streamId="pins">
      <PinsInner />
    </MessageListArgsProvider>
  );
}
