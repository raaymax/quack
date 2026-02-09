import styled from "styled-components";
import { ProfilePic } from "../atoms/ProfilePic";
import { observer } from "mobx-react-lite";
import { ReadReceiptModel } from "../../core/models/readReceipt";
import { useApp } from "../contexts/appState";
import { client } from "../../core";

const StyledReadReceipt = styled.div`
  position: relative;
  height: 0;
  width: 100%;

  & > div {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    .avatar {
      flex: 0 0 16px;
    }
  }
`;

type ReadReceiptProps = {
  model?: ReadReceiptModel[];
};

export const ReadReceipt = observer(({ model }: ReadReceiptProps) => {
  const app = useApp();

  if (!model) return null;
  if (!model.length) return null;

  return (
    <StyledReadReceipt>
      {model.length && (
        <div>
          {model.map((p) => {
            const user = app.users.get(p.userId);
            const avatarUrl = user?.avatarFileId
              ? client.api.getUrl(user.avatarFileId)
              : undefined;
            return (
              <ProfilePic
                key={p.userId}
                type="tiny"
                avatarUrl={avatarUrl}
              />
            );
          })}
        </div>
      )}
    </StyledReadReceipt>
  );
});
