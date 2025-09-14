import styled from "styled-components";
import { useSize } from "../contexts/useSize.ts";
import { ClassNames, cn } from "../../utils.ts";
import { observer } from "mobx-react-lite";

const Container = styled.button`
  font-style: normal;
  cursor: pointer;
  border-radius: 8px;
  display: inline-block;
  background-color: transparent;
  box-sizing: border-box;
  border: none;
  color: ${({ theme }) => theme.Text};

  &:hover {
    background-color: ${({ theme }) => theme.Labels};
  }

  &.disabled .icon {
    cursor: not-allowed;
    color: ${({ theme }) => theme.Labels} !important;
  }

  &.primary {
    border: none;
    background-color: ${({ theme }) => theme.PrimaryButton.Background};

    &:active {
      background-color: ${({ theme }) => theme.buttonActiveBackground};
    }
  }

  &.secondary {
    border: none;
    border: 1px solid ${({ theme }) => theme.SecondaryButton.Default};
    padding: 11px 16px;

    &:hover {
      border: 1px solid ${({ theme }) => theme.SecondaryButton.Hover};
      background-color: transparent;
    }

    &:active {
      background-color: ${({ theme }) => theme.SecondaryButton.Background};
      border: 1px solid ${({ theme }) => theme.SecondaryButton.Default};
    }
  }
`;
interface IconButtonProps {
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: number;
  children?: React.ReactNode;
  className?: ClassNames;
  type?: "primary" | "secondary" | "other";
}

export const BaseButton = observer(({
  onClick,
  size,
  children,
  className,
  type = "other",
  disabled = false,
}: IconButtonProps) => {
  const $size = useSize(size);
  return (
    <Container
      onClick={(e) => !disabled && onClick?.(e)}
      style={{
        minWidth: $size + "px",
        height: $size + "px",
      }}
      className={cn(className, type, { disabled })}
    >
      {children}
    </Container>
  );
});
