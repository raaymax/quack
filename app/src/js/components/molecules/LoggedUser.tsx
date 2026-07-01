import styled from "styled-components";
import { ProfilePic } from "../atoms/ProfilePic";
import { ButtonWithIcon } from "./ButtonWithIcon";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding: 12px;
  width: 100%;

  .profile-trigger {
    display: flex;
    flex-direction: row;
    gap: 12px;
    flex: 1;
    min-width: 0;
    align-items: center;
    cursor: pointer;
    border-radius: 8px;
    padding: 2px;
    margin: -2px;

    &:hover {
      background-color: ${({ theme }) => theme.Channel.Hover};
    }
  }
  .profile-pic {
    flex: 0 0 32px;
  }
  .user-info {
    flex: 1;
    min-width: 0;
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

type LoggedUserProps = {
  name: string;
  avatarUrl?: string;
  onLogout: () => void;
  onOpenSettings?: () => void;
};

export const LoggedUser = (
  { name, avatarUrl, onLogout, onOpenSettings }: LoggedUserProps,
) => {
  return (
    <Container>
      <div className="profile-trigger" onClick={onOpenSettings}>
        <div className="profile-pic">
          <ProfilePic type="personal" avatarUrl={avatarUrl} />
        </div>
        <div className="user-info">
          <div className="name">{name}</div>
          <div className="status">Online</div>
        </div>
      </div>
      <div className="user-actions">
        <ButtonWithIcon
          className="logout-button"
          icon="logout"
          size={32}
          onClick={onLogout}
        />
      </div>
    </Container>
  );
};
