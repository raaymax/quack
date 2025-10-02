import styled from "styled-components";
import { ClassNames, cn } from "../../utils";
import { observer } from "mobx-react-lite";

type TextProps = {
  className?: ClassNames;
  size?: number;
  children: React.ReactNode;
};

const StyledText = styled.span`
  margin: auto;
  padding: 3px;
  vertical-align: middle;
  text-align: left;
  display: inline;
`;

export const Text = observer(({ size, className, children }: TextProps) => {
  return (
    <StyledText
      className={cn("text", className)}
      style={size
        ? {
          height: `${size}px`,
          lineHeight: `${size}px`,
          fontSize: `${size}px`,
        }
        : undefined}
    >
      {children}
    </StyledText>
  );
});
