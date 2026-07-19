import { useEffect, useState } from "react";
import styled from "styled-components";
import { NavButton } from "./NavButton";
import {
  type ChannelViewKey,
  ChannelViewList,
} from "./NavChannelTree";
import { ClassNames, cn, isMobile, isUserActive } from "../../utils";
import { client } from "../../core";
import { User } from "../../types";
import { Icon } from "../atoms/Icon";
import { ProfilePic } from "../atoms/ProfilePic";
import { SectionHeader } from "../atoms/SectionHeader";
import { useSidebar } from "../contexts/useSidebar";
import { useNavigate, useParams } from "../AppRouter.tsx";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";
import {
  ReadReceiptModel,
  ReadReceiptsModel,
} from "../../core/models/readReceipt";
import { getFileUrl } from "../hooks/fileUrl";

const UserListContainer = styled.div`
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

  .user-entry {
    position: relative;

    .caret {
      position: absolute;
      top: 0;
      left: 2px;
      height: 30px;
      width: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 1;
      color: ${(props) => props.theme.Labels};
      transition: transform 0.15s ease;

      &.expanded {
        transform: rotate(90deg);
      }
    }
  }

  @media (max-width: 710px) {
    .user-entry .caret {
      height: 40px;
    }
  }
`;

type NavUserButtonProps = {
  user: {
    id: string;
    name: string;
    system?: boolean;
    connected?: boolean;
    lastSeen?: string;
    avatarFileId?: string;
    status?: "active" | "inactive" | "away";
  };
  size?: number;
  badge: ReadReceiptModel | null;
  className?: ClassNames;
  onClick: () => void;
};

export const NavUserButton = ({
  user,
  size,
  badge,
  className,
  onClick,
}: NavUserButtonProps) => {
  const avatarUrl = getFileUrl(user.avatarFileId);

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
          avatarUrl={avatarUrl}
          showStatus={false}
          className="pic-inline"
        />
        <span className="name">
          {user.name}
        </span>
      </NavButton>
    );
  }
  const active = isUserActive(user.lastSeen);
  return (
    <NavButton
      size={size}
      className={cn("user", {
        connected: user.connected ?? false,
        offline: !user.connected,
        recent: active,
        system: user.system ?? false,
      }, className)}
      data-id={user.id}
      onClick={onClick}
      badge={badge?.count ?? 0}
    >
      <ProfilePic
        type="status"
        avatarUrl={avatarUrl}
        status={user.status || "inactive"}
        showStatus
        className="pic-inline"
      />
      <span className="name">
        {user.name}
      </span>
    </NavButton>
  );
};

const NavUserContainer = observer(
  ({ user, badges, expanded, onToggle }: {
    user: User;
    badges: ReadReceiptsModel;
    expanded: boolean;
    onToggle: () => void;
  }) => {
    const app = useApp();
    const channel = app.channels.getDirect(String(user.id));
    let navigate = (_path: string) => {};
    try {
      navigate = useNavigate();
    } catch { /*ignore*/ }
    const { channelId: id, isFiles, isPins, isSearch } = useParams();
    const { hideSidebar } = useSidebar();
    const isActive = Boolean(channel) && id === channel?.id;
    const activeView: ChannelViewKey | null = isActive
      ? (isFiles ? "files" : isPins || isSearch ? null : "messages")
      : null;
    return (
      <div className="user-entry">
        {channel && (
          <span
            className={cn("caret", { expanded })}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            <Icon icon="chevron" size={12} />
          </span>
        )}
        <NavUserButton
          size={30}
          user={user as unknown as NavUserButtonProps["user"]}
          className={{ active: isActive }}
          badge={badges.getForChannel(channel?.id ? String(channel.id) : "")}
          onClick={async () => {
            const channel = await client.api.putDirectChannel(String(user.id));
            if (isMobile()) {
              hideSidebar();
            }
            navigate(`/${channel.id}`);
          }}
        />
        {channel && expanded && (
          <ChannelViewList
            channelId={channel.id}
            activeView={activeView}
            onSelectView={(channelId, view) => {
              if (isMobile()) hideSidebar();
              navigate(
                view === "files" ? `/${channelId}/files` : `/${channelId}`,
              );
            }}
          />
        )}
      </div>
    );
  },
);

export const NavUsers = observer(() => {
  const app = useApp();
  const users = app.users.getAll();
  const { channelId: id } = useParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeChannel = id ? app.channels.get(id) : null;
  const activeDmUser = activeChannel?.isDirect
    ? activeChannel.otherUser ?? activeChannel.user
    : null;
  const activeDmUserId = activeDmUser ? String(activeDmUser.id) : null;

  useEffect(() => {
    if (activeDmUserId) setExpandedId(activeDmUserId);
  }, [activeDmUserId]);

  return (
    <UserListContainer>
      <SectionHeader title="users" />
      {users && users.map((user) => (
        <NavUserContainer
          key={String(user.id)}
          user={user}
          badges={app.readReceipts}
          expanded={expandedId === String(user.id)}
          onToggle={() =>
            setExpandedId((cur) =>
              cur === String(user.id) ? null : String(user.id)
            )}
        />
      ))}
    </UserListContainer>
  );
});
