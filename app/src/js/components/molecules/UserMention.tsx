import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { useApp } from '../contexts/appState';
import type { UserModel } from '../../core/models/user';
import { useNavigate } from 'react-router-dom';

const StyledLink = styled.a`
  span {
    padding-left: 1px;
    color: ${(props) => props.theme.mentionsColor};
  }
`;

type UserMentionBaseProps = {
  user: UserModel;
};

export const UserMentionBase = observer(({ user }: UserMentionBaseProps) => {
  // FIXME: dispatch and state type
  const navigate = useNavigate()

  return (
    <StyledLink className='channel' onClick={() => navigate('/'+user.channelId)} data-id={user.id} href={'#'} >
      <span className='name'>@{user?.name || user.id}</span>
    </StyledLink>
  );
});
type UserMentionProps = {
  userId: string;
};

export const UserMention= observer(({ userId: id }: UserMentionProps) => {
  const app = useApp();
  const user = app.users.get(id);
  if (!user) {
    return <span>@{id}</span>;
  }
  return <UserMentionBase user={user} />;
});
