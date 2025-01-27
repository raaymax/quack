import { useEffect } from 'react';
import styled from 'styled-components';
import { Badge } from '../atoms/Badge';
import { TextWithIcon } from './TextWithIcon';
import { cn, ClassNames } from '../../utils';
import { Tooltip } from '../atoms/Tooltip';
import { User } from '../../types';
import { observer } from 'mobx-react-lite';
import { useApp } from '../contexts/appState';
import type { ChannelModel } from '../../core/models/channel';

const TagContainer = styled.div`
  font-size: 16px;
  border: 1px solid ${(props) => props.theme.PrimaryButton.Background};
  color: ${(props) => props.theme.PrimaryButton.Text};
  line-height: 26px;
  vertical-align: middle;
  padding: 2px 12px;
  border-radius: 8px;
  margin-left: 12px;
`;

const Tag = observer(({ children, tooltip }: { children: React.ReactNode, tooltip: string | string[] }) => (
  <TagContainer><Tooltip text={tooltip}>{children}</Tooltip></TagContainer>
));

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
  badge?: number;
  className?: ClassNames;
  onClick?: () => void;
  icon?: string;
  secured?: boolean;
};

export const InlineChannel = observer(({
  id, children, badge, className, onClick, icon = 'fa-solid fa-hashtag', secured
}: InlineChannelProps) => (
  <Container className={cn('channel', 'inline-channel', className)} data-id={id} onClick={onClick}>
    <TextWithIcon icon={icon}>{children}</TextWithIcon>
    {(badge && badge > 0) ? <Badge>{badge}</Badge> : null}
    {secured ? <Tag tooltip={["Messages in this channel are encrypted", "using your password", "Files encription not yet implemented"]}>E2EE</Tag> : null}
  </Container>
));

type DirectChannelProps = {
  channel: ChannelModel;
  badge?: number;
  onClick?: () => void;
  className?: ClassNames;
};

const DirectChannel = observer(({
  channel, badge, onClick, className,
}: DirectChannelProps) => {
  const user: User | null = channel.otherUser || channel.user;
  const secured = channel.isDirect;
  if (!user) return null; 
  const active = user.lastSeen && new Date(user.lastSeen).getTime() > Date.now() - 1000 * 60 * 5;
  return (
    <InlineChannel
      className={cn(className, 'user', {
        connected: user.status === 'active',
        offline: user.status === 'inactive',
        recent: Boolean(active),
      })}
      secured={secured}
      id={channel.id}
      onClick={onClick}
      icon='fa-solid fa-user'
      badge={badge}>
      {user.name}
    </InlineChannel>
   );
});

type ChannelProps = {
  channelId: string;
  onClick?: () => void;
  icon?: string;
  badge?: number;
  className?: ClassNames;
};

export const Channel = observer(({
  channelId: id, onClick, icon, badge, className,
}: ChannelProps) => {
  const app = useApp();
  const channel = app.channels.get(id)
  useEffect(() => {
    if (!channel) {
      app.channels.find(id);
    }
  }, [id, channel]);
  let ico = icon;
  if (channel?.isPrivate) ico = 'fa-solid fa-lock';
  if (channel?.isDirect) return (<DirectChannel className={className} channel={channel} onClick={onClick} badge={badge} />);
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
