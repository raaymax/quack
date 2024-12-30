import styled from 'styled-components';
import { useCallback, useEffect, useState } from 'react';
import { HoverProvider } from '../contexts/hover';
import {
  useSelector, useMethods, useDispatch,
  methods,
} from '../../store';
import { formatTime, formatDate } from '../../utils';

import { Message } from '../organisms/Message';
import { Toolbar } from '../atoms/Toolbar';
import { ButtonWithIcon } from '../molecules/ButtonWithIcon';
import { Message as MessageType } from '../../types';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MessageListArgsProvider } from '../contexts/messageListArgs';

const StyledHeader = styled.div`
  display: flex;
  flex-direction: row;
  padding: 16px 16px 16px 16px;
`;

const SearchSeparator = styled.div`
  line-height: 30px;
  height: auto;
  display: block;
  flex: 0;
  position: relative;
  margin-top: 10px;
  margin-bottom: 10px;
  padding-left: 30px;
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
      background-color: var(--primary_active_mask);
  }
`;

export const Header = () => {
  const navigate = useNavigate();

  return (
    <StyledHeader>
      <Toolbar className="toolbar" size={28}>
        <h2>
        Search results
        </h2>
        <ButtonWithIcon icon="xmark" onClick={() => navigate('..', {relative: 'path'})} />
      </Toolbar>
    </StyledHeader>
  );
};

export function SearchResults() {
  const location = useLocation();
  const { channelId } = useParams()!;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const results = useSelector((state) => state.search.results);
  const gotoMessage = useCallback((msg: MessageType) => {
    navigate(`/${msg.channelId}`, {
      state: {
        type: 'archive',
        channelId: msg.channelId,
        parentId: msg.parentId,
        selected: msg.id,
        date: msg.createdAt,
      }
    });
  }, [navigate]);
  useEffect(() => {
    if (!channelId || !location.state?.search) return;
    const value = location.state?.search;
    dispatch(methods.search.find({ channelId, text: value }));
  }, [channelId, location.state?.search, dispatch]);


  return (
    <StyledList>
      <div key='bottom' id='scroll-stop' />
      {results.map((result) => (
        <div key={`search:${result.searchedAt}`}>
          <SearchSeparator >
            <div>{formatTime(result.searchedAt)} - {formatDate(result.searchedAt)}</div>
            <div>Search results for keyword &quot;{result.text}&quot;:</div>
          </SearchSeparator>
          
          {result.data.map((msg: MessageType) => (
            <Message
              onClick={() => gotoMessage(msg)}
              className={msg.priv ? ['private'] : []}
              data-id={msg.id}
              client-id={msg.clientId}
              key={`search:${result.text}:${msg.id || msg.clientId}`}
              sameUser={false}
              data={msg}
            />
          )).reverse()}
        </div>
      ))}
    </StyledList>
  );
}

export const Search = () => {
  const location = useLocation();
  console.log('state', location.state);
  if(location.state?.search === undefined) return null;

  return (
    <MessageListArgsProvider streamId="search">
      <StyledSearch>
        <HoverProvider>
          <Header />
          <SearchResults />
        </HoverProvider>
      </StyledSearch>
    </MessageListArgsProvider>
  );
}
