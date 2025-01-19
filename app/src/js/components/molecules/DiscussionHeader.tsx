import styled from "styled-components";
import { useSelector } from "../../store";
import { ProfilePic } from "../atoms/ProfilePic";
import { Icon } from "../atoms/Icon";
import { Tooltip } from "../atoms/Tooltip";
import { observer } from "mobx-react-lite";

const Container = styled.div`
  display: flex;
  flex-direction: row;

  color: ${props=> props.theme.Text};
  .avatar {
    width: 32px;
    flex: 0 0 32px;
    margin-right: 8px;
    vertical-align: middle;
    line-height: 32px;
  }
  .channel-icon {
    width: 21px;
    flex: 0 0 21px;
    margin-right: 8px;
    * {
      vertical-align: middle;
      line-height: 32px;
    }
  }
  .name {
    flex: 1;
    font-family: Inter, IBMPlexSans;
    font-size: 20px;
    font-style: normal;
    font-weight: 600;
    line-height: 32px;
  }
  .tag {
    flex: 0 24px;
    margin-left: 8px;
  }
`;
const TagContainer = styled.div`
  font-size: 16px;
  border: 1px solid ${(props) => props.theme.PrimaryButton.Background};
  color: ${(props) => props.theme.Text};
  line-height: 32px;
  vertical-align: middle;
  padding: 0px 12px;
  border-radius: 8px;
  margin-left: 12px;
  font-style: normal;
  cursor: help;
  .tooltip-container {
    line-height: 28px;
  }
`;

const Tag = observer(({ children, tooltip }: { children: React.ReactNode, tooltip: string | string[] }) => (
  <TagContainer><Tooltip text={tooltip}>{children}</Tooltip></TagContainer>
));

export const DiscussionHeader = observer(({ channelId }: { channelId: string}) => {
  const channel = useSelector((state) => state.channels[channelId]);
  const me = useSelector((state) => state.me);
  const otherUser = channel?.users.find((id) => id !== me);
  const user = useSelector((state) => state.users[otherUser ?? me ?? '']);
  const isDirect = channel?.channelType === 'DIRECT';
  const isEncrypted = isDirect;
  if (!channel || !me) {
    return null;
  }
  return (
    <Container className="discussion-header">
      {isDirect 
        ? <div className="avatar">
          <ProfilePic showStatus={true} userId={user.id} type="personal" />
        </div>
        : <div className="channel-icon">
          <Icon icon={channel.channelType === 'PUBLIC' ? "hash" : "lock"} size={24}/>
        </div>}
      <div className="name">{isDirect ? user.name :  channel.name}</div>
      {isEncrypted ? <Tag tooltip={["Messages in this channel are encrypted", "using your password", "Files encription not yet implemented"]}>E2EE</Tag> : null}
    </Container>
  );
})
