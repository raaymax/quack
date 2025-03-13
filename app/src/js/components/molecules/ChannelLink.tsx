import { useEffect } from "react";
import styled from "styled-components";
import { Icon } from "../atoms/Icon";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";

const StyledChannelLink = styled.a`
  span {
    padding-left: 1px;
  }
`;

type ChannelInlineProps = {
  channelId: string;
};

export const ChannelLink = observer(({ channelId: id }: ChannelInlineProps) => {
  const app = useApp();
  const channel = app.channels.get(id);
  useEffect(() => {
    if (!channel) {
      app.channels.find(id);
    }
  }, [id, channel]);
  return (
    <StyledChannelLink
      className="channel"
      data-id={id}
      href={`#${channel?.id || id}`}
    >
      {channel?.isPrivate ? <Icon icon="lock" /> : <Icon icon="hash" />}
      <span className="name">{channel?.name || channel?.id || id}</span>
    </StyledChannelLink>
  );
});
