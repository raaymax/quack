import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useHovered } from "../contexts/useHovered";
import { Toolbar } from "../atoms/Toolbar";
import { ButtonWithEmoji } from "./ButtonWithEmoji";
import { ButtonWithIcon } from "./ButtonWithIcon";
import { useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { MessageModel } from "../../core/models/message";

export const Container = styled.div`
  position: absolute;
  top: -15px;
  height: 42px;
  right: 10px;
  z-index: 50;
  background-color: ${({ theme }) => theme.Chatbox.Background};
  color: ${({ theme }) => theme.SecondaryButton.Default}
  border: 1px solid #565856;
  box-shadow: 0px 0px 4px 1px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 0px;
  font-size: 0.9em;
  box-sizing: border-box;

  body.mobi8px{
    width: 100%;
    top: -50px;
    right: 0;
    border-radius: 0;
    border-top: 1px solid #565856;
    border-bottom: 1px solid #565856;
    border-left: 0;
    border-right: 0;
    margin: 0;
    padding: 0;
    height: 50px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    i {
      flex: 0 50px;
      line-height: 50px;
      font-size: 25px;

    }
  }
`;

type MessageToolbarProps = {
  navigate: (path: string) => void;
  messageModel: MessageModel;
};

export const MessageToolbar = observer(
  ({ navigate, messageModel }: MessageToolbarProps) => {
    const [view, setView] = useState<string | null>(null);
    const { parentId } = useParams();
    const onDelete = useCallback(() => {
      if (messageModel) messageModel.remove();
    }, [messageModel]);
    const { isMine } = messageModel;
    const [hovered] = useHovered();

    useEffect(() => setView(null), [hovered]);

    if (hovered !== messageModel.id) return null;

    const reaction = (emoji: string) => (
      <ButtonWithEmoji
        key={emoji}
        emoji={emoji}
        onClick={() => messageModel.addReaction(emoji)}
      />
    );
    const deleteButton = () => (
      <ButtonWithIcon
        key="del"
        icon="delete"
        tooltip="Delete message"
        onClick={() => setView("delete")}
      />
    );
    const confirmDelete = () => (
      <ButtonWithIcon
        key="confirm_del"
        tooltip="Confirm deletion"
        icon="check:danger"
        onClick={onDelete}
      />
    );
    const cancelButton = () => (
      <ButtonWithIcon
        key="cancel"
        tooltip="Cancel"
        icon="circle-xmark"
        onClick={() => setView(null)}
      />
    );
    const editButton = () => (
      <ButtonWithIcon
        disabled
        tooltip="Not yet available"
        key="edit"
        icon="edit"
        onClick={() => null}
      />
    );
    const openReactions = () => (
      <ButtonWithIcon
        key="reactions"
        tooltip="Reactions"
        icon="icons"
        onClick={() => setView("reactions")}
      />
    );
    const pinButton = () => (
      <ButtonWithIcon
        key="pin"
        tooltip={["Pin message", "to this channel"]}
        icon="thumbtack"
        onClick={() => messageModel.pin()}
      />
    );
    const unpinButton = () => (
      <ButtonWithIcon
        key="unpin"
        tooltip={["Unpin message", "from this channel"]}
        icon="thumbtack"
        onClick={() => messageModel.unpin()}
      />
    );
    const replyButton = () => (
      <ButtonWithIcon
        key="reply"
        tooltip={["Reply in thread"]}
        icon="reply"
        onClick={() => {
          navigate(`/${messageModel.channelId}/t/${messageModel.id}`);
        }}
      />
    );

    return (
      <Container>
        <Toolbar size={40}>
          {view === "reactions" && [
            ":heart:",
            ":rofl:",
            ":thumbsup:",
            ":thumbsdown:",
            ":tada:",
            ":eyes:",
            ":white_check_mark:",
          ].map(reaction)}
          {view === "delete" && [
            confirmDelete(),
            cancelButton(),
          ]}
          {view === null && [
            openReactions(),
            isMine && editButton(),
            isMine && deleteButton(),
            messageModel.pinned ? unpinButton() : pinButton(),
            !parentId && replyButton(),
          ]}
        </Toolbar>
      </Container>
    );
  },
);
