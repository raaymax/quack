import React, {
  useRef, useState, useCallback, useEffect, createContext, MutableRefObject,
} from 'react';
import { client } from '../../core';
import { InputModel } from '../../core/models/input';

declare global {
  interface Window {
    clipboardData: DataTransfer | null;
  }
}

export type InputContextType = {
  input: MutableRefObject<HTMLDivElement | null>;
  fileInput: MutableRefObject<HTMLInputElement| null>;
  onPaste: (e: React.ClipboardEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onInput: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentText: string;
  scope: string;
  scopeContainer: HTMLElement | undefined;
  replace: (regex: RegExp, text?: string) => void;
  wrapMatching: (regex: RegExp, wrapperTagName: string) => void;
  addFile: () => void;
  send: (e: React.SyntheticEvent) => void;
  getRange: () => Range;
  insert: (domNode: HTMLElement) => void;
  focus: (e?: Event) => void;
};

export const InputContext = createContext<InputContextType | null>(null);

function findScope(element: HTMLElement | null): { el: HTMLElement, scope: string } | null {
  let currentElement = element;
  while (currentElement !== null) {
    const scope = currentElement.getAttribute?.('data-scope');
    if (typeof scope === 'string') {
      return { el: currentElement, scope };
    }
    currentElement = currentElement.parentElement;
  }
  return null;
}

type InputContextProps = {
  children: React.ReactNode;
  model: InputModel;
};

export const InputProvider = (args: InputContextProps) => {
  const { children, model } = args;
  const [currentText, setCurrentText] = useState('');
  const [scope, setScope] = useState<string>('');
  const [scopeContainer, setScopeContainer] = useState<HTMLElement>();

  const input = useRef<HTMLDivElement | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [range, setRange] = useState<Range>(document.createRange());

  const getDefaultRange = useCallback((): Range => {
    if (!input.current) throw new Error('Input ref is not set');
    const r = document.createRange();
    r.setStart(input.current, 0);
    r.setEnd(input.current, 0);
    return r;
  }, [input]);

  const getRange = useCallback((): Range => {
    if (!input.current) throw new Error('Input ref is not set');
    const selection = document.getSelection();
    if (!selection || selection.type === 'None') {
      return getDefaultRange();
    }
    const r = selection.getRangeAt(0);
    if (input.current.contains(r.commonAncestorContainer)) {
      return r;
    }
    return range || getDefaultRange();
  }, [range, getDefaultRange]);

  const updateRange = useCallback(() => {
    const r = getRange();
    if (!r) return;
    setRange(r);
    if (r.endContainer.nodeName === '#text') {
      setCurrentText(r.endContainer.textContent?.slice(0, r.endOffset) ?? '');
    } else {
      setCurrentText('');
    }
    const { el, scope: s } = findScope(r.commonAncestorContainer as HTMLElement) || {};
    if (s && s !== scope) {
      setScope(s);
    }
    if (el) setScopeContainer(el);
  }, [getRange, setRange, scope, setScope, setCurrentText, setScopeContainer]);

  const onPaste = useCallback((event: React.ClipboardEvent) => {
    const cbData = (event.clipboardData || window.clipboardData);
    if (cbData.files?.length > 0) {
      event.preventDefault();
      model.files.uploadMany(cbData.files);
    }

    const rang = getRange();
    rang.deleteContents();

    cbData.getData('text').split('\n').reverse().forEach((line: string, idx: number) => {
      if (idx) rang.insertNode(document.createElement('br'));
      rang.insertNode(document.createTextNode(line));
    });
    document.getSelection()?.collapseToEnd();
    event.preventDefault();
    event.stopPropagation();
  }, [getRange, model.files]);


  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if ((e.target.files?.length ?? 0) > 0) {
      model.files.uploadMany(e.target.files as FileList);
      e.target.value = '';
    }
  }, [model.files]);

  const onInput = useCallback(() => {
    updateRange();
  }, [updateRange]);

  const focus = useCallback((e?: Event) => {
    if (!input.current) return;
    input.current.focus();
    if (!range) return;
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [input, range]);

  const send = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!input.current) return;
    model.send(input.current).then(() => {
      focus(e.nativeEvent);
    })
  }, [input, focus, model]);

  const wrapMatching = useCallback((regex: RegExp, wrapperTagName: string) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) {
       
      console.warn('No text selected.');
      return;
    }
    const rang = selection.getRangeAt(0);
    const { endContainer } = rang;

    if (endContainer.nodeType !== Node.TEXT_NODE) {
       
      console.warn('End container is not a text node.');
      return;
    }

    const { parentNode } = endContainer;
    let textContent = endContainer.textContent || '';
    const afterText = textContent.slice(rang.endOffset);
    textContent = textContent.slice(0, rang.endOffset);
    const documentFragment = document.createDocumentFragment();

    const match = regex.exec(textContent);

    if (match === null) return;
    const matchedText = match[1] || match[0];
    const matchedIndex = match.index;
    documentFragment.appendChild(document.createTextNode(textContent.substring(0, matchedIndex)));
    const wrapperElement = document.createElement(wrapperTagName);
    wrapperElement.appendChild(document.createTextNode(matchedText));
    documentFragment.appendChild(wrapperElement);
    textContent = textContent.substring(matchedIndex + match[0].length);
    const here = document.createTextNode(textContent || '\u00A0');
    documentFragment.appendChild(here);
    documentFragment.appendChild(document.createTextNode(afterText));
    parentNode?.replaceChild(documentFragment, endContainer);
    const sel = document.getSelection();
    const r = document.createRange();
    r.setEnd(here, 0);
    r.setStart(here, 0);
    sel?.removeAllRanges();
    sel?.addRange(r);
    updateRange();
  }, [updateRange]);

  const replace = useCallback((regex: RegExp, text = '') => {
    const rang = getRange();
    const node = rang.endContainer;
    const original = node.textContent ?? '';
    const replacement = original.slice(0, rang.endOffset).replace(regex, text);
    node.textContent = replacement + original.slice(rang.endOffset);
    const s = document.getSelection();
    const r = document.createRange();
    r.setStart(node, replacement.length);
    r.setEnd(node, replacement.length);
    s?.removeAllRanges();
    s?.addRange(r);
  }, [getRange]);

  const insert = useCallback((domNode: HTMLElement) => {
    const rang = getRange();
    rang.deleteContents();
    rang.insertNode(domNode);
    rang.collapse();
  }, [getRange]);

  const emitKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && scope === 'root') {
      return send(e);
    }
    client.api.notifyTyping(model.channelId, model.parentId || undefined);
    updateRange();
  }, [send, updateRange, scope, client, model]);

  const addFile = useCallback(() => {
    fileInput.current?.click();
  }, [fileInput]);

  useEffect(() => {
    document.addEventListener('selectionchange', updateRange);
    return () => document.removeEventListener('selectionchange', updateRange);
  }, [updateRange]);

  const api = {
    input,
    fileInput,
    onPaste,
    onKeyDown: emitKeyDown,
    emitKeyDown,
    onInput,
    onFileChange,
    currentText,
    scope,
    scopeContainer,
    replace,
    wrapMatching,
    addFile,

    send,
    getRange,
    insert,
    focus,
  };

  return (
    <InputContext.Provider value={api}>
      {children}
    </InputContext.Provider>
  );
};
