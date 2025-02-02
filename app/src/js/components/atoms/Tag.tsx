import styled from 'styled-components';
import { ClassNames, cn } from '../../utils';
import { observer } from 'mobx-react-lite';

const StyledTag = styled.div`
  display: inline-block;
  color: ${({theme}) => theme.Text};
  background-color: ${({theme}) => theme.Chatbox.Message.ReactionButton};
  border-radius: 4px;
  padding: 0px 4px;
  margin-right: 4px;
  font-style: normal;
  cursor: pointer;
  line-height: 24px;
  height: 24px;
`;

type TagProps = {
  onClick: () => void;
  children: React.ReactNode;
  className?: ClassNames;
};

export const Tag = observer(({ className, onClick, children }: TagProps) => (
  <StyledTag className={cn('tag', className)} onClick={onClick}>
    {children}
  </StyledTag>
));
