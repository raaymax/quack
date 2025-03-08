import styled from "styled-components";
import { formatDateDetailed, formatTime, isToday } from "../../utils";
import { observer } from "mobx-react-lite";
import type { UserModel } from "../../core/models/user";

const Container = styled.div`
  .author {
    color: ${(props) => props.theme.Text};
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px;
    padding-right: 4px;
  }
  .time {
    color: ${(props) => props.theme.Labels};
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px; /* 166.667% */

  }
`;

type MessageHeaderProps = {
  user: UserModel | null;
  createdAt: string;
};

export const MessageHeader = observer(
  ({ user, createdAt }: MessageHeaderProps) => {
    return (
      <Container className="header">
        <span className="author">{user?.name || "Unknown"}</span>
        <span className="spacy time">{formatTime(createdAt)}</span>
        {!isToday(createdAt) && (
          <span className="spacy time">{formatDateDetailed(createdAt)}</span>
        )}
      </Container>
    );
  },
);
