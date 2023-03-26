import {h } from 'preact';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

export const EmojiCategory= ({ children}) => {
  return (
    <Container>
      {children}
    </Container>
  );
}