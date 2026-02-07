import { useCallback, useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { TextMenu } from "./TextMenu";
import { useInput } from "../contexts/useInput";
import { observer } from "mobx-react-lite";

export type SelectorOption = {
  name: string;
  id: string;
  icon: string;
};

export type BaseInputSelectorConfig<T> = {
  scope: string;
  triggerKey: string;
  selectorClassName: string;
  resultClassName: string;
  attributeName: string;
  items: T[];
  fuseKeys: string[];
  mapOption: (item: T) => SelectorOption;
};

type BaseInputSelectorProps<T> = {
  config: BaseInputSelectorConfig<T>;
};

function BaseInputSelectorInner<T>({ config }: BaseInputSelectorProps<T>) {
  const {
    scope: SCOPE,
    triggerKey,
    selectorClassName,
    resultClassName,
    attributeName,
    items,
    fuseKeys,
    mapOption,
  } = config;

  const [selected, setSelected] = useState(0);
  const {
    input,
    currentText,
    scope,
    insert,
    scopeContainer,
  } = useInput();

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: fuseKeys,
        findAllMatches: true,
        includeMatches: true,
      }),
    [items, fuseKeys]
  );

  const options = useMemo(() => {
    let results = fuse
      .search(currentText || "")
      .slice(0, 5)
      .map(({ item }) => item);
    results = results.length ? results : items.slice(0, 5);
    return results.map(mapOption);
  }, [fuse, items, currentText, mapOption]);

  const create = useCallback(
    (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      const span = document.createElement("span");
      span.className = selectorClassName;
      const text = document.createTextNode(triggerKey);
      span.appendChild(text);
      span.setAttribute("data-scope", SCOPE);
      insert(span);
    },
    [insert, selectorClassName, triggerKey, SCOPE]
  );

  const submit = useCallback(
    (event: Event, opts?: { selected: number }) => {
      if (!scopeContainer) return;
      event.preventDefault();
      event.stopPropagation();
      const option = options[opts?.selected ?? selected];
      scopeContainer.className = resultClassName;
      scopeContainer.textContent = `${triggerKey}${option.name}`;
      scopeContainer.contentEditable = "false";
      scopeContainer.setAttribute(attributeName, option.id);
      const fresh = document.createTextNode("\u00A0");
      const r = document.createRange();
      r.setEndAfter(scopeContainer);
      r.setStartAfter(scopeContainer);
      r.insertNode(fresh);
      r.setStart(fresh, 1);
      r.setEnd(fresh, 1);
      const sel = document.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
    },
    [options, selected, scopeContainer, resultClassName, triggerKey, attributeName]
  );

  const remove = useCallback(
    (event: Event) => {
      if (!scopeContainer) return;
      if (scopeContainer.textContent?.length === 1) {
        scopeContainer.remove();
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [scopeContainer]
  );

  const ctrl = useCallback(
    (e: KeyboardEvent) => {
      if (scope === "root" && currentText.match(/(^|\s)$/) && e.key === triggerKey) {
        create(e);
      }
      if (scope === SCOPE) {
        if (
          e.key === " " ||
          e.key === "Space" ||
          e.keyCode === 32 ||
          e.key === "Enter"
        ) {
          submit(e);
        }
        if (e.key === "Backspace") {
          remove(e);
        }
      }
    },
    [currentText, scope, create, remove, submit, triggerKey, SCOPE]
  );

  const onSelect = useCallback(
    (idx: number, e: React.MouseEvent) => {
      submit(e.nativeEvent, { selected: idx });
    },
    [submit]
  );

  useEffect(() => {
    if (!input.current) return;
    const { current } = input;
    current.addEventListener("keydown", ctrl);
    return () => {
      current.removeEventListener("keydown", ctrl);
    };
  }, [input, ctrl]);

  if (scope !== SCOPE) return null;

  return (
    <TextMenu
      open
      options={options}
      onSelect={onSelect}
      selected={selected}
      setSelected={setSelected}
    />
  );
}

export const BaseInputSelector = observer(BaseInputSelectorInner) as typeof BaseInputSelectorInner;
