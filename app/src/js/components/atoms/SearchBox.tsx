import styled from 'styled-components';
import { cn, ClassNames } from '../../utils';
import { Icon } from './Icon';
import { useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';

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
  onSearch?: (value: string) => void;
  defaultValue?: string;
  className?: ClassNames;
  placeholder?: string;
}

export const SearchBox = ({
  placeholder = 'Search here...', className, onSearch, defaultValue
}: SearchBoxProps) => {
  const [value, setValue] = useState(defaultValue ?? '');

  return (<Container>
    <SearchBoxInput
      type="text"
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && value.trim() && onSearch?.(value)}
      className={cn(className)}
      value={value}
      placeholder={placeholder}
    />
    <Icon size={16} icon="search" />
  </Container>
  );
};
