import styled from 'styled-components';
import { cn, ClassNames } from '../../utils';
import { Icon } from './Icon';

const Container = styled.div`
  position: relative;
  .icon {
    position: absolute;
    left: 9px;
    top: 50%;
    transform: translateY(-50%);
    color: ${(props) => props.theme.Labels};
  }
`;
const SearchBoxInput = styled.input`
  display: block;
  flex: 0 0 30px;
  height: 32px;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 0 15px;
  background-color: ${(props) => props.theme.Input.Background};
  border: 0;
  color: ${(props) => props.theme.Text};
  padding-left: 32px;
  &:focus{
    outline: none;
  }
  ::placeholder {
    color: ${(props) => props.theme.Labels};
    opacity: 1; /* Firefox */
  }
`;

type SearchBoxProps = {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  value?: string;
  defaultValue?: string;
  className?: ClassNames;
  placeholder?: string;
}

export const SearchBox = ({
  onChange, onKeyDown, placeholder = 'Search here...', defaultValue, value, className,
}: SearchBoxProps) => (
  <Container> 
    <SearchBoxInput
      type="text"
      onChange={onChange}
      onKeyDown={onKeyDown}
      className={cn(className)}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
    />
    <Icon size={16} icon="search" />
  </Container>
);
