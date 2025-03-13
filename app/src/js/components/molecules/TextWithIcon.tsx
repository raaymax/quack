import styled from "styled-components";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";
import { useSize } from "../contexts/useSize";
import { ClassNames, cn } from "../../utils";
import { observer } from "mobx-react-lite";

const Container = styled.div`
  display: inline-block;
 .text {
    padding: 0px 10px; 
  }
`;

type TextWithIconProps = {
  children: React.ReactNode;
  size?: number;
  className?: ClassNames;
  icon: string;
};

export const TextWithIcon = observer(({
  children,
  size,
  className,
  icon,
}: TextWithIconProps) => {
  const $size = useSize(size);
  return (
    <Container className={cn("text-with-icon", className)}>
      <Icon icon={icon} size={$size ? $size / 2.3 : $size} />
      <Text size={$size ? $size / 2.3 : $size}>{children}</Text>
    </Container>
  );
});
