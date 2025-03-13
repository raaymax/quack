import styled from "styled-components";
import { ProfilePic } from "../atoms/ProfilePic";
import { observer } from "mobx-react-lite";
import { ReadReceiptModel } from "../../core/models/readReceipt";

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
  if (!model) return null;
  if (!model.length) return null;

  return (
    <StyledReadReceipt>
      {model.length && (
        <div>
          {model
            .map((p) => (
              <ProfilePic userId={p.userId} key={p.userId} type="tiny" />
            ))}
        </div>
      )}
    </StyledReadReceipt>
  );
});
