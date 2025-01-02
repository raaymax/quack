import { useEffect } from 'react';
import styled from 'styled-components';
import { useDispatch, useMethods, useSelector } from '../../store';
import { Badge } from '../atoms/Badge';
import { TextWithIcon } from './TextWithIcon';
import { cn, ClassNames } from '../../utils';
import { Tooltip } from '../atoms/Tooltip';
import { User } from '../../types';

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

const Tag = ({ children, tooltip }: { children: React.ReactNode, tooltip: string | string[] }) => (
  <TagContainer><Tooltip text={tooltip}>{children}</Tooltip></TagContainer>
);

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

export const InlineChannel = ({
  id, children, badge, className, onClick, icon = 'fa-solid fa-hashtag', secured
}: InlineChannelProps) => (
  <Container className={cn('channel', 'inline-channel', className)} data-id={id} onClick={onClick}>
    <TextWithIcon icon={icon}>{children}</TextWithIcon>
    {(badge && badge > 0) ? <Badge>{badge}</Badge> : null}
    {secured ? <Tag tooltip={["Messages in this channel are encrypted", "using your password", "Files encription not yet implemented"]}>E2EE</Tag> : null}
  </Container>
);

type DirectChannelProps = {
  channel: {
    id: string;
    name: string;
    channelType: 'DIRECT' | 'PRIVATE' | 'PUBLIC';
    users: string[];
  };
  badge?: number;
  onClick?: () => void;
  className?: ClassNames;
};

const DirectChannel = ({
  channel, badge, onClick, className,
}: DirectChannelProps) => {
  const me = useSelector((state) => state.me);
  let other = channel.users.find((u) => u !== me);
  if (!other) [other] = channel.users;
  const user: User = useSelector((state) => state.users[other ?? '']);
  const secured = channel.channelType === 'DIRECT';
  if (!user) {
    return (
      <InlineChannel
        className={className}
        id={channel.id}
        onClick={onClick}
        badge={badge}
        secured={secured}>
        {channel.name}
      </InlineChannel>
    );
  }
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
};

type ChannelProps = {
  channelId: string;
  onClick?: () => void;
  icon?: string;
  badge?: number;
  className?: ClassNames;
};

export const Channel = ({
  channelId: id, onClick, icon, badge, className,
}: ChannelProps) => {
  const dispatch = useDispatch();
  const methods = useMethods();
  const channel = useSelector((state) => state.channels[id]);
  useEffect(() => {
    if (!channel) {
      dispatch(methods.channels.find(id));
    }
  }, [id, channel, methods, dispatch]);
  const { name, private: priv, direct } = channel || {};
  let ico = icon;
  if (priv) ico = 'fa-solid fa-lock';
  if (direct) return (<DirectChannel className={className} channel={channel || {}} onClick={onClick} badge={badge} />);
  return (
    <InlineChannel
      className={className}
      id={id}
      onClick={onClick}
      icon={ico}
      badge={badge}
    >
      {name}
    </InlineChannel>
  );
};

export const NavChannel = Channel;
