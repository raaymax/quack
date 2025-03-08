import styled, { useTheme } from "styled-components";
import { cn, isMobile } from "../../utils";
import { useSidebar } from "../contexts/useSidebar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { Workspaces } from "../organisms/Workspaces";
import { Sidebar } from "../organisms/Sidebar";
import { Conversation } from "../organisms/Conversation";
import { Channel } from "../molecules/NavChannel";
import { Toolbar } from "../atoms/Toolbar";
import { ButtonWithIcon } from "../molecules/ButtonWithIcon";
import { MessageListArgsProvider } from "../contexts/messageListArgs";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";

const WORKSPACES_WIDTH = 80;

export const Container = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  color: ${(props) => props.theme.Text};
  --topbar-height: 64px;

  .main-view {
    flex: 0 0 100%;
    width: 100%;
    background-color: ${(props) => props.theme.Chatbox.Background};
  }

  .workspaces {
    flex: 0 0 ${WORKSPACES_WIDTH}px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    height: 100%;
    padding: 16px 0;
    background-color: ${(props) => props.theme.Navbar.Background};
    & > *{
      margin: 0 auto;
    }
    .spacer {
      flex: 1;
    }
  }
  .side-menu-header {
    flex: 0 0 64px;
    height: 64px;
    border-bottom: 1px solid ${(props) => props.theme.Strokes};
    padding: 16px 24px;
    font-size: 24px;
  }

  .side-menu {
    flex: 1 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
  

    .slider {
      flex: 1 calc(100% - 50px);
      overflow-y: auto;
    }
    .bottom {
      flex: 0 50px;
    }
    @media (max-width : 710px) {
      width: 100%;
      height: 100vh;

      & .channel {
        height: 40px;
        line-height: 40px;
        vertical-align: middle;
        font-size: 20px;
        & .name {
        height: 40px;
          line-height: 40px;
          vertical-align: middle;
          font-size: 20px;
        }
      }
      & .user{
        height: 40px;
        line-height: 40px;
        vertical-align: middle;
        font-size: 20px;
        & .name {
        height: 40px;
          line-height: 40px;
          vertical-align: middle;
          font-size: 20px;
        }
      }
    }
    &.hidden {
      flex: 0 0px;
      width: 0px;
    }

  }

  .discussion {

    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
    overflow: hidden;

    .conversation-container {
      flex: 1;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;

      & > .header {
        border-bottom: 1px solid ${(props) => props.theme.Strokes};
        height: 64px;
        padding: 16px 16px 15px 16px;

        & > .toolbar {
          gap: 16px;
          height: 32px;
          line-height: 32px;
          .icon {
            line-height: 32px;
            font-size: 32px;

          }
        }

        .channel{
          flex: 1;
          padding-left: 30px;
          vertical-align: middle;
          font-size: 20px;
          font-weight: bold;
        }
        .channel i{
          font-size: 1.3em;
        }
        .channel .name{
          padding-left: 10px;
        }
        .toolbar {
          max-width: 100%;
          flex: 1;
          flex-align: right;
          display:flex;
        }
      }

      & > .conversation {
        flex: 1;
        width: 100%;
        height: calc( 100% - 64px);
        display: flex;
        flex-direction: row;
      }

    }

    .sidebar-closed.side-stream & {
      @media (max-width: 896px) {
        & .main-conversation-container {
          display: none;
          flex: 0 0 0%;
        }
        & .side-conversation-container {
          flex: 1 100%;
        }
      }
    }

    .sidebar-open.side-stream & {
      @media (max-width: 1265px) {
        & .main-conversation-container {
          display: none;
          flex: 0 0 0%;
        }
        & .side-conversation-container {
          flex: 1 100%;
        }
      }
    }
    .context-bar {
      padding: 0px;
      margin: 0px;
      flex: 1 1 50%;
    }

    .main-conversation {
      display: flex;
      flex-direction: row;
      width: 100%;
      height: 100%;
    }

    .side-conversation-container {
      border-left: 1px solid var(--primary_border_color);
    }
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    width: 100vw;
    height: 100vh;
    background-color: ${(props) => props.theme.Navbar.Background};
    display: flex;
    flex-direction: row;
  }
  &.sidebar-open .main-view {
    flex: 0 0 0px;
    width: 0px;
    overflow: hidden;
  }
`;

type SideConversationProps = {
  channelId: string;
  parentId?: string;
};

export const SideConversation = observer(
  ({ channelId, parentId }: SideConversationProps) => {
    const app = useApp();
    const threadModel = app.getThread(channelId, parentId);
    if (!parentId) return null;
    const message = threadModel.messages.get(parentId);
    const navigate = useNavigate();
    const { toggleSidebar } = useSidebar();
    return (
      <MessageListArgsProvider streamId="side">
        <div
          className={cn(
            "side-conversation-container",
            "conversation-container",
          )}
        >
          <div className="header">
            <Toolbar className="toolbar" size={32}>
              <ButtonWithIcon
                icon="bars"
                onClick={toggleSidebar}
                iconSize={24}
              />
              thread
              <Channel channelId={channelId} />
              <ButtonWithIcon
                icon="back"
                onClick={() => {
                  navigate(`/${channelId}`, {
                    state: {
                      type: "archive",
                      selected: message?.id,
                      date: message?.createdAt,
                    },
                  });
                }}
                iconSize={24}
              />
              <ButtonWithIcon
                icon="xmark"
                onClick={() => {
                  navigate(`/${channelId}`);
                }}
                iconSize={24}
              />
            </Toolbar>
          </div>
          <div className="conversation">
            <Conversation channelId={channelId} parentId={parentId} />
          </div>
        </div>
      </MessageListArgsProvider>
    );
  },
);

type MainConversationProps = {
  channelId: string;
  children?: React.ReactNode;
};
export const MainConversation = observer(
  ({ channelId, children }: MainConversationProps) => {
    const app = useApp();
    const location = useLocation();
    const navigate = useNavigate();
    const threadModel = app.getThread(channelId);
    const { toggleSidebar } = useSidebar();

    return (
      <MessageListArgsProvider streamId="main" value={location.state}>
        <div
          className={cn(
            "main-conversation-container",
            "conversation-container",
          )}
        >
          <div className="header">
            <Toolbar className="toolbar" size={32}>
              <ButtonWithIcon
                icon="bars"
                onClick={toggleSidebar}
                iconSize={24}
              />
              <Channel channelId={channelId} />
              {threadModel.messages.mode === "archive" && (
                <ButtonWithIcon
                  icon="down"
                  onClick={() => {
                    navigate(".", {
                      relative: "path",
                      state: {
                        type: "live",
                        selected: null,
                        date: null,
                      },
                    });
                  }}
                  iconSize={24}
                />
              )}
              <ButtonWithIcon
                icon="thumbtack"
                onClick={() => {
                  navigate("/" + channelId + "/pins");
                }}
                iconSize={24}
              />
              <ButtonWithIcon
                icon="search"
                onClick={() => navigate("/" + channelId + "/search")}
                iconSize={24}
              />
              {/*<ButtonWithIcon icon="refresh" onClick={() => dispatch(init({}))} iconSize={24} />*/}
            </Toolbar>
          </div>
          <div className="conversation">
            {(!children || !isMobile()) && (
              <Conversation channelId={channelId} />
            )}
            {children && <div className="context-bar">{children}</div>}
          </div>
        </div>
      </MessageListArgsProvider>
    );
  },
);

type DiscussionProps = {
  className?: string;
  children?: React.ReactNode;
};
export const Discussion = observer(
  ({ className, children }: DiscussionProps) => {
    const { channelId = "", parentId } = useParams();
    return (
      <div className={cn("discussion", className)}>
        {(!isMobile() || !parentId) && (
          <MainConversation channelId={channelId}>{children}</MainConversation>
        )}
        {parentId && (
          <SideConversation channelId={channelId} parentId={parentId} />
        )}
      </div>
    );
  },
);

export const Mobile = observer(
  ({ children }: { children: React.ReactNode }) => {
    const { sidebar } = useSidebar();
    const { parentId } = useParams();
    const theme = useTheme();
    useEffect(() => {
      console.log("change");
      document.querySelector('meta[name="theme-color"]')
        ?.setAttribute(
          "content",
          sidebar ? theme.Navbar.Background : theme.Chatbox.Background,
        );
    }, [sidebar, theme]);
    return (
      <Container
        className={cn({
          "side-stream": Boolean(parentId),
          "sidebar-open": sidebar,
          "sidebar-closed": !sidebar,
        })}
      >
        {sidebar && (
          <div className="overlay">
            <Workspaces />
            <Sidebar />
          </div>
        )}
        <div className={cn("main-view")}>
          {children}
        </div>
      </Container>
    );
  },
);

export default Mobile;
