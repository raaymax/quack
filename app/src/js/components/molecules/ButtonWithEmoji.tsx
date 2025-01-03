import { Button } from '../atoms/Button';
import { Emoji } from './Emoji';
import { useSize } from '../contexts/useSize';

interface ButtonWithEmojiProps {
  onClick: () => void;
  emoji: string;
  size?: number;
  children?: React.ReactNode;
}

export const ButtonWithEmoji = ({
  onClick, size, emoji, children,
}: ButtonWithEmojiProps) => {
  const $size = useSize(size);
  return (
    <Button size={$size} onClick={onClick}>
      <Emoji shortname={emoji} size={$size ? $size / 2 : $size} />
      {children}
    </Button>
  );
};
