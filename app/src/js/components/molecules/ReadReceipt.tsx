import styled from 'styled-components';
import { ProfilePic } from '../atoms/ProfilePic';
import { observer } from 'mobx-react-lite';

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
  data?: {
    userId: string;
    user: {
      avatarUrl: string;
      name: string;
    }
  }[];
};

export const ReadReceipt = observer(({ data }: ReadReceiptProps) => {
  if (!data) return null;

  return (
    <StyledReadReceipt>
      {data.length && <div>
        {
          data
            .map((p) => (
              <ProfilePic userId={p.userId} key={p.userId} type='tiny' />
            ))
        }
      </div>}
    </StyledReadReceipt>
  );
});
