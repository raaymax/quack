import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";
import { MessageModel } from "../../core/models/message";

export const MessageInfo = observer(
  ({ messageModel }: { messageModel: MessageModel }) => {
    const { clientId, info } = messageModel;
    const app = useApp();

    const onAction = useCallback(() => {
      if (info?.action === "resend") {
        app
          .getThread(messageModel.channelId, messageModel.parentId)
          .resendMessage(messageModel);
      }
    }, [clientId, info]);

    if (!info) return null;
    return (
      <div
        onClick={onAction}
        className={["info", info.type, ...(info.action ? ["action"] : [])]
          .join(" ")}
      >
        {info.msg}
      </div>
    );
  },
);
