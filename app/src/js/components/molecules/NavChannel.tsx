import { useEffect } from "react";
import styled from "styled-components";
import { Badge } from "../atoms/Badge";
import { TooltipTag } from "../atoms/TooltipTag";
import { TextWithIcon } from "./TextWithIcon";
import { ClassNames, cn } from "../../utils";
import { User } from "../../types";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";
import type { ChannelModel } from "../../core/models/channel";
import { ReadReceiptModel } from "../../core/models/readReceipt";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  cursor: pointer;
  overflow: hidden;
  & :first-child {
    flex: 1;
  }
  .text-with-icon {
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &.active {
    background: ${(props) => props.theme.ActiveOverlay};
  }
  &:hover {
    background-color: ${(props) => props.theme.Channel.Hover};
  }
`;

type InlineChannelProps = {
  id: string;
  children: React.ReactNode;
  badge?: ReadReceiptModel | null;
  className?: ClassNames;
  onClick?: () => void;
  icon?: string;
  secured?: boolean;
};

export const InlineChannel = observer(({
  id,
  children,
  badge,
  className,
  onClick,
  icon = "fa-solid fa-hashtag",
  secured,
}: InlineChannelProps) => (
  <Container
    className={cn("channel", "inline-channel", className)}
    data-id={id}
    onClick={onClick}
  >
    <TextWithIcon icon={icon}>{children}</TextWithIcon>
    {(badge && badge.count > 0) ? <Badge>{badge.count}</Badge> : null}
    {secured
      ? (
        <TooltipTag
          tooltip={[
            "Messages in this channel are encrypted",
            "using your password",
            "Files encription not yet implemented",
          ]}
        >
          E2EE
        </TooltipTag>
      )
      : null}
  </Container>
));

type DirectChannelProps = {
  channel: ChannelModel;
  badge?: ReadReceiptModel | null;
  onClick?: () => void;
  className?: ClassNames;
};

const DirectChannel = observer(({
  channel,
  badge,
  onClick,
  className,
}: DirectChannelProps) => {
  const user: User | null = channel.otherUser || channel.user;
  const secured = channel.isDirect;
  if (!user) return null;
  const active = user.lastSeen &&
    new Date(user.lastSeen).getTime() > Date.now() - 1000 * 60 * 5;
  return (
    <InlineChannel
      className={cn(className, "user", {
        connected: user.status === "active",
        offline: user.status === "inactive",
        recent: Boolean(active),
      })}
      secured={secured}
      id={channel.id}
      onClick={onClick}
      icon="fa-solid fa-user"
      badge={badge}
    >
      {user.name}
    </InlineChannel>
  );
});

type ChannelProps = {
  channelId: string;
  onClick?: () => void;
  icon?: string;
  badge?: ReadReceiptModel | null;
  className?: ClassNames;
};

export const Channel = observer(({
  channelId: id,
  onClick,
  icon,
  badge,
  className,
}: ChannelProps) => {
  const app = useApp();
  const channel = app.channels.get(id);
  useEffect(() => {
    if (!channel) {
      app.channels.find(id);
    }
  }, [id, channel]);
  let ico = icon;
  if (channel?.isPrivate) ico = "fa-solid fa-lock";
  if (channel?.isDirect) {
    return (
      <DirectChannel
        className={className}
        channel={channel}
        onClick={onClick}
        badge={badge}
      />
    );
  }
  return (
    <InlineChannel
      className={className}
      id={id}
      onClick={onClick}
      icon={ico}
      badge={badge}
    >
      {channel?.name ?? id}
    </InlineChannel>
  );
});

export const NavChannel = Channel;
