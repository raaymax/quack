import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { ChannelType } from "../../types";
import { CHANNEL_ICON, Icon, IconNames } from "../atoms/Icon";
import { Badge } from "../atoms/Badge";
import { ClassNames, cn } from "../../utils";

export type ChannelViewKey = "messages" | "files";

export type ChannelNavItem = {
  id: string;
  name: string;
  kind: ChannelType;
  unread?: number;
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
    padding: 5px 8px;
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

`;

const ViewsContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin: 2px 0 6px 0;

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

type ChannelViewListProps = {
  channelId: string;
  activeView?: ChannelViewKey | null;
  onSelectView?: (channelId: string, view: ChannelViewKey) => void;
  className?: ClassNames;
};

export const ChannelViewList = ({
  channelId,
  activeView = null,
  onSelectView,
  className,
}: ChannelViewListProps) => (
  <ViewsContainer className={cn("views", className)}>
    {VIEWS.map((view) => (
      <div
        key={view.key}
        className={cn("view-row", { active: activeView === view.key })}
        onClick={() => onSelectView?.(channelId, view.key)}
      >
        <Icon icon={view.icon} size={12} />
        <span className="view-name">{view.label}</span>
      </div>
    ))}
  </ViewsContainer>
);

type NavChannelTreeProps = {
  channels: ChannelNavItem[];
  activeChannelId?: string;
  activeView?: ChannelViewKey | null;
  onSelectChannel?: (channelId: string) => void;
  onSelectView?: (channelId: string, view: ChannelViewKey) => void;
  expandedId?: string | null;
  onExpand?: (id: string | null) => void;
  className?: ClassNames;
};

export const NavChannelTree = ({
  channels,
  activeChannelId,
  activeView = "messages",
  onSelectChannel,
  onSelectView,
  expandedId: expandedIdProp,
  onExpand,
  className,
}: NavChannelTreeProps) => {
  const [internalExpanded, setInternalExpanded] = useState<string | null>(
    activeChannelId ?? null,
  );
  const expandedId = onExpand ? (expandedIdProp ?? null) : internalExpanded;
  const setExpanded = onExpand ?? setInternalExpanded;

  const pendingExpand = useRef<string | null>(null);

  useEffect(() => {
    pendingExpand.current = activeChannelId ?? null;
  }, [activeChannelId]);

  useEffect(() => {
    const pending = pendingExpand.current;
    if (pending && channels.some((c) => c.id === pending)) {
      setExpanded(pending);
      pendingExpand.current = null;
    }
  }, [activeChannelId, channels, setExpanded]);

  const toggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpanded(expandedId === id ? null : id);
  };

  const openChannel = (id: string) => {
    setExpanded(id);
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
              <Icon
                className="channel-icon"
                icon={CHANNEL_ICON[channel.kind]}
                size={14}
              />
              <span className="channel-name">{channel.name}</span>
              {channel.unread
                ? <Badge>{channel.unread}</Badge>
                : null}
              <span
                className="caret"
                onClick={(e) => toggle(e, channel.id)}
              >
                <Icon icon="chevron" size={12} />
              </span>
            </div>

            {expanded && (
              <ChannelViewList
                channelId={channel.id}
                activeView={isActiveChannel ? activeView : null}
                onSelectView={onSelectView}
              />
            )}
          </div>
        );
      })}
    </Container>
  );
};
