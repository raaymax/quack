import styled from "styled-components";
import { ButtonWithIcon } from "./ButtonWithIcon";
import { Text } from "../atoms/Text";
import { useSize } from "../contexts/useSize";
import { ClassNames } from "../../utils";
import { Badge } from "../atoms/Badge";
import { observer } from "mobx-react-lite";

const StyledButtonWithIcon = styled(ButtonWithIcon)`
  text-align: left;
  width: 100%;
  padding-left: 20px;
  cursor: pointer;

  .text {
    padding-left: 5px;
  }
  &:hover {
    font-weight: bold;
    background-color: ${(props) => props.theme.Channel.Hover};
    color: ${(props) => props.theme.Channels.HoverText};
  }
   
`;

type NavButtonProps = {
  size?: number;
  badge?: number;
  icon?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: ClassNames;
  children: React.ReactNode;
};

export const NavButton = observer(({
  className,
  size,
  icon,
  badge,
  onClick,
  children,
}: NavButtonProps) => {
  const $size = useSize(size) ?? 50;
  return (
    <StyledButtonWithIcon
      className={className}
      icon={icon}
      size={$size}
      onClick={onClick}
    >
      <Text size={$size / 2.5}>{children}</Text>
      {(badge && badge > 0) ? <Badge>{badge}</Badge> : null}
    </StyledButtonWithIcon>
  );
});
