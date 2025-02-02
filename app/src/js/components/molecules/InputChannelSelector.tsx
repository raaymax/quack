import {
  useCallback, useEffect, useState, useMemo,
} from 'react';
import Fuse from 'fuse.js';
import { TextMenu } from './TextMenu';
import { useInput } from '../contexts/useInput';
import { observer } from 'mobx-react-lite';
import { useApp } from '../contexts/appState';

const SCOPE = 'channel';

export const ChannelSelector = observer(() => {
  const [selected, setSelected] = useState(0);
  const app = useApp();
  const {
    input, currentText, scope, insert, scopeContainer,
  } = useInput();
  const channels = app.channels.getAll(['PUBLIC', 'PRIVATE']);
  const fuse = useMemo(() => new Fuse(channels, {
    keys: ['name'],
    findAllMatches: true,
    includeMatches: true,
  }), [channels]);

  const options = useMemo(() => {
    let chan = fuse.search(currentText || '').slice(0, 5).map(({ item }) => item);
    chan = chan.length ? chan : channels.slice(0, 5);
    const opts = chan.map((channel) => ({
      name: channel.name,
      id: channel.id,
      icon: channel.isPrivate ? 'fa-solid fa-lock' : 'fa-solid fa-hashtag',
    }));
    return opts;
  }, [fuse, channels, currentText]);

  const create = useCallback((event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    const span = document.createElement('span');
    span.className = 'channel-selector';
    const text = document.createTextNode('#');
    span.appendChild(text);
    span.setAttribute('data-scope', SCOPE);
    insert(span);
  }, [insert]);

  const submit = useCallback((event: Event, opts?: {selected: number}) => {
    if (!scopeContainer) return;
    event.preventDefault();
    event.stopPropagation();
    scopeContainer.className = 'channel';
    scopeContainer.textContent = `#${options[opts?.selected ?? selected].name}`;
    scopeContainer.contentEditable = 'false';
    scopeContainer.setAttribute('channelId', options[opts?.selected ?? selected].id);
    const fresh = document.createTextNode('\u00A0');
    const r = document.createRange();
    r.setEndAfter(scopeContainer);
    r.setStartAfter(scopeContainer);
    r.insertNode(fresh);
    r.setStart(fresh, 1);
    r.setEnd(fresh, 1);
    const sel = document.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
  }, [options, selected, scopeContainer]);

  const remove = useCallback((event: Event) => {
    if (!scopeContainer) return;
    if (scopeContainer.textContent?.length === 1) {
      scopeContainer.remove();
      event.preventDefault();
      event.stopPropagation();
    }
  }, [scopeContainer]);

  const ctrl = useCallback((e: KeyboardEvent) => {
    if (scope === 'root' && currentText.match(/(^|\s)$/) && e.key === '#') {
      create(e);
    }
    if (scope === SCOPE) {
      if (e.key === ' ' || e.key === 'Space' || e.keyCode === 32 || e.key === 'Enter') {
        submit(e);
      }
      if (e.key === 'Backspace') {
        remove(e);
      }
    }
  }, [currentText, scope, create, remove, submit]);

  const onSelect = useCallback((idx: number, e: React.MouseEvent) => {
    submit(e.nativeEvent, { selected: idx });
  }, [submit]);

  useEffect(() => {
    if (!input.current) return;
    const { current } = input;
    current.addEventListener('keydown', ctrl);
    return () => {
      current.removeEventListener('keydown', ctrl);
    };
  }, [input, ctrl]);

  if (scope !== SCOPE) return null;

  return (
    <TextMenu open={true} options={options} onSelect={onSelect} selected={selected} setSelected={setSelected} />
  );
});
