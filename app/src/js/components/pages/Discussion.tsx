import styled from 'styled-components';
import { Conversation } from '../organisms/Conversation';
import { useDispatch, useMessage } from '../../store';
import { Channel } from '../molecules/NavChannel';
import { init } from '../../services/init';
import { Toolbar } from '../atoms/Toolbar';
import { ButtonWithIcon } from '../molecules/ButtonWithIcon';
import { useLocation, useNavigate, useParams} from 'react-router-dom';
import { useSidebar } from '../contexts/useSidebar';
import { ClassNames, cn, isMobile, same } from '../../utils';
import { useMessageListArgs } from '../contexts/useMessageListArgs';
import { MessageListArgsProvider } from '../contexts/messageListArgs';
import { useEffect } from 'react';
import { SearchBox } from '../atoms/SearchBox';

const StyledHeader = styled.div`
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

  & .channel{
    flex: 1;
    padding-left: 30px;
    vertical-align: middle;
    font-size: 20px;
    font-weight: bold;
  }
  & .channel i{
    font-size: 1.3em;
  }
  & .channel .name{
    padding-left: 10px;
  }
  & .toolbar {
    max-width: 100%;
    flex: 1;
    flex-align: right;
    display:flex;
  }
`;


type HeaderProps = {
  onClick?: () => void;
  channelId: string;
  parentId?: string;
};

const Header = ({ channelId, onClick }: HeaderProps) => {
  const [stream] = useMessageListArgs();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();

  return (
    <StyledHeader>
      <Toolbar className="toolbar" size={32}>
        {isMobile() && <ButtonWithIcon icon="bars" onClick={toggleSidebar} iconSize={24} />}
        <Channel onClick={onClick} channelId={channelId} />
        { !isMobile() && <SearchBox /> }
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
        }}  iconSize={24}/>
        <ButtonWithIcon icon="search" onClick={() => navigate("/"+ channelId + "/search")}  iconSize={24}/>
        <ButtonWithIcon icon="refresh" onClick={() => dispatch(init({}))} iconSize={24} />
      </Toolbar>
    </StyledHeader>
  );
};

type SideHeaderProps = {
  onClick?: () => void;
  channelId: string;
  parentId?: string;
};

export const SideHeader = ({ channelId, parentId, onClick }: SideHeaderProps) => {
  const message = useMessage(parentId);
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();

  return (
    <StyledHeader>

      <Toolbar className="toolbar" size={32}>
        <ButtonWithIcon icon="bars" onClick={toggleSidebar} iconSize={24} />
        <Channel onClick={onClick} channelId={channelId} />
        <ButtonWithIcon icon='back' onClick={() => {
          navigate(`/${channelId}`, {state: {
            type: 'archive', selected: message?.id, date: message?.createdAt,
          }});
        }} iconSize={24} />
        <ButtonWithIcon icon='xmark' onClick={() => {
          navigate(`/${channelId}`);
        }} iconSize={24} />
      </Toolbar>
    </StyledHeader>
  );
};

const Container = styled.div`
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

type MainConversationProps = {
  className?: ClassNames;
  onClick?: () => void;
  channelId: string;
  parentId?: string;
  children?: React.ReactNode;
};

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

export const MainConversationContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;

`;

export const MainConversation = ({ channelId, parentId, className, children, onClick }: MainConversationProps) => {
  const location = useLocation();

  return (
    <MessageListArgsProvider streamId='main' value={location.state}>
      <UpdateArgs />
      <Container className={cn('main-conversation', className)}>
        <Header channelId={channelId} parentId={parentId} onClick={onClick} />
        <MainConversationContainer>
          <Conversation channelId={channelId} parentId={parentId} />
          {children && <ContextBar>{children}</ContextBar>}
        </MainConversationContainer>
      </Container>
    </MessageListArgsProvider>
  );
}




const SideContainer = styled.div`
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--primary_border_color);
`;

type SideConversationProps = {
  className?: ClassNames
  channelId: string;
  parentId?: string;
};

export const SideConversation = ({ channelId, parentId, className }: SideConversationProps) => {
  return (
    <MessageListArgsProvider streamId="side">
      <SideContainer className={cn('side-conversation', className)}>
        <SideHeader channelId={channelId} parentId={parentId} />
        <Conversation channelId={channelId} parentId={parentId} />
      </SideContainer>
    </MessageListArgsProvider>
  );
}

const ContextBarContainer = styled.div`
  background-color: ${(props) => props.theme.Channel.Background};
  padding: 0px;
  margin: 0px;
  flex: 1 1 50%;
`;

type ContextBarProps = {
  className?: ClassNames;
  children?: React.ReactNode;
};

export const ContextBar = ({ className, children }: ContextBarProps) => {
  return (
    <ContextBarContainer className={cn(className)}>
      {children}
    </ContextBarContainer>
  );
}

const DiscussionContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;

  .sidebar-closed.side-stream & {
    @media (max-width: 896px) {
      & .main-conversation {
        display: none;
        flex: 0 0 0%;
      }
      & .side-conversation {
        flex: 1 100%;
      }
    }
  }

  .sidebar-open.side-stream & {
    @media (max-width: 1265px) {
      & .main-conversation {
        display: none;
        flex: 0 0 0%;
      }
      & .side-conversation {
        flex: 1 100%;
      }
    }
  }
`;

type DiscussionProps = {
  className?: string;
  children?: React.ReactNode;
};

export const Discussion = ({ className, children }: DiscussionProps) => {
  const {channelId='', parentId} = useParams();
  return (
    <DiscussionContainer className={className}>
      {(!isMobile() || !parentId) && <MainConversation channelId={channelId}>{children}</MainConversation>}
      {parentId && <SideConversation channelId={channelId} parentId={parentId} />}
    </DiscussionContainer>
  );
}
