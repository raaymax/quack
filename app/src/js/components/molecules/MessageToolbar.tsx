import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import {
  useActions, useDispatch, useMethods, useSelector,
} from '../../store';
import { removeMessage } from '../../services/messages';
import { useHovered } from '../contexts/useHovered';
import { useMessageUser } from '../contexts/useMessageUser';
import { useMessageData } from '../contexts/useMessageData';
import { Toolbar } from '../atoms/Toolbar';
import { ButtonWithEmoji } from './ButtonWithEmoji';
import { ButtonWithIcon } from './ButtonWithIcon';
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

export const Container = styled.div`
  position: absolute;
  top: -15px;
  height: 42px;
  right: 10px;
  z-index: 50;
  background-color: ${({theme}) => theme.Chatbox.Background};
  color: ${({theme}) => theme.SecondaryButton.Default}
  border: 1px solid #565856;
  box-shadow: 0px 0px 4px 1px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 0px;
  font-size: 0.9em;
  box-sizing: border-box;

  body.mobi8px{
    width: 100%;
    top: -50px;
    right: 0;
    border-radius: 0;
    border-top: 1px solid #565856;
    border-bottom: 1px solid #565856;
    border-left: 0;
    border-right: 0;
    margin: 0;
    padding: 0;
    height: 50px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    i {
      flex: 0 50px;
      line-height: 50px;
      font-size: 25px;

    }
  }
`;

export const MessageToolbar = observer(({navigate}: {navigate: (path: string) => void}) => {
  const message = useMessageData();
  const user = useMessageUser();
  const { id, pinned, channelId } = message;
  const [view, setView] = useState<string | null>(null);
  const dispatch = useDispatch();
  const methods = useMethods();
  const actions = useActions();
  const {parentId} = useParams();
  const onDelete = useCallback(() => {
    if (id) dispatch(removeMessage({ id }));
  }, [dispatch, id]);

  const meId = useSelector((state) => state.me);
  const isMe = user?.id === meId;
  const [hovered] = useHovered();

  useEffect(() => setView(null), [hovered]);

  if (hovered !== id) return null;

  const reaction = (emoji: string) => (
    <ButtonWithEmoji
      key={emoji}
      emoji={emoji}
      onClick={() => dispatch(methods.messages.addReaction({ id, text: emoji }))} />
  );
  const deleteButton = () => <ButtonWithIcon key='del' icon="delete" onClick={() => setView('delete')} />;
  const confirmDelete = () => <ButtonWithIcon key='confirm_del' icon="check:danger" onClick={onDelete} />;
  const cancelButton = () => <ButtonWithIcon key='cancel' icon="circle-xmark" onClick={() => setView(null)} />;
  const editButton = () => <ButtonWithIcon disabled={true} tooltip="Not yet available" key='edit' icon="edit" onClick={() => dispatch(actions.messages.toggleEdit(id))} />
  const openReactions = () => <ButtonWithIcon key='reactions' icon="icons" onClick={() => setView('reactions')} />;
  const pinButton = () => <ButtonWithIcon key='pin' icon="thumbtack" onClick={() => dispatch(methods.pins.pin({ id, channelId }))} />;
  const unpinButton = () => <ButtonWithIcon key='unpin' icon="thumbtack" onClick={() => dispatch(methods.pins.unpin({ id, channelId }))} />;
  const replyButton = () => <ButtonWithIcon key='reply' icon="reply" onClick={() => {
    navigate(`/${channelId}/t/${id}`);
  }} />;

  return (
    <Container>
      <Toolbar size={40}>
        {view === 'reactions' && [
          ':heart:',
          ':rofl:',
          ':thumbsup:',
          ':thumbsdown:',
          ':tada:',
          ':eyes:',
          ':white_check_mark:',
        ].map(reaction)}
        {view === 'delete' && [
          confirmDelete(),
          cancelButton(),
        ]}
        {view === null && [
          openReactions(),
          isMe && editButton(),
          isMe && deleteButton(),
          pinned ? unpinButton() : pinButton(),
          !parentId && replyButton(),
        ]}

      </Toolbar>
    </Container>
  );
});
