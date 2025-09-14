import styled from "styled-components";
import { useCallback, useEffect } from "react";
import { HoverProvider } from "../contexts/hover.tsx";
import { isMobile } from "../../utils.ts";

import { Toolbar } from "../atoms/Toolbar.tsx";
import { ButtonWithIcon } from "../molecules/ButtonWithIcon.tsx";
import { useLocation, useNavigate, useParams } from "../AppRouter.tsx";
import { MessageListArgsProvider } from "../contexts/messageListArgs.tsx";
import { MessageList } from "../organisms/MessageListScroller.tsx";
import { SearchBox } from "../atoms/SearchBox.tsx";

import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState.tsx";
import { BaseRenderer } from "./MessageListRenderer.tsx";
import { MessageModel } from "../../core/models/message.ts";
import { SearchModel } from "../../core/models/search.ts";

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
    background-color: ${(props) => props.theme.Chatbox.Message.Hover};
  }
  .mobile-search {
    flex: 1;
  }
`;

export const Header = observer(() => {
  const app = useApp();
  const { channelId } = useParams();
  const onSearch = useCallback(
    (search: string) => {
      console.log("searching", search);
      if (channelId) {
        app.setSearch(channelId, search);
      }
    },
    [channelId],
  );

  const onClose = useCallback(() => {
    if (channelId) {
      app.clearSearch(channelId);
    }
  }, [channelId]);
  return (
    <StyledHeader>
      {isMobile()
        ? (
          <Toolbar className="toolbar" size={28}>
            <SearchBox className="mobile-search" onSearch={onSearch} />
            <ButtonWithIcon
              icon="xmark"
              onClick={onClose}
            />
          </Toolbar>
        )
        : (
          <Toolbar className="toolbar" size={28}>
            <h2>Search results</h2>
            <ButtonWithIcon
              icon="xmark"
              onClick={onClose}
            />
          </Toolbar>
        )}
    </StyledHeader>
  );
});

export const SearchResults = observer(
  ({ model }: { model: SearchModel | null }) => {
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
    useEffect(() => {
      model.init();
    }, [model]);

    // Create a wrapper object that makes SearchModel compatible with MessageList
    const threadModelWrapper = {
      messages: model.messages,
      input: { value: "" }, // Dummy input
      typing: { users: [] }, // Dummy typing
      readReceipts: { users: [] }, // Dummy read receipts
      search: model.text,
      pinned: false,
      init: () => model.init(),
      dispose: () => model.dispose(),
    };

    return (
      <StyledList>
        <div key="bottom" id="scroll-stop" />
        <MessageList
          renderer={BaseRenderer}
          model={threadModelWrapper as any}
          onMessageClicked={(msg: MessageModel) => {
            gotoMessage(msg);
          }}
        />
      </StyledList>
    );
  },
);

export const Search = observer(() => {
  const app = useApp();
  const { channelId } = useParams();
  if (!channelId) return null;
  const searchModel = app.getSearch(channelId);
  if (!searchModel) return null;
  return (
    <MessageListArgsProvider streamId="search">
      <StyledSearch>
        <HoverProvider>
          <Header />
          <SearchResults model={searchModel} />
        </HoverProvider>
      </StyledSearch>
    </MessageListArgsProvider>
  );
});
