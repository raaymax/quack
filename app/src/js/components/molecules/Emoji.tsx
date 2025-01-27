import styled from 'styled-components';
import { getUrl } from '../../services/file';
import { Tooltip } from '../atoms/Tooltip';
import { useSize } from '../contexts/useSize';
import { ClassNames, cn } from '../../utils';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useApp } from '../contexts/appState';

const StyledEmoji = styled.span<{$size?: number}>`
  padding: 0;
  margin: 0;
  ${(props) => (props.$size ? `
  font-size: ${props.$size}px;
  line-height: ${props.$size}px;
  ` : '')}
  img{
    ${(props) => (props.$size ? `
    height: ${props.$size}px;
    width: ${props.$size}px;
    ` : '')}
    vertical-align: bottom;
    display: inline-block;
  }
`;

interface EmojiBaseProps {
  className?: ClassNames;
  shortname: string;
  emoji: {
    unicode?: string;
    fileId?: string;
    empty?: boolean;
  },
  size?: number;
}

export const EmojiBase = observer(({ className, shortname, emoji, size}: EmojiBaseProps) => {
  const $size = useSize(size);
  const [error, setError] = useState(false);
  const onError = () => {
    setError(true);
  }
  if (!emoji || emoji.empty) return <span className='emoji'>{shortname}</span>;

  return (
    <StyledEmoji className={cn(className, "emoji")} $size={$size} data-emoji={shortname}>
      {emoji.unicode || error
        ? String.fromCodePoint(parseInt(emoji.unicode || '26a0', 16))
        : <img src={getUrl(emoji.fileId ?? '')} onError={onError} alt={shortname} />}
    </StyledEmoji>
  );
});

interface EmojiProps {
  className?: ClassNames;
  shortname: string;
  size?: number;
}

export const Emoji = observer(({ className, shortname, size}: EmojiProps) => {
  const emoji = useApp().emojis.get(shortname);
  return (
    <Tooltip className={className} text={shortname}>
      <EmojiBase className={className} shortname={shortname} emoji={emoji} size={size} />
    </Tooltip>
  );
});
