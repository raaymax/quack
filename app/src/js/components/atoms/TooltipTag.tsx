import styled from "styled-components";
import { Tooltip } from "./Tooltip";
import { observer } from "mobx-react-lite";

type TooltipTagVariant = "default" | "header";

const TagContainer = styled.div<{ $variant: TooltipTagVariant }>`
  font-size: 16px;
  border: 1px solid ${(props) => props.theme.PrimaryButton.Background};
  color: ${(props) =>
    props.$variant === "header"
      ? props.theme.Text
      : props.theme.PrimaryButton.Text};
  line-height: ${(props) => (props.$variant === "header" ? "32px" : "26px")};
  vertical-align: middle;
  padding: ${(props) => (props.$variant === "header" ? "0px 12px" : "2px 12px")};
  border-radius: 8px;
  margin-left: 12px;
  font-style: normal;
  cursor: ${(props) => (props.$variant === "header" ? "help" : "default")};
  .tooltip-container {
    line-height: 28px;
  }
`;

type TooltipTagProps = {
  children: React.ReactNode;
  tooltip: string | string[];
  variant?: TooltipTagVariant;
};

export const TooltipTag = observer(
  ({ children, tooltip, variant = "default" }: TooltipTagProps) => (
    <TagContainer $variant={variant}>
      <Tooltip text={tooltip}>{children}</Tooltip>
    </TagContainer>
  ),
);
