import { Button } from "./Button";
import { Emoji } from "./Emoji";
import { useSize } from "../contexts/useSize";
import { observer } from "mobx-react-lite";

interface ButtonWithEmojiProps {
  onClick: () => void;
  emoji: string;
  size?: number;
  children?: React.ReactNode;
}

export const ButtonWithEmoji = observer(({
  onClick,
  size,
  emoji,
  children,
}: ButtonWithEmojiProps) => {
  const $size = useSize(size);
  return (
    <Button size={$size} onClick={onClick}>
      <Emoji shortname={emoji} size={$size ? $size / 2 : $size} />
      {children}
    </Button>
  );
});
