import styled from "styled-components";
import { ProfilePic } from "../atoms/ProfilePic";
import { Icon } from "../atoms/Icon";
import { Tooltip } from "../atoms/Tooltip";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";

const Container = styled.div`
  display: flex;
  flex-direction: row;

  color: ${(props) => props.theme.Text};
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

const Tag = observer((
  { children, tooltip }: {
    children: React.ReactNode;
    tooltip: string | string[];
  },
) => (
  <TagContainer>
    <Tooltip text={tooltip}>{children}</Tooltip>
  </TagContainer>
));

export const DiscussionHeader = observer(
  ({ channelId }: { channelId: string }) => {
    const app = useApp();
    const channel = app.channels.get(channelId);
    if (!channel) return null;
    const user = channel.otherUser || channel.user;
    if (!user) return null;
    const isEncrypted = channel.isDirect;
    return (
      <Container className="discussion-header">
        {channel.isDirect
          ? (
            <div className="avatar">
              <ProfilePic showStatus userId={user.id} type="personal" />
            </div>
          )
          : (
            <div className="channel-icon">
              <Icon
                icon={channel.channelType === "PUBLIC" ? "hash" : "lock"}
                size={24}
              />
            </div>
          )}
        <div className="name">
          {channel.isDirect ? user.name : channel.name}
        </div>
        {isEncrypted
          ? (
            <Tag
              tooltip={[
                "Messages in this channel are encrypted",
                "using your password",
                "Files encription not yet implemented",
              ]}
            >
              E2EE
            </Tag>
          )
          : null}
      </Container>
    );
  },
);
