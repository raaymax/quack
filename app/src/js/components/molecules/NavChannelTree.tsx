import { useEffect, useState } from "react";
import styled from "styled-components";
import { Icon, IconNames } from "../atoms/Icon";
import { Badge } from "../atoms/Badge";
import { ClassNames, cn } from "../../utils";

export type ChannelKind = "PUBLIC" | "PRIVATE" | "DIRECT";
export type ChannelViewKey = "messages" | "files";

export type ChannelNavItem = {
  id: string;
  name: string;
  kind: ChannelKind;
  unread?: number;
};

const CHANNEL_ICON: Record<ChannelKind, IconNames> = {
  PUBLIC: "hash",
  PRIVATE: "lock",
  DIRECT: "user",
};

type ViewDef = {
  key: ChannelViewKey;
  label: string;
  icon: IconNames;
};

const VIEWS: ViewDef[] = [
  { key: "messages", label: "Messages", icon: "messages" },
  { key: "files", label: "Files", icon: "files" },
];

const Container = styled.div`
  display: flex;
  flex-direction: column;
  color: ${(props) => props.theme.Text};

  .channel-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px 5px 4px;
    cursor: pointer;

    &:hover {
      font-weight: bold;
      background-color: ${(props) => props.theme.Channel.Hover};
      color: ${(props) => props.theme.Channels.HoverText};
    }

    &.active {
      background-color: var(--primary_active_mask);
    }

    .caret {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 16px;
      height: 16px;
      color: ${(props) => props.theme.Labels};
      transition: transform 0.15s ease;
    }

    &.expanded .caret {
      transform: rotate(90deg);
    }

    .channel-icon {
      flex: 0 0 auto;
      color: ${(props) => props.theme.Labels};
    }

    .channel-name {
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .views {
    display: flex;
    flex-direction: column;
    margin: 2px 0 6px 0;
  }

  .view-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px 4px 40px;
    font-size: 13px;
    cursor: pointer;
    color: ${(props) => props.theme.Labels};

    &:hover {
      background-color: ${(props) => props.theme.Channel.Hover};
      color: ${(props) => props.theme.Channels.HoverText};
    }

    &.active {
      color: ${(props) => props.theme.Text};
      background-color: var(--primary_active_mask);
    }

    .view-name {
      flex: 1;
    }
  }
`;

type NavChannelTreeProps = {
  channels: ChannelNavItem[];
  activeChannelId?: string;
  activeView?: ChannelViewKey | null;
  onSelectChannel?: (channelId: string) => void;
  onSelectView?: (channelId: string, view: ChannelViewKey) => void;
  className?: ClassNames;
};

export const NavChannelTree = ({
  channels,
  activeChannelId,
  activeView = "messages",
  onSelectChannel,
  onSelectView,
  className,
}: NavChannelTreeProps) => {
  const [expandedId, setExpandedId] = useState<string | undefined>(
    activeChannelId,
  );

  useEffect(() => {
    if (activeChannelId) setExpandedId(activeChannelId);
  }, [activeChannelId]);

  const toggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedId((cur) => (cur === id ? undefined : id));
  };

  const openChannel = (id: string) => {
    setExpandedId(id);
    onSelectChannel?.(id);
  };

  return (
    <Container className={cn("nav-channel-tree", className)}>
      {channels.map((channel) => {
        const expanded = expandedId === channel.id;
        const isActiveChannel = activeChannelId === channel.id;
        return (
          <div key={channel.id}>
            <div
              className={cn("channel-row", {
                active: isActiveChannel,
                expanded,
              })}
              onClick={() => openChannel(channel.id)}
            >
              <span
                className="caret"
                onClick={(e) => toggle(e, channel.id)}
              >
                <Icon icon="chevron" size={12} />
              </span>
              <Icon
                className="channel-icon"
                icon={CHANNEL_ICON[channel.kind]}
                size={14}
              />
              <span className="channel-name">{channel.name}</span>
              {channel.unread
                ? <Badge>{channel.unread}</Badge>
                : null}
            </div>

            {expanded && (
              <div className="views">
                {VIEWS.map((view) => (
                  <div
                    key={view.key}
                    className={cn("view-row", {
                      active: isActiveChannel && activeView === view.key,
                    })}
                    onClick={() => onSelectView?.(channel.id, view.key)}
                  >
                    <Icon icon={view.icon} size={12} />
                    <span className="view-name">{view.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </Container>
  );
};
