import styled from "styled-components";
import { formatDateDetailed, formatTime } from "../../utils";
import { ProfilePic } from "../atoms/ProfilePic";
import { observer } from "mobx-react-lite";

const Container = styled.div`
  width: auto;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  border-radius: 4px;

  &:hover {
    background-color: ${(props) => props.theme.SecondaryButton.Hover};
  }

  .thread-profile-pic {
    margin-right: 4px;
    margin-top: 2px;
  }
  .replies {
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    color: ${(props) => props.theme.PrimaryButton.Background};
    vertical-align: middle;
    padding-left: 4px;
  }
  .date {
    padding-left: 4px;
    display: inline-block;
    color: ${(props) => props.theme.Labels};
    font-size: 0.7em;
    font-weight: 300;
    line-height: 20px;
    vertical-align: middle;
  }
`;

type ThreadInfoProps = {
  navigate: (path: string) => void;
  msg: {
    updatedAt: string;
    thread?: {
      childId: string;
      userId: string;
    }[];
    channelId: string;
    id?: string;
  };
};

export const ThreadInfo = observer(({navigate = () => {}, msg}: ThreadInfoProps) => {
  const {
    updatedAt, thread, channelId, id,
  } = msg;
  if(!thread) return null;
  return (
    <Container className="cmp-thread-info" onClick={() => {
      navigate(`/${channelId}/t/${id}`);
    }}>
      {[...new Set(thread.map((t) => t.userId))]
        .map((userId) => (
          <ProfilePic className="thread-profile-pic" type="reply" key={userId} userId={userId} />
        ))}
      <div className='replies'>
        {thread.length} {thread.length > 1 ? 'replies' : 'reply'}
      </div>
      <div className='date'>
        {formatTime(updatedAt)} on {formatDateDetailed(updatedAt)}
      </div>
    </Container>
  );
});
