import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";

const Link = styled.span`
  color: ${(props) => props.theme.linkColor};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

type ThreadLinkProps = {
  channelId: string;
  parentId: string;
  text: string;
};

export const ThreadLink = observer(
  ({ channelId, parentId, text }: ThreadLinkProps) => {
    const navigate = useNavigate();
    return (
      <Link onClick={() => navigate(`/${channelId}/t/${parentId}`)}>
        {text || "Thread"}
      </Link>
    );
  },
);
