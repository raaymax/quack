import styled, { useTheme } from 'styled-components';
import { cn , same } from '../../utils';
import { Resizer } from '../atoms/Resizer';
import { useParams , useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Workspaces } from '../organisms/Workspaces';
import { Sidebar } from '../organisms/Sidebar';
import { Conversation } from '../organisms/Conversation';
import { useDispatch, useMessage } from '../../store';
import { Channel } from '../molecules/NavChannel';
import { Toolbar } from '../atoms/Toolbar';
import { ButtonWithIcon } from '../molecules/ButtonWithIcon';
import { useMessageListArgs } from '../contexts/useMessageListArgs';
import { MessageListArgsProvider } from '../contexts/messageListArgs';
import { SearchBox } from '../atoms/SearchBox';
import { CollapsableColumns } from '../atoms/CollapsableColumns';

const WORKSPACES_WIDTH = 80;
const RESIZER_WIDTH = 8;

export const Container = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  color: ${(props) => props.theme.Text};
  --topbar-height: 64px;
    
  .resizer {
    flex: 0 0 ${RESIZER_WIDTH}px;
    &:after {
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      content: '';
      display: block;
      height: var(--topbar-height);
      border-bottom: 1px solid ${(props) => props.theme.Strokes};
    }
  }

  .main-view {
    background-color: ${(props) => props.theme.Chatbox.Background};
    flex: 1 100%;
  }

  .workspaces {
    flex: 0 0 ${WORKSPACES_WIDTH}px;
  }

  .discussion {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
    overflow: hidden;


    .conversation-container {
      flex: 1;
      width: 50%;
      height: 100%;
      display: flex;
      flex-direction: column;
      &:only-child {
        width: 100%;
      }

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

      & > .conversation-with-context-bar {
        flex: 1;
        width: 100%;
        height: calc( 100% - 64px);
        display: flex;
        flex-direction: row;
        .conversation {
          flex: 1;
          width: 100%;
          height: 100%;
        }
      }


      & > .conversation-with-context-bar.has-context-bar {
        .conversation {
          flex: 1 1 50%;
        }
      }
    }

    .context-bar {
      background-color: ${(props) => props.theme.Channel.Background};
      padding: 0px;
      margin: 0px;
      flex: 1 1 50%;
    }

    .side-conversation-container {
      border-left: 1px solid var(--primary_border_color);
    }
  }
`;

export const UpdateArgs = () => {
  const location = useLocation();
  const {channelId } = useParams();
  const [args, setArgs] = useMessageListArgs();
  useEffect(() => {
    const state = location.state || {};
    state.type = state.type ?? 'live';
    if(!same(args, state, ['type', 'selected', 'date'])) {
      setArgs(state);
    }
  }, [location.state, channelId]);

  return null
}


type SideConversationProps = {
  channelId: string;
  parentId?: string;
};

export const SideConversation = ({ channelId, parentId}: SideConversationProps) => {
  const message = useMessage(parentId);
  const navigate = useNavigate();
  return (
    <MessageListArgsProvider streamId="side">
      <div className={cn('side-conversation-container', 'conversation-container')}>
        <div className='header'>

          <Toolbar className="toolbar" size={32}>
              Thread
            <Channel channelId={channelId} />
            <ButtonWithIcon icon='back' onClick={() => {
              navigate(`/${channelId}`, {state: {
                type: 'archive', selected: message?.id, date: message?.createdAt,
              }});
            }} iconSize={24} />
            <ButtonWithIcon icon='xmark' onClick={() => {
              navigate(`/${channelId}`);
            }} iconSize={24} />
          </Toolbar>
        </div>
        <div className='conversation'>
          <Conversation channelId={channelId} parentId={parentId} />
        </div>
      </div>
    </MessageListArgsProvider>
  );
}

type MainConversationProps = {
  channelId: string;
  children?: React.ReactNode;
};
export const MainConversation = ({ channelId, children}: MainConversationProps) => {
  const location = useLocation();
  const [stream] = useMessageListArgs();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <MessageListArgsProvider streamId='main' value={location.state}>
      <UpdateArgs />
      <div className={cn('main-conversation-container', 'conversation-container')}>
        <div className='header'>
          <Toolbar className="toolbar" size={32}>
            <Channel channelId={channelId} />
            <SearchBox />
            {stream.type === 'archive' && (
              <ButtonWithIcon icon='down' onClick = {() => {
                navigate(".", { relative: "path", state: {
                  type: 'live',
                  selected: null,
                  date: null,
                } });
              }} iconSize={24} />
            )}
            <ButtonWithIcon icon="thumbtack" onClick={() => {
              navigate("/"+ channelId + "/pins")
            }}  iconSize={16}/>
            {/*<ButtonWithIcon icon="search" onClick={() => navigate("/"+ channelId + "/search")}  iconSize={24}/>
            <ButtonWithIcon icon="refresh" onClick={() => dispatch(init({}))} iconSize={24} />*/}
          </Toolbar>
        </div>
        <CollapsableColumns className={cn('conversation-with-context-bar', {'has-context-bar': Boolean(children)})} 
          minSize={300}
          columns={[
            <Conversation key='1' className='conversation' channelId={channelId} />,
            children && <div key='2' className='context-bar'>{children}</div>
          ].filter(Boolean) as [React.ReactNode, React.ReactNode?]}
        />
      </div>
    </MessageListArgsProvider>
  );
}

type DiscussionProps = {
  className?: string;
  children?: React.ReactNode;
};
export const Discussion = ({ className, children }: DiscussionProps) => {
  const {channelId='', parentId} = useParams();

  return (
    <CollapsableColumns className={cn('discussion', className)} 
      minSize={400}
      columns={[
        <MainConversation key={1} channelId={channelId}>{children}</MainConversation>,
        parentId && <SideConversation key={2} channelId={channelId} parentId={parentId} />
      ].filter(Boolean) as [React.ReactNode, React.ReactNode?]}
    />
  );
}

export const Desktop = ({children}: {children: React.ReactNode}) => {
  const { parentId } = useParams();
  const [size, setSize] = useState(Number(localStorage.getItem('sidebar-size')) || 356);
  const theme = useTheme();
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme.Navbar.Background);
  }, [theme]);
  const sideSize = useMemo(() => {
    return size + WORKSPACES_WIDTH + RESIZER_WIDTH;
  }, [size]);
  return (
    <Container className={cn({
      'side-stream': Boolean(parentId),
    })}>
      <Workspaces />
      <Sidebar style={{flex: `0 0 ${size}px`, maxWidth: `${size}px`}} />
      <Resizer value={size} onChange={setSize} />
      <div className={cn('main-view')} style={{
        flex: `0 1 calc(100vw - ${sideSize}px)`,
        maxWidth: `calc(100vw - ${sideSize}px)`
      }}>
        {children}
      </div>
    </Container>
  );
};

export default Desktop;
