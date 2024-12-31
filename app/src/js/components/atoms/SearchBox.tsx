import styled from 'styled-components';
import { cn, ClassNames } from '../../utils';
import { Icon } from './Icon';
import { useState, useEffect } from 'react';

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
  width: 100%;
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
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: ClassNames;
  placeholder?: string;
}

export const SearchBox = ({
  placeholder = 'Search here...', className, onSearch, onChange, value: v, defaultValue
}: SearchBoxProps) => {
  const [value, setValue] = useState(defaultValue ?? '');

  useEffect(() => {
    setValue(v ?? '');
  }, [v]);

  return (<Container className={cn(className)}>
    <SearchBoxInput
      type="text"
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
        setValue(e.target.value);
      }}
      onKeyDown={(e) => e.key === 'Enter' && value.trim() && onSearch?.(value)}
      value={value}
      placeholder={placeholder}
    />
    <Icon size={16} icon="search" />
  </Container>
  );
};
