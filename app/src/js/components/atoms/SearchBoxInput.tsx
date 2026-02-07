import styled from "styled-components";
import { ClassNames, cn } from "../../utils";
import { Icon } from "./Icon";

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
const StyledInput = styled.input`
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
  &:focus {
    outline: none;
  }
  ::placeholder {
    color: ${(props) => props.theme.Labels};
    opacity: 1; /* Firefox */
  }
`;

type SearchBoxInputProps = {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: ClassNames;
  placeholder?: string;
};

export const SearchBoxInput = ({
  value,
  onChange,
  onKeyDown,
  className,
  placeholder = "Search here...",
}: SearchBoxInputProps) => (
  <Container className={cn(className)}>
    <StyledInput
      type="text"
      onChange={onChange}
      onKeyDown={onKeyDown}
      value={value}
      placeholder={placeholder}
    />
    <Icon size={16} icon="search" />
  </Container>
);
