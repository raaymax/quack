import { useState } from "react";
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";

const Container = styled.div<{ $expanded: boolean }>`
  border-bottom: 1px solid ${(props) => props.theme.Strokes};
  padding: 8px 16px;
  cursor: pointer;
  color: ${(props) => props.theme.Labels};
  font-size: 14px;
  line-height: 20px;
  background-color: ${(props) => props.theme.Input.Background};
  transition: background-color 0.15s ease-in-out;

  &:hover {
    background-color: ${(props) => props.theme.Channel.Background};
  }

  .description-text {
    ${(props) =>
      props.$expanded
        ? `
      white-space: pre-wrap;
      word-break: break-word;
    `
        : `
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `}
  }
`;

type DescriptionBarProps = {
  channelId: string;
};

export const DescriptionBar = observer(({ channelId }: DescriptionBarProps) => {
  const [expanded, setExpanded] = useState(false);
  const app = useApp();
  const channel = app.channels.get(channelId);

  if (!channel?.description) {
    return null;
  }

  return (
    <Container
      $expanded={expanded}
      onClick={() => setExpanded(!expanded)}
      title={expanded ? "Click to collapse" : "Click to expand"}
    >
      <div className="description-text">{channel.description}</div>
    </Container>
  );
});
