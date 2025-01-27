import styled from 'styled-components';
import { useCallback, useEffect } from 'react';
import { HoverProvider } from '../contexts/hover';
import { MessageList } from '../organisms/MessageListScroller';
import { Message as MessageType } from '../../types';
import { useNavigate, useNavigation, useParams } from 'react-router-dom';
import { ButtonWithIcon } from '../molecules/ButtonWithIcon';
import { MessageListArgsProvider } from '../contexts/messageListArgs';
import { Toolbar } from '../atoms/Toolbar';
import { BaseRenderer } from './MessageListRenderer';
import { observer } from 'mobx-react-lite';
import { useApp } from '../contexts/appState';
import { MessageModel } from '../../core/models/message';

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

export const Header = observer(() => {
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
});

export const PinsInner = observer(() => {
  const app = useApp();
  const { channelId } = useParams()!;
  const navigation = useNavigation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!channelId) {
      return navigate('/');
    }
  }, [navigation])
  const messagesModel = app.getPins(channelId ?? '');
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
          model={messagesModel}
          onMessageClicked={(msg: MessageModel) => {
            gotoMessage(msg);
          }}
        />
      </HoverProvider>
    </StyledPins>
  );
});

export const Pins = observer(() => {
  return (
    <MessageListArgsProvider streamId="pins">
      <PinsInner />
    </MessageListArgsProvider>
  );
})
