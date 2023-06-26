import { h } from 'preact';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { gotoDirectChannel } from '../../services/channels';
import { useUsers } from '../../hooks';

const Header = styled.div`
 padding: 5px 10px;
 padding-top: 20px;
 font-weight: bold;
`;

const UserContainer = styled.div`
 padding: 5px 5px 5px 20px; 
 cursor: pointer;
 .name {
   padding: 0px 10px; 
   cursor: pointer;
  }
  &.active {
    background-color: var(--primary_active_mask);
  }

  &:hover {
    background-color: var(--primary_active_mask);
  }
  &.system{
    color: ${(props) => props.theme.userSystem};
  }
  &.connected{
    color: ${(props) => props.theme.userConnected};
  }
  &.recent{
    color: ${(props) => props.theme.userActive};
  }
  color: ${(props) => props.theme.userDisconnected};
`;

export const User = ({ userId, onClick }) => {
  const user = useSelector((state) => state.users[userId]);
  const active = user.lastSeen && new Date(user.lastSeen).getTime() > Date.now() - 1000 * 60 * 5;
  if (!user) return null;
  return (
    <UserContainer onClick={onClick} className={`user ${user.connected ? 'connected ' : ''}${active ? 'recent' : ''}${user.system ? 'system' : ''}`} data-id={userId}>
      {!user.system ? (<i class='fa-solid fa-user' />) : (
        <i class="fa-solid fa-user-gear" />)}
      <span class='name'>{user.name}</span>
    </UserContainer>
  );
};

export const UserList = () => {
  const dispatch = useDispatch();
  const users = useUsers();
  return (
    <div class='user-list'>
      <Header>users</Header>
      { users && users.map((c) => (
        <User
          userId={c.id}
          key={c.id}
          onClick={() => {
            dispatch(gotoDirectChannel(c.id));
          }}
        />
      ))}
    </div>
  );
};