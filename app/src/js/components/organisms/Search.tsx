import styled from "styled-components";
import { useCallback } from "react";
import { HoverProvider } from "../contexts/hover";
import { isMobile } from "../../utils";

import { Toolbar } from "../atoms/Toolbar";
import { ButtonWithIcon } from "../molecules/ButtonWithIcon";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MessageListArgsProvider } from "../contexts/messageListArgs";
import { MessageList } from '../organisms/MessageListScroller';
import { SearchBox } from "../atoms/SearchBox";

import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";
import { BaseRenderer } from "./MessageListRenderer";
import { MessageModel } from "../../core/models/message";
import { MessagesModel } from "../../core/models/messages";

const StyledHeader = styled.div`
  display: flex;
  flex-direction: row;
  padding: 16px 16px 16px 16px;
`;

const StyledList = styled.div`
  display: flex;
  flex-direction: column-reverse;
  position: relative;
  overflow-y: scroll;
  overflow-x: hidden;
  flex: 1 100%;
  overscroll-behavior: contain;
`;

const StyledSearch = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;

  .message-list-scroll {
    padding: 0px 16px 16px 16px;
    padding-bottom: 50px;
  }
  .message {
    background-color: ${(props) => props.theme.Chatbox.Background};
    border-radius: 8px;
    margin: 8px 0px;
  }
  & .message:hover {
    background-color: ${(props) => props.theme.Chatbox.Message.Hover}
  }
  .mobile-search {
    flex: 1;
  }
`;

export const Header = observer(() => {
  const navigate = useNavigate();
  const { channelId } = useParams()!;
  const onSearch = useCallback(
    (search: string) => {
      console.log("searching", search);
      navigate("/" + channelId + "/search", { state: { search } });
    },
    [channelId, navigate],
  );

  return (
    <StyledHeader>
      {isMobile() ? (
        <Toolbar className="toolbar" size={28}>
          <SearchBox className="mobile-search" onSearch={onSearch} />
          <ButtonWithIcon
            icon="xmark"
            onClick={() => navigate("..", { relative: "path" })}
          />
        </Toolbar>
      ) : (
        <Toolbar className="toolbar" size={28}>
          <h2>Search results</h2>
          <ButtonWithIcon
            icon="xmark"
            onClick={() => navigate("..", { relative: "path" })}
          />
        </Toolbar>
      )}
    </StyledHeader>
  );
});

export const SearchResults = observer(({model}: {model: MessagesModel | null}) =>{
  const navigate = useNavigate();
  const gotoMessage = useCallback(
    (msg: MessageModel) => {
      navigate(`/${msg.channelId}`, {
        state: {
          type: "archive",
          channelId: msg.channelId,
          parentId: msg.parentId,
          selected: msg.id,
          date: msg.createdAt,
        },
      });
    },
    [navigate],
  );
  if (!model) return null;

  return (
    <StyledList>
      <div key="bottom" id="scroll-stop" />
        <MessageList
          renderer={BaseRenderer}
          model={model}
          onMessageClicked={(msg: MessageModel) => {
            gotoMessage(msg);
          }}
        />
    </StyledList>
  );
})

export const Search = observer(() => {
  const app = useApp();
  const location = useLocation();
  const { channelId } = useParams()!;
  const messagesModel = app.getSearch(channelId ?? '', location.state?.search);
  if (!messagesModel) return null;
  return (
    <MessageListArgsProvider streamId="search">
      <StyledSearch>
        <HoverProvider>
          <Header />
          <SearchResults model={messagesModel} />
        </HoverProvider>
      </StyledSearch>
    </MessageListArgsProvider>
  );
});
