import { useDispatch, useEmoji, useMethods, useSelector } from '../../store';
import { EmojiBase } from './Emoji';
import { Tag } from '../atoms/Tag';
import { Tooltip } from '../atoms/Tooltip';
import styled from 'styled-components';
import { Icon } from '../atoms/Icon';
import { observer } from 'mobx-react-lite';


type ReactionProps = {
  shortname: string;
  messageId?: string;
  userNames: string[];
  onClick: () => void;
};
const Reaction = observer(({shortname, userNames, onClick}: ReactionProps) => {
  const emoji = useEmoji(shortname);


  return (
    <Tooltip text={[shortname, ...userNames]}>
      <Tag onClick={onClick}>
        <EmojiBase className="reaction-emoji" shortname={shortname} emoji={emoji} />
        {userNames.length > 1 ? <span className='count'>{userNames.length}</span> : null}
      </Tag>
    </Tooltip>
  );
})

const Container = styled.div`
  display: flex;
  flex-direction: row;
  .tag {
    flex: 0;
  }
  .count {
    margin-left: 4px;
  }
  .add-reaction {
    line-height: 20px;
    display: none;
  }
  &:hover .add-reaction {
    display: block;
  }

`;
type ReactionsProps = {
  messageId?: string;
  reactions?: { reaction: string, userId: string }[];
  onClick?: () => void;
};
export const Reactions = observer(({messageId, reactions = [], onClick}: ReactionsProps) => {
  const dispatch = useDispatch();
  const methods = useMethods();
  const users = useSelector((state) => state.users);

  const reactionMap = reactions
    .map((r) => ({
      ...r,
      userName: users[r.userId]?.name || 'Unknown'
    }))
    .reduce<{[reaction: string]: string[]}>((acc, r) => ({ ...acc, [r.reaction]: [...(acc[r.reaction] || []), r.userName] }), {});

  if ( reactions.length === 0 ) return null;
  return (
    <Container className="cmp-reactions">
      {Object.entries(reactionMap).map(([shortname, userNames]) => (
        <Reaction 
          key={shortname} 
          shortname={shortname} 
          userNames={userNames} 
          onClick={() => messageId && dispatch(methods.messages.addReaction({ id: messageId, text: shortname}))}
        />
      ))}
      {onClick && (
        <Tooltip text='Add reaction'>
          <Tag className="add-reaction" onClick={onClick}>
            <Icon icon='smile' />
          </Tag>
        </Tooltip>
      )}
    </Container>
  );
});
