import styled from 'styled-components';
import { ProfilePic } from './ProfilePic';
import { ButtonWithIcon } from '../molecules/ButtonWithIcon';
import { client } from '../../core';
import { observer } from 'mobx-react-lite';
import { useApp } from '../contexts/appState';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding: 12px;
  width: 100%;

  .profile-pic {
    flex: 0 0 32px;
  }
  .user-info {
    flex: 1;
    .name {
      color: ${(props) => props.theme.Text};
      font-size: 14px;
      font-style: normal;
      font-weight: 600;
      line-height: 21px; /* 150% */
    }
    .status {
      color: ${(props) => props.theme.Labels};
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: 10px; /* 83.333% */
    }
  }
  .user-actions {
    flex: 0 0 32px;

    .logout-button {
      color: ${({ theme }) => theme.SecondaryButton.Default};
    }
    .logout-button:hover {
      background-color: ${({ theme }) => theme.Channel.Hover};
      color: ${({ theme }) => theme.Channels.HoverText};
    }
  }
`;

export const LoggedUser = observer(() => {
  const user = useApp().profile;
  if (!user) {
    return null;
  }

  return (
    <Container>
      <div className="profile-pic">
        <ProfilePic type="personal" userId={user.id} />
      </div>
      <div className="user-info">
        <div className="name">{user.name}</div>
        <div className="status">Online</div>
      </div>
      <div className="user-actions">
        <ButtonWithIcon className="logout-button" icon="logout" size={32} onClick={async () => {
          await client.api.auth.logout();
          document.location.reload();
        }}/>
      </div>
    </Container>
  );
});
