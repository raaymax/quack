import { useCallback } from 'react';
import styled from 'styled-components';
import { useDispatch } from '../../store';

import { resend } from '../../services/messages';

import { ProfilePic } from '../atoms/ProfilePic';
import { LinkPreviewList } from '../atoms/LinkPreview';
import { ReadReceipt } from '../molecules/ReadReceipt';
import { MessageBodyRenderer } from '../molecules/MessageBody';
import { Files } from '../molecules/Files';
import { Reactions } from '../molecules/Reactions';
import { MessageToolbar } from '../molecules/MessageToolbar';
import { ThreadInfo } from '../molecules/ThreadInfo';

import { MessageHeader } from '../atoms/MessageHeader';
import { MessageProvider } from '../contexts/message';
import { useMessageData } from '../contexts/useMessageData';
import { useMessageUser } from '../contexts/useMessageUser';
import { useHoverCtrl } from '../contexts/useHoverCtrl';

import {
  cn, ClassNames, formatTime
} from '../../utils';

import { ViewMessage } from '../../types';
import { useMessageListArgs } from '../contexts/useMessageListArgs';
//import { useNavigate } from 'react-router-dom';


const MessageContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  animation-duration: 1s;
  animation-iteration-count: 1;
  margin: 0;
  padding: 8px 16px 8px 16px;
  line-height: 24px;
  vertical-align: middle;
  color: ${(props) => props.theme.Text};

  &.short {
    padding-left: 0px;
    padding: 4px 16px 4px 16px;
  }

  .pins &.pinned {
    background-color: transparent;
  }
  &.pinned {
    background-color: rgb(from ${props => props.theme.PrimaryButton.Background} r g b / 10%);
  }

  &.pinned:hover {
    background-color: rgb(from ${props => props.theme.PrimaryButton.Background} r g b / 15%);
  }

  &.selected {
    background-color: ${(props) => props.theme.Chatbox.Message.Hover};
  }

  .side-time {
    flex: 0 48px;
    width: 48px;
    min-width: 44px;
    color: transparent;
    font-weight: 200;
    font-size: .8em;
    text-align: center;
  }
  &:hover .side-time {
    color: ${(props) => props.theme.Labels};
  }

  &.ephemeral{
    border-left: 4px solid ${(props) => props.theme.PrimaryButton.Background}; 
    padding-left: 12px;
  }

  .info {
    padding: 12px 0px;
    vertical-align: middle;
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: 24px; /* 150% */
    &.error {
      color: ${(props) => props.theme.User.Inactive};
    }
  }

  .content {
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
  }

  .content img {
    max-width: 300px;
    height: auto;
  }
  .content p{
    white-space: break-spaces;
    word-break: break-word;
  }
  .content.big-emoji {
    font-size: 30px;
    line-height: 35px;
  }
  .content.big-emoji .emoji {
    font-size: 30px;
    line-height: 35px;
  }
   .content.big-emoji .emoji  img !important {
    height: 3em;
    width: 3em;
  }
  .body {
    flex: 1;
    padding: 0;
    padding-left: 16px;
    line-break: auto;
    hyphens: auto;
    width: calc(100% - 75px);
  }
  &:hover {
    background-color: ${(props) => props.theme.Chatbox.Message.Hover};
  }
  .cmp-thread-info, .cmp-link-preview-list, .cmp-files, .cmp-reactions {
    margin-top: 4px;
  }
`;

const Info = () => {
  const { clientId, info } = useMessageData();
  const dispatch = useDispatch();

  const onAction = useCallback(() => {
    if (info?.action === 'resend') {
      dispatch(resend(clientId));
    }
  }, [dispatch, clientId, info]);

  if (!info) return null;
  return (
    <div onClick={onAction} className={['info', info.type, ...(info.action ? ['action'] : [])].join(' ')}>
      {info.msg}
    </div>
  );
};


type MessageBaseProps = {
  onClick?: (e?: React.MouseEvent) => void;
  sameUser?: boolean;
  className?: ClassNames;
  navigate: (path: string) => void;
  [key: string]: unknown;
};

const MessageBase = ({ onClick, sameUser, navigate = () => {}, ...props }: MessageBaseProps) => {
  const msg = useMessageData();
  const {
    id, message, emojiOnly,
    createdAt, pinned,
    editing,
    userId,
    linkPreviews,
    reactions,
    annotations,
    ephemeral,
  } = msg;
  const { onEnter, toggleHovered, onLeave } = useHoverCtrl(msg.id);
  const [{ selected, id: streamName }] = useMessageListArgs();
  const user = useMessageUser();

  return (
    <MessageContainer
      onClick={(e) => {
        toggleHovered();
        if (onClick) onClick(e);
      }}
      {...props}
      className={cn('message', {
        ephemeral: Boolean(ephemeral),
        pinned,
        short: Boolean(sameUser),
        selected: Boolean(id) && selected === id,
      }, props.className)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {!sameUser
        ? <ProfilePic type='regular' userId={userId} />
        : <div className='spacy side-time'>{formatTime(createdAt)}</div>
      }
      <div className='body'>
        {!sameUser && <MessageHeader user={user} createdAt={createdAt} />}
        {editing
          ? <div> Editing not implemented </div>
          : <div className={['content'].join(' ')}>
            <MessageBodyRenderer body={message} opts={{emojiOnly}} />
          </div>
        }

        <Files list={msg.attachments || []} />
        {linkPreviews && <LinkPreviewList links={linkPreviews} />}
        <Info />
        <Reactions messageId={id} reactions={reactions}/>
        {streamName != 'side' && <ThreadInfo navigate={navigate} msg={msg}/>}
        <ReadReceipt data={msg.progress} />
        <MessageToolbar navigate={navigate} />
        {annotations && <div className='generated'>
          <MessageBodyRenderer body={annotations} />
        </div>}
      </div>
    </MessageContainer>
  );
};

type MessageProps = MessageBaseProps & {
  data: ViewMessage;
  navigate?: (path: string) => void;
};

export const Message = ({ data, ...props }: MessageProps) => (
  <MessageProvider value={data}>
    <MessageBase {...props} />
  </MessageProvider>
);
