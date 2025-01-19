import styled from 'styled-components';
import { useSelector, useDispatch } from '../../store';
import { gotoDirectChannel } from '../../services/channels';
import { observer } from 'mobx-react-lite';

const StyledLink = styled.a`
  span {
    padding-left: 1px;
    color: ${(props) => props.theme.mentionsColor};
  }
`;

type UserMentionProps = {
  userId: string;
};

export const UserMention = observer(({ userId: id }: UserMentionProps) => {
  // FIXME: dispatch and state type
  const dispatch = useDispatch();
  const user = useSelector((state) => state.users[id]);

  return (
    <StyledLink className='channel' onClick={() => dispatch(gotoDirectChannel({ userId: id }))} data-id={id} href={'#'} >
      <span className='name'>@{user?.name || id}</span>
    </StyledLink>
  );
});
