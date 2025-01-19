import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSelector, useEmojiFuse } from '../../store';
import { SearchBox } from '../atoms/SearchBox';
import { EmojiDescriptor, DefinedEmoji } from '../../types';
import { Icon } from '../atoms/Icon';
import { ClassNames, cn } from '../../utils';
import { Emoji } from '../molecules/Emoji';
import { Button } from '../atoms/Button';
import { observer } from 'mobx-react-lite';

export const Label = styled.div`
  width: 100%;
  color: ${(props) => props.theme.SecondaryButton.Default};
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px; /* 166.667% */
  padding: 0 4px;
`;

export const EmojiSearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  height: 400px;
  padding: 0;
  border-radius: 8px;
  background-color: ${(props) => props.theme.Chatbox.Background};
  box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.20);

  user-select: none;
  * {
    user-select: none;
  }

  .emoji-search {
    flex: 0 0 56px;
    padding: 16px 8px 0 8px;

    .emoji-search-box {
      height: 40px;
      width: 100%;
    }

  }

  .emoji-scroll {
    flex: 1 1 auto;
    overflow-y: scroll;
    scrollbar-width: none;
    overflow-x: hidden;
    &::-webkit-scrollbar {
      display: none;
    }

  }

  .add-emoji {
    display: flex;
    flex-direction: row;
    border-top: 1px solid ${(props) => props.theme.Strokes};
    flex: 0 0 32px;
    padding: 8px 12px;
  }
`;


const EmojiCategory = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px;
`;

const EmojiBlock = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
`;

const EmojiContainer = styled.div`
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  font-size: 20px;
  align-content: center;
  vertical-align: middle;
  text-align: center;
  line-height: 30px;
  cursor: pointer;
  user-select: none;
  img {
    width: 28px;
    height: 28px;
  }
  body.mobile & {
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    font-size: 30px;
    img {
      width: 38px;
      height: 38px;
    }
  }
  &:hover {
    border-radius: 5px;
    background-color: rgba(249,249,249,0.05);
  }
`;


const CATEGORIES: Record<string, string> = {
  p: 'People',
  c: 'Custom',
  n: 'Nature',
  d: 'Food',
  a: 'Activity',
  t: 'Travel',
  o: 'Objects',
  s: 'Symbols',
  k: 'Flags',
  f: 'Font',
  x: 'Other',
};

type EmojiSearchProps = {
  onSelect: (e: EmojiDescriptor) => void;
  className?: ClassNames;
}

export const EmojiSearch = observer(({ className, onSelect }: EmojiSearchProps) => {
  const [name, setName] = useState('');
  const [results, setResults] = useState<Record<string, DefinedEmoji[]>>({});
  const emojis = useSelector((state) => state.emojis.data) as DefinedEmoji[];
  const fuse = useEmojiFuse();

  useEffect(() => {
    let all: DefinedEmoji[] = (emojis || []).filter((e) => !e.empty);
    if (name && fuse) {
      const ret = fuse.search(name, { limit: 100 });
      all = ret.map((r) => r.item).filter((e) => !e.empty) as DefinedEmoji[];
    }

    setResults(
      (all || [])
        .reduce<Record<string, DefinedEmoji[]>>((acc, emoji) => {
          const category = emoji.category || 'x';
          acc[category] = acc[category] || [];
          acc[category].push(emoji);
          return acc;
        }, {}),
    );
  }, [name, fuse, emojis]);

  return (
    <EmojiSearchContainer className={cn('cmp-emoji-search', className)}>
      <div className="emoji-search">
        <SearchBox className="emoji-search-box" onChange={(e) => setName(e.target.value)} value={name} />
      </div>
      <div className="emoji-scroll">
        <div>
          {Object.keys(CATEGORIES).filter((c: string) => results[c]).map((category: string) => (
            <EmojiCategory key={category}>
              <Label>{CATEGORIES[category]}</Label>
              <EmojiBlock>
                {(results[category] || []).map((result) => (
                  <EmojiContainer key={result.shortname} onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelect(result);
                  }}>
                    <Emoji shortname={result.shortname} size={24} />
                  </EmojiContainer>
                ))}
              </EmojiBlock>
            </EmojiCategory>
          ))}
        </div>
      </div>
      <div className="add-emoji">
        <Button type='secondary' onClick={() => {}} tooltip={["Not yet available", "use \\emoji"]}>
          ADD EMOJI
          <Icon icon='plus' size={16} />
        </Button>
      </div>
    </EmojiSearchContainer>
  );
});
