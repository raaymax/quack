import styled from "styled-components";
import { NavButton } from "./NavButton";
import { ClassNames, cn, isMobile } from "../../utils";
import { client } from "../../core";
import { User } from "../../types";
import { ProfilePic } from "../atoms/ProfilePic";
import { useSidebar } from "../contexts/useSidebar";
import { useNavigate, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";
import {
  ReadReceiptModel,
  ReadReceiptsModel,
} from "../../core/models/readReceipt";

const UserListContainer = styled.div`

  .header {
    display: flex;
    flex-direction: row;
    padding: 5px 10px;
    padding-top: 20px;
    font-weight: bold;
    .title {
      flex: 1;
    }

    i {
      cursor: pointer;
      flex: 0 15px;
      font-size: 19px;
    }

  }

  .user {
    padding: 5px 5px 5px 20px; 
    cursor: pointer;
  }
  .user .name {
    font-size: 16px;
    padding: 0px 10px; 
    cursor: pointer;
  }
  .user.active {
    background-color: var(--primary_active_mask);
  }

  .user:hover {
    font-weight: bold;
    background-color: ${(props) => props.theme.Channel.Hover};
    color: ${(props) => props.theme.Channels.HoverText};
  }

  .pic-inline {
    vertical-align: middle;
    display: inline-block;
  }
`;

type NavUserButtonProps = {
  user: {
    id: string;
    name: string;
    system?: boolean;
    connected?: boolean;
    lastSeen?: string;
  };
  size?: number;
  badge: ReadReceiptModel | null;
  className?: ClassNames;
  onClick: () => void;
};

export const NavUserButton = observer(({
  user,
  size,
  badge,
  className,
  onClick,
}: NavUserButtonProps) => {
  if (user.system) {
    return (
      <NavButton
        className={cn("user", className)}
        size={size}
        data-id={user.id}
        onClick={onClick}
        badge={badge?.count ?? 0}
      >
        <ProfilePic
          type="status"
          userId={user.id}
          showStatus={false}
          className="pic-inline"
        />
        <span className="name">
          {user.name}
        </span>
      </NavButton>
    );
  }
  const active = user.lastSeen &&
    new Date(user.lastSeen).getTime() > Date.now() - 1000 * 60 * 5;
  return (
    <NavButton
      size={size}
      className={cn("user", {
        connected: user.connected ?? false,
        offline: !user.connected,
        recent: Boolean(active),
        system: user.system ?? false,
      }, className)}
      data-id={user.id}
      onClick={onClick}
      badge={badge?.count ?? 0}
    >
      <ProfilePic
        type="status"
        userId={user.id}
        showStatus
        className="pic-inline"
      />
      <span className="name">
        {user.name}
      </span>
    </NavButton>
  );
});

const NavUserContainer = observer(
  ({ user, badges }: { user: User; badges: ReadReceiptsModel }) => {
    const app = useApp();
    const channel = app.channels.getDirect(user.id);
    let navigate = (_path: string) => {};
    try {
      navigate = useNavigate();
    } catch { /*ignore*/ }
    const { channelId: id } = useParams();
    const { hideSidebar } = useSidebar();
    return (
      <NavUserButton
        size={30}
        user={user}
        className={{ active: id === channel?.id }}
        badge={badges.getForChannel(channel?.id)}
        onClick={async () => {
          const channel = await client.api.putDirectChannel(user.id);
          if (isMobile()) {
            hideSidebar();
          }
          navigate(`/${channel.id}`);
        }}
      />
    );
  },
);

export const NavUsers = observer(() => {
  const app = useApp();
  const users = app.users.getAll();

  return (
    <UserListContainer>
      <div className="header">
        <span className="title">users</span>
      </div>
      {users && users.map((user) => (
        <NavUserContainer
          key={user.id}
          user={user}
          badges={app.readReceipts}
        />
      ))}
    </UserListContainer>
  );
});
