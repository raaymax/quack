import styled from 'styled-components';
import { useCallback } from 'react';
import { SizeProvider } from '../contexts/size';
import { cn, ClassNames } from '../../utils';
import { observer } from 'mobx-react-lite';

export const Container = styled.div<{$size?: number}>`
  display: flex;
  flex-direction: row;
  width: 100%;
  .icon, .emoji {
    flex: 0;
  }
  .icon, .emoji, .separator {
    height: ${(props) => props.$size}px;
    width: ${(props) => props.$size}px;
    line-height: ${(props) => props.$size}px;
  }
  .separator {
    flex: 1;
    padding-left: 10px;
    display: inline-block;
  }

  & > h1, & > h2, & > h3, & > h4, & > h5, {
    flex: 1;
    padding: 0px;
    margin: 0;
    line-height: ${(props) => props.$size}px;
    height: ${(props) => props.$size}px;
  }

  button {
    color: inherit;
    .icon {
      color: ${({theme}) => theme.SecondaryButton.Default};
    }
    &:hover {
      background-color: transparent;
      .icon {
        color: ${({theme}) => theme.SecondaryButton.Hover};

      }
    }
  }

`;

interface ToolbarProps {
  className?: ClassNames;
  size?: number;
  children: React.ReactNode;
}

export const Toolbar = observer(({ children, size, className }: ToolbarProps) => {
  const stop = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);
  return (
    <Container className={cn('toolbar', className)} $size={size} onClick={stop}>
      <SizeProvider value={size}>
        {children}
      </SizeProvider>
    </Container>
  );
});
