import { useCallback } from "react";
import { useMessageData } from "../contexts/useMessageData";
import { client } from "../../core";
import { useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";


type ActionButtonProps = {
  children: React.ReactNode;
  action: string;
  style: any;
  payload: any;
};

export const ActionButton = observer(({children, action, payload}: ActionButtonProps)=> {
  const {channelId, parentId} = useParams();
  const m = useMessageData();

  const onClick = useCallback(() => {
    if(!channelId) return;
    client.api.postInteraction({
      channelId: channelId,
      parentId: parentId,
      clientId: m.clientId,
      appId: m.appId,
      action,
      payload
    })
  }, [action, payload, channelId, parentId, m]);
  return (
    <button onClick={onClick}>{children}</button>
  );
})
